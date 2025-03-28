import { ActionHandler } from './ActionHandler';
import type { PageActionInputs } from '../types';
import { PageActionType, SelectorType } from '../types';
import type { PageActionExecutor } from '.';

export class GetHtmlActionHandler extends ActionHandler {
  type = PageActionType.GET_HTML;

  async execute(executor: PageActionExecutor, action: PageActionInputs): Promise<void> {
    const htmlOptions = action.htmlOptions || {};
    const includeOuterHTML = htmlOptions.includeOuterHTML ?? true;
    const selector = htmlOptions.selector || null;
    const selectorType = htmlOptions.selectorType || SelectorType.CSS;
    const timeout = 30000; // Default timeout of 30 seconds

    try {
      // Wait for the page to be fully loaded
      // First wait for navigation to complete
      try {
        await executor.page!.waitForNavigation({
          waitUntil: 'networkidle0',
          timeout,
        });
      } catch (e) {
        console.log('Network idle timeout - continuing with current page state');
      }

      // Additional wait for any dynamic content to settle
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(
        `Navigation wait error: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Continue with extraction despite wait errors - the page might still be usable
    }

    let html: string;

    try {
      console.log(`Retrieving HTML${selector ? ' for selector: ' + selector : ''}`);
      if (selector) {
        // Get HTML of a specific element based on selector type
        if (selectorType === SelectorType.XPATH) {
          // For XPath selector
          await executor.page!.waitForSelector(`xpath/${selector}`, { timeout: 5000 });
          html = await executor.page!.evaluate((sel, includeOuter) => {
            const result = document.evaluate(
              sel,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null,
            );
            const element = result.singleNodeValue as Element;
            return element ? (includeOuter ? element.outerHTML : element.innerHTML) : '';
          }, selector, includeOuterHTML);
        } else {
          // Get HTML of a specific element using CSS selector
          await executor.page!.waitForSelector(selector, { timeout: 5000 });
          html = await executor.page!.evaluate((sel, includeOuter) => {
            const element = document.querySelector(sel);
            return element ? (includeOuter ? element.outerHTML : element.innerHTML) : '';
          }, selector, includeOuterHTML);
        }

        if (!html) {
          throw executor.createError(
            `Element with ${selectorType} selector "${selector}" found but has no HTML content`,
            0,
          );
        }
      } else {
        // Get the full page HTML
        html = await executor.page!.content();
      }

      executor.results.push({
        success: true,
        action: 'getHtml',
        message: selector
          ? `Retrieved HTML for element with ${selectorType} selector: ${selector}`
          : 'Retrieved full page HTML',
        selector: selector || undefined,
        html,
        pageId: executor.pageId,
      });
    } catch (error) {
      throw executor.createError(
        `Failed to get HTML${selector ? ` for ${selectorType} selector "${selector}"` : ''}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        0,
      );
    }
  }
}