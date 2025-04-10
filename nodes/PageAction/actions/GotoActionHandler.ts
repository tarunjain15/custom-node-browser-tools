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
      
      // Increase timeout to 120 seconds but keep networkidle0 for complete page loading
      // This is important for screenshot functionality to work correctly
      const response = await executor.page!.goto(action.url, {
        waitUntil: 'networkidle0',
        timeout: 120000,
      });
      
      // Add a small safety delay to ensure page is fully loaded
      // This helps with stability on slower servers
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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