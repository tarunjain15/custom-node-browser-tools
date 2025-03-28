// BrowserWheelBook.ts
import { Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { IBrowserManager, BrowserInstance } from './IBrowserManager';

export enum EternalBrowserName {
  CHATGPT = 'chatgpt',
  PERPLEXITY = 'perplexity',
  SENSIBULL = 'sensibull',
  GROK = 'grok',
}

export class BrowserWheelBook implements IBrowserManager {
  private static instances: Map<string, BrowserInstance> = new Map();

  private validateBrowserName(browserKey: string): void {
    if (!browserKey || browserKey.trim() === '') {
      throw new Error(
        'Browser key must be a non-empty string and cannot consist of only whitespace',
      );
    }
  }

  private isEternalBrowser(browserKey: string): boolean {
    return Object.values(EternalBrowserName).includes(browserKey as EternalBrowserName);
  }

  async getBrowserInstance(browserKey: string): Promise<BrowserInstance> {
    this.validateBrowserName(browserKey);
    if (BrowserWheelBook.instances.has(browserKey)) {
      return BrowserWheelBook.instances.get(browserKey)!;
    }
    throw new Error(`Browser instance not found for key: ${browserKey}`);
  }

  async createBrowserInstance(
    browserKey: string,
    headless: boolean = true,
  ): Promise<BrowserInstance> {
    this.validateBrowserName(browserKey);
    if (BrowserWheelBook.instances.has(browserKey)) {
      throw new Error(`Browser instance already exists for key: ${browserKey}`);
    }

    // Use stealth plugin for less-detectable automation.
    puppeteer.use(StealthPlugin());

    const launchOptions = {
      headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36`,
      ],
    };

    const browser = await puppeteer.launch(launchOptions);
    const instance: BrowserInstance = {
      browser,
      pages: new Map(),
    };

    BrowserWheelBook.instances.set(browserKey, instance);
    return instance;
  }

  async getPage(browserKey: string, pageId: string): Promise<{ page: Page; pageId: string }> {
    this.validateBrowserName(browserKey);
    const instance: BrowserInstance = await this.getBrowserInstance(browserKey);
    // If pageId is provided and exists in the map, return the existing page
    if (instance.pages.has(pageId)) {
      const existingPage = instance.pages.get(pageId)!;
      // Check if the page is still valid and not closed
      if (!existingPage.isClosed()) {
        return { page: existingPage, pageId };
      }
      // If page is closed, remove it from the map
      instance.pages.delete(pageId);
    }

    const browser = instance.browser;
    const page: Page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    instance.pages.set(pageId, page);
    return { page, pageId: pageId };
  }

  async cleanPage(browserKey: string, pageId: string): Promise<boolean> {
    this.validateBrowserName(browserKey);
    if (!BrowserWheelBook.instances.has(browserKey)) {
      throw new Error(`Browser instance not found for key: ${browserKey}`);
    }

    const instance = BrowserWheelBook.instances.get(browserKey)!;

    if (!instance.pages.has(pageId)) {
      throw new Error(`Page ID ${pageId} not found in browser instance`);
    }

    const page = instance.pages.get(pageId)!;

    if (!page.isClosed()) {
      await page.close();
    }

    instance.pages.delete(pageId);
    return true;
  }

  async cleanupInstance(browserInstanceKey: string): Promise<void> {
    this.validateBrowserName(browserInstanceKey);

    // Skip cleanup for eternal browsers
    if (this.isEternalBrowser(browserInstanceKey)) {
      console.log(`Skipping cleanup for eternal browser: ${browserInstanceKey}`);
      return;
    }

    if (BrowserWheelBook.instances.has(browserInstanceKey)) {
      const instance = BrowserWheelBook.instances.get(browserInstanceKey)!;
      // Close all open pages.
      for (const page of instance.pages.values()) {
        if (!page.isClosed()) await page.close();
      }
      await instance.browser.close();
      BrowserWheelBook.instances.delete(browserInstanceKey);
    }
  }

  async resetBrowserInstance(browserKey: string, headless: boolean): Promise<BrowserInstance> {
    this.validateBrowserName(browserKey);

    // For eternal browsers, only reset if it doesn't exist yet
    if (this.isEternalBrowser(browserKey)) {
      if (BrowserWheelBook.instances.has(browserKey)) {
        // Return the existing instance for eternal browsers instead of resetting
        return BrowserWheelBook.instances.get(browserKey)!;
      }
    } else {
      // Clean up existing instance if it exists and is not eternal
      if (BrowserWheelBook.instances.has(browserKey)) {
        await this.cleanupInstance(browserKey);
      }
    }

    // Create and return a new instance
    return this.createBrowserInstance(browserKey, headless);
  }

  async closeAllInstances(): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key, instance] of BrowserWheelBook.instances) {
      // Skip eternal browsers
      if (this.isEternalBrowser(key)) {
        console.log(`Skipping closure of eternal browser: ${key}`);
        continue;
      }

      for (const page of instance.pages.values()) {
        if (!page.isClosed()) await page.close();
      }
      await instance.browser.close();
      keysToDelete.push(key);
    }

    // Delete the non-eternal browsers from the instances map
    for (const key of keysToDelete) {
      BrowserWheelBook.instances.delete(key);
    }
  }

  getEternalBrowserNames(): string[] {
    return Object.values(EternalBrowserName);
  }
}