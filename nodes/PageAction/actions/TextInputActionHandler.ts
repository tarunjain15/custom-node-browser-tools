import { ActionHandler } from './ActionHandler';
import type { PageActionInputs } from '../types';
import { PageActionType, SelectorType } from '../types';
import type { PageActionExecutor } from './index';

export class TextInputActionHandler extends ActionHandler {
  type = PageActionType.TEXT_INPUT;

  async execute(executor: PageActionExecutor, action: PageActionInputs): Promise<void> {
    if (!action.selector) {
      throw executor.createError('Selector is required for TEXT_INPUT action', 0);
    }

    if (!action.text) {
      throw executor.createError('Text is required for TEXT_INPUT action', 0);
    }

    const typeSelector = action.selector;
    const selectorType = action.selectorType || SelectorType.CSS;
    const text = action.text;
    const typeOptions = action.typeOptions || {};

    try {
      const page = executor.page!;

      // Wait for the element to exist on the page
      if (selectorType === SelectorType.XPATH) {
        await page.waitForSelector(`xpath/${typeSelector}`, { visible: true });
      } else {
        await page.waitForSelector(typeSelector, { visible: true });
      }

      // Instead of evaluating on the element handle, execute directly in page context
      // This avoids the JavaScript world context error
      if (selectorType === SelectorType.XPATH) {
        await page.evaluate(
          (selector, inputText) => {
            const element = document.evaluate(
              selector,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null,
            ).singleNodeValue;

            if (!element) {
              throw new Error(`Element not found with XPath selector: ${selector}`);
            }

            // Check if element is editable
            const isDisabled = (element as HTMLElement).hasAttribute('disabled');
            const isReadonly = (element as HTMLElement).hasAttribute('readonly');
            const isEditable =
              !isDisabled &&
              !isReadonly &&
              ((element as HTMLElement).matches('input, textarea') ||
                (element as HTMLElement).getAttribute('contenteditable') === 'true');

            if (!isEditable) {
              throw new Error(`Element is not editable: ${selector}`);
            }

            // Clear the input field
            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
              element.value = '';
            } else if ((element as HTMLElement).getAttribute('contenteditable') === 'true') {
              (element as HTMLElement).textContent = '';
            }

            // Focus the element
            (element as HTMLElement).focus();
          },
          typeSelector,
          text,
        );

        // Use keyboard typing after focus (in page context)
        await executor.addRandomDelay(100, 300);
        await page.keyboard.type(text, { delay: typeOptions.delay ?? 50 });
      } else {
        // For CSS selectors, we can use the standard approach
        const element = await page.$(typeSelector);
        if (!element) {
          throw executor.createError(`Element not found with CSS selector: ${typeSelector}`, 0);
        }

        // Check if element is editable
        const isEditable = await element.evaluate((el) => {
          const isDisabled = el.hasAttribute('disabled');
          const isReadonly = el.hasAttribute('readonly');
          return (
            !isDisabled &&
            !isReadonly &&
            (el.matches('input, textarea') || el.getAttribute('contenteditable') === 'true')
          );
        });

        if (!isEditable) {
          throw executor.createError(`Element is not editable: ${typeSelector}`, 0);
        }

        // Clear and focus
        await element.click({ delay: 50 });
        await element.evaluate((el) => {
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            el.value = '';
          } else if (el.getAttribute('contenteditable') === 'true') {
            el.textContent = '';
          }
        });

        // Add a delay and type
        await executor.addRandomDelay(100, 300);
        await element.focus();
        await page.keyboard.type(text, { delay: typeOptions.delay ?? 50 });
      }

      // Create navigation promise to catch any form submissions
      const navigationPromise = executor.createNavigationPromise();

      // Wait for potential navigation
      await navigationPromise;

      executor.results.push({
        success: true,
        action: 'type',
        selector: typeSelector,
        text,
        message: `Typed text into element with ${selectorType} selector: ${typeSelector}`,
        pageId: executor.pageId,
      });
    } catch (error) {
      throw executor.createError(
        `Type failed on ${selectorType} selector "${typeSelector}": ${
          error instanceof Error ? error.message : String(error)
        }`,
        0,
      );
    }
  }
}