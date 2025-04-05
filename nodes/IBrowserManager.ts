import { Browser, Page } from 'puppeteer';

export type BrowserInstance = {
  browser: Browser;
  pages: Map<string, Page>;
};

export interface BrowserInfo {
  name: string;
  createdAt: Date;
  isEternal: boolean;
  pageCount: number;
  headless: boolean;
}

export interface IBrowserManager {
  getBrowserInstance(browserKey: string): Promise<BrowserInstance>;
  createBrowserInstance(browserKey: string, headless: boolean): Promise<BrowserInstance>;
  getPage(browserKey: string, pageId: string): Promise<{ page: Page; pageId: string }>;
  cleanPage(browserKey: string, pageId: string): Promise<boolean>;
  cleanupInstance(browserInstanceKey: string, forceClean?: boolean): Promise<void>;
  resetBrowserInstance(browserKey: string, headless: boolean): Promise<BrowserInstance>;
  closeAllInstances(): Promise<void>;
  getEternalBrowserNames(): string[];
  
  // New methods for browser management
  listAllBrowsers(): Promise<BrowserInfo[]>;
  forceCloseEternalBrowser(browserKey: string): Promise<boolean>;
}