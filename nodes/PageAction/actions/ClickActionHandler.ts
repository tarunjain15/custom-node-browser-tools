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
    const page = executor.page!;
    const startTime = performance.now();

    try {
      // Create navigation promise before clicking to catch any navigation
      const navigationPromise = executor.createNavigationPromise();
      
      let success = false;
      
      // First try faster direct methods for better performance
      if (selectorType === SelectorType.CSS) {
        try {
          // Try the more performant page.click() first
          await page.click(clickSelector, { delay: 50 });
          success = true;
          console.log('Used optimized CSS click method');
        } catch (e) {
          console.log('Falling back to standard element click for CSS', e);
        }
      }
      
      if (!success && selectorType === SelectorType.XPATH) {
        try {
          // Try direct evaluation for XPath for better performance
          const clicked = await page.evaluate((xpath) => {
            const element = document.evaluate(
              xpath, 
              document, 
              null, 
              XPathResult.FIRST_ORDERED_NODE_TYPE, 
              null
            ).singleNodeValue;
            
            if (element && 'click' in element) {
              (element as HTMLElement).click();
              return true;
            }
            return false;
          }, clickSelector);
          
          if (clicked) {
            // Wait a bit to ensure the click registered
            await new Promise(resolve => setTimeout(resolve, 100));
            success = true;
            console.log('Used optimized XPath click method');
          }
        } catch (e) {
          console.log('Falling back to standard element click for XPath', e);
        }
      }
      
      // If the optimized methods didn't work, fall back to the original method
      if (!success) {
        const element = await executor.waitForElement(clickSelector, selectorType, { visible: true });

        if (!element) {
          throw executor.createError(
            `Element not found with ${selectorType} selector: ${clickSelector}`,
            0,
          );
        }

        // Add a small delay to ensure proper execution context
        await executor.addRandomDelay(100, 300);

        // Click using the element handle directly
        await element.click({
          delay: 50, // Add human-like delay
        });
      }

      // Wait for potential navigation
      await navigationPromise;
      
      const duration = performance.now() - startTime;

      executor.results.push({
        success: true,
        action: 'click',
        selector: clickSelector,
        duration: Math.round(duration),
        message: `Clicked on element with ${selectorType} selector: ${clickSelector}`,
        pageId: executor.pageId,
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