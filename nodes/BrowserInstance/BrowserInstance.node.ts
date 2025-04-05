// BrowserInstance.node.ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  INodePropertyOptions,
} from 'n8n-workflow';

import { nodeDescription } from './BrowserInstance.node.options';
import { BrowserWheelAction, PageAction } from './types';
import { BrowserWheelBook } from '../BrowserWheelBook';

// Create a singleton instance of the browser manager
const globalBrowserManager = new BrowserWheelBook();

export class BrowserInstance implements INodeType {
  description: INodeTypeDescription = nodeDescription;


  methods = {
    loadOptions: {
      // Use arrow function to properly bind 'this' context
      getBrowserNameSuggestions: async (): Promise<INodePropertyOptions[]> => {
        const names = await globalBrowserManager.getEternalBrowserNames();
        return names.map((value) => ({
          name: value.charAt(0).toUpperCase() + value.slice(1),
          value,
        }));
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Get the current execution ID for default names/IDs
    const executionId = this.getExecutionId();

    // Use the global browser manager
    const browserManager = globalBrowserManager;

    for (let i = 0; i < items.length; i++) {
      try {
        const browserAction = this.getNodeParameter('browserAction', i) as BrowserWheelAction;

        // Get browser name from dropdown or custom input
        const selectedBrowserName = this.getNodeParameter('browserName', i, '') as string;
        const customBrowserName = this.getNodeParameter('customBrowserName', i, '') as string;

        // Set default browser name with priority: selectedBrowserName > customBrowserName > default
        let browserName: string = selectedBrowserName;
        if (!browserName) {
          browserName = customBrowserName || `browser_exec_${executionId}`;
        }

        let result: any = {};

        if (browserAction === BrowserWheelAction.LIST) {
          // Handle LIST action - get all browsers
          const browsers = await browserManager.listAllBrowsers();
          
          result = {
            success: true,
            action: BrowserWheelAction.LIST,
            browsers: browsers.map(browser => ({
              ...browser,
              createdAt: browser.createdAt.toISOString(),
            })),
            count: browsers.length,
            eternalCount: browsers.filter(b => b.isEternal).length,
            temporaryCount: browsers.filter(b => !b.isEternal).length,
          };
        } else if (browserAction === BrowserWheelAction.START) {
          // Handle Start Browser Action
          const headless = this.getNodeParameter(
            'headless',
            i,
            process.env.NODE_ENV === 'production',
          ) as boolean;

          try {
            // Use the global browserManager reference
            await browserManager.resetBrowserInstance(browserName, headless);
            result = {
              success: true,
              browserName,
              pageId: '', // No page action performed
              action: BrowserWheelAction.START,
              message: `Browser instance '${browserName}' started successfully`,
            };
          } catch (error) {
            throw new NodeOperationError(
              this.getNode(),
              `Error starting browser instance for name '${browserName}': ${error instanceof Error ? error.message : String(error)}`,
              { itemIndex: i },
            );
          }
        } else if (browserAction === BrowserWheelAction.STOP) {
          // Handle Stop Browser Action
          let pageId = this.getNodeParameter('pageId', i, '') as string;

          // If pageId is empty, use executionId as default
          if (!pageId) {
            pageId = `page_exec_${executionId}`;
          }

          try {
            if (pageId) {
              // If pageId is provided, just close the specific page
              // Use the global browserManager reference
              const success = await browserManager.cleanPage(browserName, pageId);

              result = {
                success,
                browserName,
                pageId,
                action: PageAction.CLOSE,
                message: success
                  ? `Page '${pageId}' deleted successfully`
                  : `Page '${pageId}' not found or already deleted`,
              };
            } else {
              // Get the force clean parameter
              const forceClean = this.getNodeParameter('forceClean', i, false) as boolean;
              
              // If no pageId, close the entire browser
              // Use the global browserManager reference with force clean option
              await browserManager.cleanupInstance(browserName, forceClean);

              result = {
                success: true,
                browserName,
                pageId: '',
                action: BrowserWheelAction.STOP,
                forceClean,
                message: `Browser instance '${browserName}' stopped successfully${forceClean ? ' (forced)' : ''}`,
              };
            }

            // Add development delay
            if (process.env.NODE_ENV === 'development') {
              console.log('[DEV] Waiting 60 seconds after action...');
              await new Promise((resolve) => setTimeout(resolve, 60000));
            }
          } catch (error) {
            throw new NodeOperationError(
              this.getNode(),
              `Error with browser '${browserName}': ${error instanceof Error ? error.message : String(error)}`,
              { itemIndex: i },
            );
          }
        }

        returnData.push({
          json: result,
          pairedItem: {
            item: i,
          },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error instanceof Error ? error.message : String(error),
            },
            pairedItem: {
              item: i,
            },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}