// PageAction.node.ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IBinaryKeyData,
  INodePropertyOptions,
} from 'n8n-workflow';

import { nodeDescription } from './PageAction.node.options';
import {
  PageActionType,
  SelectorType,
  PageActionInputs,
  WaitOptions,
  TypeOptions,
  ScreenshotOptions,
  HtmlOptions,
  TextOptions,
} from './types';
import { PageActionExecutor } from './actions/index';
import { BrowserWheelBook } from '../BrowserWheelBook';

// Create a singleton instance of the browser manager
const globalBrowserManager = new BrowserWheelBook();

export class PageAction implements INodeType {
  description: INodeTypeDescription = nodeDescription;

  methods = {
    loadOptions: {
      // Updated method name to match the property in options file
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
    const executionId = this.getExecutionId();

    // Use the global browser manager instance
    const browserManager = globalBrowserManager;

    for (let i = 0; i < items.length; i++) {
      try {
        // Get browser name from dropdown or custom input
        const selectedBrowserName = this.getNodeParameter('browserName', i, '') as string;
        const customBrowserName = this.getNodeParameter('customBrowserName', i, '') as string;

        // Set browser name with priority: customBrowserName > selectedBrowserName > default
        // This allows custom browser name to override the dropdown selection
        let browserName: string;
        if (customBrowserName) {
          // If custom browser name is provided, it takes precedence
          browserName = customBrowserName;
        } else if (selectedBrowserName) {
          // Otherwise use the selected browser name if available
          browserName = selectedBrowserName;
        } else {
          // If both are empty, use the default
          browserName = `browser_exec_${executionId}`;
        }

        // Get the page ID, now using just the execution ID for consistency
        let pageId = this.getNodeParameter('pageId', i, '') as string;
        if (!pageId) {
          pageId = `page_exec_${executionId}`;
        }

        // Common parameters for all actions
        const actionType = this.getNodeParameter('action', i) as PageActionType;

        // Prepare the PageAction interface object
        const pageAction: PageActionInputs = {
          type: actionType,
          url:
            actionType === PageActionType.GOTO ? (this.getNodeParameter('url', i) as string) : '',
          selectorType: [
            PageActionType.WAIT_FOR_SELECTOR,
            PageActionType.CLICK,
            PageActionType.TEXT_INPUT,
            PageActionType.GET_TEXT,
          ].includes(actionType)
            ? (this.getNodeParameter('selectorType', i, SelectorType.CSS) as SelectorType)
            : undefined,
          selector: [
            PageActionType.WAIT_FOR_SELECTOR,
            PageActionType.CLICK,
            PageActionType.TEXT_INPUT,
            PageActionType.GET_TEXT,
          ].includes(actionType)
            ? (this.getNodeParameter('selector', i) as string)
            : '',
          waitOptions:
            actionType === PageActionType.WAIT_FOR_SELECTOR
              ? (this.getNodeParameter('waitOptions', i, {}) as WaitOptions)
              : {},
          text:
            actionType === PageActionType.TEXT_INPUT
              ? (this.getNodeParameter('text', i) as string)
              : '',
          typeOptions:
            actionType === PageActionType.TEXT_INPUT
              ? (this.getNodeParameter('typeOptions', i, {}) as TypeOptions)
              : {},
          screenshotOptions:
            actionType === PageActionType.SCREENSHOT
              ? (this.getNodeParameter('screenshotOptions', i, {}) as ScreenshotOptions)
              : {},
          htmlOptions:
            actionType === PageActionType.GET_HTML
              ? (this.getNodeParameter('htmlOptions', i, {}) as HtmlOptions)
              : {},
          textOptions:
            actionType === PageActionType.GET_TEXT
              ? (this.getNodeParameter('textOptions', i, {}) as TextOptions)
              : {},
        };

        // If HTML options contain a selector, check if there's a selector type specified
        if (actionType === PageActionType.GET_HTML && pageAction.htmlOptions?.selector) {
          const htmlOptions = this.getNodeParameter('htmlOptions', i, {}) as HtmlOptions;
          pageAction.htmlOptions.selectorType = htmlOptions.selectorType || SelectorType.CSS;
        }

        // Create executor with the global browserManager
        const actionExecutor = new PageActionExecutor(this, i, browserName, pageId, browserManager);

        const { result, binaryData } = await actionExecutor.executeAction(pageAction);

        returnData.push({
          json: {
            result,
            // Include the browser name in the output for clarity
            browserName,
            pageId,
          },
          binary: Object.keys(binaryData).length > 0 ? (binaryData as IBinaryKeyData) : undefined,
          pairedItem: { item: i },
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