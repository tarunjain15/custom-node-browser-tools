import { PageActionExecutor } from '.';
import type { PageActionInputs } from '../types';
import { PageActionType, SelectorType } from '../types';
import { ActionHandler } from './ActionHandler';

export class WaitForSelectorActionHandler extends ActionHandler {
  type = PageActionType.WAIT_FOR_SELECTOR;

  async execute(executor: PageActionExecutor, action: PageActionInputs): Promise<void> {
    if (!action.selector) {
      throw executor.createError('Selector is required for WAIT_FOR_SELECTOR action', 0);
    }

    const waitSelector = action.selector;
    const selectorType = action.selectorType || SelectorType.CSS;
    const waitOptions = action.waitOptions || {};
    const timeout = waitOptions.timeout ?? 30000;
    const visible = waitOptions.visible ?? true;
    const hidden = waitOptions.hidden ?? false;

    try {
      const startTime = performance.now();

      // Wait for the element based on selector type
      if (selectorType === SelectorType.XPATH) {
        await executor.page!.waitForSelector(`xpath/${waitSelector}`, {
          timeout,
          visible,
          hidden,
        });
      } else {
        await executor.page!.waitForSelector(waitSelector, {
          timeout,
          visible,
          hidden,
        });
      }

      const duration = performance.now() - startTime;

      executor.results.push({
        success: true,
        action: 'waitForSelector',
        selector: waitSelector,
        message: `Found element with ${selectorType} selector: ${waitSelector}`,
        duration: Math.round(duration),
        pageId: executor.pageId ?? undefined,
      });
    } catch (error) {
      throw executor.createError(
        `Wait for selector failed on ${selectorType} selector "${waitSelector}": ${
          error instanceof Error ? error.message : String(error)
        }`,
        0,
      );
    }
  }
}