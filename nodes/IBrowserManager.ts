import { Browser, Page } from 'puppeteer';

export type BrowserInstance = {
  browser: Browser;
  pages: Map<string, Page>;
};

export interface IBrowserManager {
  getBrowserInstance(browserKey: string): Promise<BrowserInstance>;
  createBrowserInstance(browserKey: string, headless: boolean): Promise<BrowserInstance>;
  getPage(browserKey: string, pageId: string): Promise<{ page: Page; pageId: string }>;
  cleanPage(browserKey: string, pageId: string): Promise<boolean>;
  cleanupInstance(browserInstanceKey: string): Promise<void>;
  resetBrowserInstance(browserKey: string, headless: boolean): Promise<BrowserInstance>;
  closeAllInstances(): Promise<void>;
  getEternalBrowserNames(): string[];
}