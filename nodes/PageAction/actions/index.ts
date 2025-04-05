// PageAction/actions/index.ts
import { ActionHandler } from './ActionHandler';
import { GotoActionHandler } from './GotoActionHandler';
import { WaitForSelectorActionHandler } from './WaitForSelectorActionHandler';
import { ScreenshotActionHandler } from './ScreenshotActionHandler';
import { GetHtmlActionHandler } from './GetHtmlActionHandler';
import { GetTextActionHandler } from './GetTextActionHandler';
import { PageActionType, SelectorType } from '../types';
import { PageActionInputs } from '../types';
import { ElementHandle, HTTPResponse, Page } from 'puppeteer';
import { IBrowserManager } from '../../IBrowserManager';
import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { TextInputActionHandler } from './TextInputActionHandler';
import { ClickActionHandler } from './ClickActionHandler';

// Define the ActionResult interface here since it was missing from the types.ts file
export interface ActionResult {
  success: boolean;
  action: string;
  message?: string;
  error?: string;
  selector?: string;
  url?: string;
  duration?: number;
  statusCode?: number;
  finalUrl?: string;
  pageId?: string;
  html?: string;
  extractedText?: string;
  [key: string]: unknown;
}

export class PageActionExecutor {
  public page: Page | null = null;
  public binaryData: { [key: string]: unknown } = {};
  public results: ActionResult[] = [];
  public browserManager: IBrowserManager;
  public pageId: string;
  
  constructor(
    private executeFunctions: IExecuteFunctions,
    private itemIndex: number,
    private browserKey: string,
    pageId: string,
    browserManager: IBrowserManager,
  ) {
    this.browserManager = browserManager;
    this.pageId = pageId;
  }

  // Rest of the class remains the same
  public createNavigationPromise(): Promise<void | HTTPResponse | null> {
    return this.page!.waitForNavigation({
      waitUntil: 'networkidle0',
      timeout: 30000,
    }).catch(() => {
      // Navigation didn't occur or timed out, which is fine
      // We're just setting up this promise to catch any navigation that might happen
    });
  }

  public async waitForElement(
    selector: string,
    selectorType: SelectorType = SelectorType.CSS,
    options: { timeout?: number; visible?: boolean; hidden?: boolean } = {},
  ): Promise<ElementHandle<Element> | null> {
    const timeout = options.timeout ?? 30000;
    const visible = options.visible ?? true;
    const hidden = options.hidden ?? false;

    try {
      if (selectorType === SelectorType.XPATH) {
        // Use the new locator API with xpath/ prefix
        await this.page!.waitForSelector(`xpath/${selector}`, { timeout, visible, hidden });
        return await this.page!.$(`xpath/${selector}`);
      } else {
        // Use CSS selector normally
        return await this.page!.waitForSelector(selector, { timeout, visible, hidden });
      }
    } catch (error) {
      console.error('Error waiting for element:', {
        selector,
        selectorType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private actionHandlers: Record<string, ActionHandler> = {
    [PageActionType.GOTO]: new GotoActionHandler(),
    [PageActionType.WAIT_FOR_SELECTOR]: new WaitForSelectorActionHandler(),
    [PageActionType.CLICK]: new ClickActionHandler(),
    [PageActionType.TEXT_INPUT]: new TextInputActionHandler(),
    [PageActionType.SCREENSHOT]: new ScreenshotActionHandler(),
    [PageActionType.GET_HTML]: new GetHtmlActionHandler(),
    [PageActionType.GET_TEXT]: new GetTextActionHandler(),
  };

  /**
   * Adds a random delay before executing an action
   */
  public async addRandomDelay(min = 500, max = 2000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Creates a NodeOperationError with proper context
   */
  public createError(message: string, actionIndex: number): NodeOperationError {
    return new NodeOperationError(this.executeFunctions.getNode(), message, {
      itemIndex: this.itemIndex,
      description: `Action index ${actionIndex}`,
    });
  }

  async executeAction(
    action: PageActionInputs,
  ): Promise<{ result: ActionResult; binaryData: { [key: string]: unknown } }> {
    console.log(`[Action Start] Type: ${action.type}, Item Index: ${this.itemIndex}`);

    // Retry logic for getPage - some actions might be timing out due to page creation issues
    let retries = 0;
    const maxRetries = 3;
    let lastError;

    while (retries < maxRetries) {
      try {
        const { page } = await this.browserManager.getPage(this.browserKey, this.pageId);
        this.page = page;
        console.log(`Page obtained - URL: ${page.url()}, Closed: ${page.isClosed()}`);

        // Add a longer random delay for slower servers
        // This helps avoid race conditions and improves stability
        const minDelay = process.env.NODE_ENV === 'production' ? 1000 : 500;
        const maxDelay = process.env.NODE_ENV === 'production' ? 3000 : 2000;
        await this.addRandomDelay(minDelay, maxDelay);

        const handler = this.actionHandlers[action.type];
        if (!handler) {
          throw new Error(`Unsupported action type: ${action.type}`);
        }

        // Set a timeout for the action execution to prevent hanging
        let actionTimeout: NodeJS.Timeout;
        const timeoutPromise = new Promise<never>((_, reject) => {
          actionTimeout = setTimeout(() => {
            reject(new Error(`Action ${action.type} timed out after 180 seconds`));
          }, 180000); // 3 minute timeout
        });

        try {
          // Execute the action with a timeout
          await Promise.race([
            handler.execute(this, action),
            timeoutPromise
          ]);
        } finally {
          clearTimeout(actionTimeout!);
        }

        console.log(`[Action Complete] ${action.type} executed successfully`);
        return { result: this.results[0], binaryData: this.binaryData };
      } catch (error) {
        lastError = error;
        retries++;
        
        // Log the error
        console.error(
          `[Action Failed] ${action.type} error (attempt ${retries}/${maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        
        // If we've hit max retries or it's an error we shouldn't retry, break out
        if (
          retries >= maxRetries || 
          (error instanceof Error && 
            (error.message.includes('Protocol error') || error.message.includes('Target closed')))
        ) {
          break;
        }
        
        // Otherwise, wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retries - 1)));
      }
    }

    // If we get here, all retries failed
    const result: ActionResult = {
      success: false,
      action: action.type,
      error: lastError instanceof Error ? lastError.message : String(lastError),
      pageId: this.pageId,
    };

    if (!this.executeFunctions.continueOnFail()) throw lastError;
    return { result, binaryData: this.binaryData };
  }
}