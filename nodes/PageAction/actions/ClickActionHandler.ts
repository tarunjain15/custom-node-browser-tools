// ClickActionHandler.ts
import { ActionHandler } from './ActionHandler';
import { PageActionType, SelectorType } from '../types';
import type { PageActionInputs } from '../types';
import type { PageActionExecutor } from './index';

export class ClickActionHandler extends ActionHandler {
  type = PageActionType.CLICK;

  async execute(executor: PageActionExecutor, action: PageActionInputs): Promise<void> {
    if (!action.selector) {
      throw executor.createError('Selector is required for CLICK action', 0);
    }

    const clickSelector = action.selector;
    const selectorType = action.selectorType || SelectorType.CSS;

    try {
      const element = await executor.waitForElement(clickSelector, selectorType, { visible: true });

      if (!element) {
        throw executor.createError(
          `Element not found with ${selectorType} selector: ${clickSelector}`,
          0,
        );
      }

      // Add a small delay to ensure proper execution context
      await executor.addRandomDelay(100, 300);

      // Create navigation promise before clicking to catch any navigation
      const navigationPromise = executor.createNavigationPromise();

      // Click using the element handle directly
      await element.click({
        delay: 50, // Add human-like delay
      });

      // Wait for potential navigation
      await navigationPromise;

      executor.results.push({
        success: true,
        action: 'click',
        selector: clickSelector,
        message: `Clicked on element with ${selectorType} selector: ${clickSelector}`,
        pageId: executor.pageId, // Would come from context
      });
    } catch (error) {
      throw executor.createError(
        `Click failed on ${selectorType} selector "${clickSelector}": ${
          error instanceof Error ? error.message : String(error)
        }`,
        0,
      );
    }
  }
}