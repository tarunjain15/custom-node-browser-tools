import { PageActionExecutor } from '.';
import type { PageActionInputs } from '../types';
import { PageActionType } from '../types';
import { ActionHandler } from './ActionHandler';

export class GotoActionHandler extends ActionHandler {
  type = PageActionType.GOTO;

  async execute(executor: PageActionExecutor, action: PageActionInputs): Promise<void> {
    if (!action.url) {
      throw executor.createError('URL is required for GOTO action', 0);
    }

    try {
      const startTime = performance.now();
      const response = await executor.page!.goto(action.url, {
        waitUntil: 'networkidle0',
        timeout: 60000,
      });
      const duration = performance.now() - startTime;

      executor.results.push({
        success: true,
        action: 'goto',
        url: action.url,
        message: `Navigated to URL: ${action.url}`,
        duration: Math.round(duration),
        statusCode: response?.status(),
        finalUrl: executor.page?.url(),
        pageId: executor.pageId,
      });
    } catch (error) {
      throw executor.createError(
        `GOTO failed: ${error instanceof Error ? error.message : String(error)}`,
        0,
      );
    }
  }
}