import { ActionHandler } from './ActionHandler';
import type { PageActionInputs } from '../types';
import { PageActionType, SelectorType } from '../types';
import type { PageActionExecutor } from '.';

export class GetTextActionHandler extends ActionHandler {
  type = PageActionType.GET_TEXT;

  async execute(executor: PageActionExecutor, action: PageActionInputs): Promise<void> {
    if (!action.selector) {
      throw executor.createError('Selector is required for GET_TEXT action', 0);
    }

    const textSelector = action.selector;
    const selectorType = action.selectorType || SelectorType.CSS;
    const textOptions = action.textOptions || {};
    const trim = textOptions.trim ?? true;

    try {
      const element = await executor.waitForElement(textSelector, selectorType, { visible: true });

      if (!element) {
        throw executor.createError(
          `Element not found with ${selectorType} selector: ${textSelector}`,
          0,
        );
      }

      // Extract text content based on selector type
      let extractedText = '';

      if (selectorType === SelectorType.XPATH) {
        extractedText = await executor.page!.evaluate((sel) => {
          const result = document.evaluate(
            sel,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          );
          const element = result.singleNodeValue;
          if (!element) return '';

          // Try innerText first (for visible text), fallback to textContent
          if (element instanceof HTMLElement) {
            return element.innerText || element.textContent || '';
          } else {
            // For text nodes and other non-HTMLElements
            return element.textContent || '';
          }
        }, textSelector);
      } else {
        extractedText = await executor.page!.evaluate(
          (sel, shouldTrim) => {
            const element = document.querySelector(sel);
            if (!element) return '';

            // Intelligently choose between innerText and textContent
            let text = '';
            if (element instanceof HTMLElement) {
              text = element.innerText || element.textContent || '';
            } else {
              text = element.textContent || '';
            }

            return shouldTrim ? text.trim() : text;
          },
          textSelector,
          trim,
        );
      }

      // Apply trimming if needed (for XPath selectors)
      if (selectorType === SelectorType.XPATH && trim) {
        extractedText = extractedText.trim();
      }

      executor.results.push({
        success: true,
        action: 'getText',
        selector: textSelector,
        message: `Extracted text from element with ${selectorType} selector: ${textSelector}`,
        extractedText,
        pageId: executor.pageId,
      });
    } catch (error) {
      throw executor.createError(
        `Text extraction failed on ${selectorType} selector "${textSelector}": ${
          error instanceof Error ? error.message : String(error)
        }`,
        0,
      );
    }
  }
}