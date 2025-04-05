// BrowserWheelBook.ts
import { Page, Browser } from 'puppeteer';
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

    // Optimized launch options for better performance and stability
    const launchOptions = {
      headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Prevents crashes in resource-constrained environments
        '--disable-accelerated-2d-canvas', // Less resource usage
        '--disable-gpu', // Less resource usage
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security', // Avoid cross-origin issues
        '--window-size=1280,800', // Consistent viewport
        `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36`,
      ],
      ignoreHTTPSErrors: true, // Avoid SSL issues
      defaultViewport: { width: 1280, height: 800 }, // Consistent viewport
      timeout: 60000, // Increased browser launch timeout
    };

    // Add more time for browser launch on production servers
    const timeout = process.env.NODE_ENV === 'production' ? 60000 : 30000;
    
    // Launch browser with timeout
    let browser: Browser;
    try {
      // TypeScript needs help with the Promise.race typing
      browser = await Promise.race([
        puppeteer.launch(launchOptions) as Promise<Browser>,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Browser launch timed out after ${timeout}ms`)), timeout)
        )
      ]);
    } catch (error) {
      console.error(`Failed to launch browser for key ${browserKey}:`, error);
      throw error;
    }

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

    // Retry page creation up to 3 times if it fails
    let retries = 0;
    const maxRetries = 3;
    let lastError;

    while (retries < maxRetries) {
      try {
        const browser = instance.browser;
        const page: Page = await browser.newPage();
        
        // Configure page for better performance and stability
        await Promise.all([
          page.setViewport({ width: 1280, height: 800 }),
          page.setDefaultNavigationTimeout(120000), // Increase default navigation timeout
          page.setDefaultTimeout(60000), // Increase default timeout for other operations
          
          // We'll leave resource loading intact to avoid blank screenshots
          // The performance optimization that was here could cause issues with screenshots
        ]);

        // Add error handling for page-level errors
        page.on('error', (err) => {
          console.error(`Page error in browser ${browserKey}, page ${pageId}:`, err);
        });

        instance.pages.set(pageId, page);
        return { page, pageId: pageId };
      } catch (error) {
        lastError = error;
        retries++;
        console.error(`Failed to create page (attempt ${retries}/${maxRetries}):`, error);
        // Add exponential backoff delay
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
      }
    }

    throw new Error(`Failed to create page after ${maxRetries} attempts: ${lastError}`);
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
      
      try {
        // Close all open pages with a timeout
        for (const [pageId, page] of instance.pages.entries()) {
          try {
            if (!page.isClosed()) {
              await Promise.race([
                page.close(),
                new Promise(resolve => setTimeout(resolve, 5000))
              ]);
            }
          } catch (pageError) {
            console.error(`Error closing page ${pageId}:`, pageError);
            // Continue with other pages despite errors
          }
        }
        
        // Clear the pages map
        instance.pages.clear();
        
        // Close the browser with a timeout
        await Promise.race([
          instance.browser.close(),
          new Promise(resolve => setTimeout(resolve, 10000))
        ]);
      } catch (error) {
        console.error(`Error during browser cleanup for ${browserInstanceKey}:`, error);
        // Continue with cleanup despite errors
      } finally {
        // Always remove the instance from the map
        BrowserWheelBook.instances.delete(browserInstanceKey);
      }
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