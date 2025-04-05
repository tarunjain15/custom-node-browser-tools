import { ActionHandler } from './ActionHandler';
import type { PageActionInputs } from '../types';
import { PageActionType } from '../types';
import type { PageActionExecutor } from './index';

export class ScreenshotActionHandler extends ActionHandler {
  type = PageActionType.SCREENSHOT;

  async execute(executor: PageActionExecutor, action: PageActionInputs): Promise<void> {
    if (!executor.page) {
      throw executor.createError('Page is not available for SCREENSHOT action', 0);
    }

    const screenshotOptions = action.screenshotOptions || {};
    const outputFieldName = screenshotOptions.outputFieldName ?? 'screenshot';
    const encoding = screenshotOptions.encoding ?? 'binary';

    try {
      // Add a delay before screenshot to ensure page is rendered
      await executor.addRandomDelay(500, 1000);

      // Wait for the page to be properly loaded
      const page = executor.page;

      // First wait for network to be idle
      await page
        .waitForNavigation({
          waitUntil: 'networkidle0',
          timeout: 5000,
        })
        .catch(() => {
          // Ignore navigation timeout - might not be navigating
          console.log('Navigation timeout during screenshot preparation - continuing');
        });

      // Then ensure DOM content is loaded
      await page
        .evaluate(() => {
          return new Promise((resolve) => {
            if (document.readyState === 'complete') {
              return resolve(true);
            }

            const onLoad = () => {
              document.removeEventListener('DOMContentLoaded', onLoad);
              resolve(true);
            };

            document.addEventListener('DOMContentLoaded', onLoad);
          });
        })
        .catch((err) => {
          console.log(`DOM ready check failed, continuing anyway: ${err.message}`);
        });

      // Take the screenshot
      const screenshotBuffer = await page.screenshot({
        fullPage: screenshotOptions.fullPage ?? false,
        type: 'png',
        omitBackground: false,
      });

      // Convert Buffer to base64 string
      const base64Data = screenshotBuffer.toString('base64');

      // Store the screenshot data
      executor.binaryData[outputFieldName] = {
        data: base64Data,
        mimeType: 'image/png',
        fileName: `screenshot-${Date.now()}.png`,
      };

      // Record the success
      executor.results.push({
        success: true,
        action: 'screenshot',
        message: 'Took screenshot of the page',
        outputFieldName,
        encoding,
        pageId: executor.pageId,
      });

      console.log(`Screenshot saved to field: ${outputFieldName}`);
    } catch (error) {
      throw executor.createError(
        `Screenshot action failed: ${error instanceof Error ? error.message : String(error)}`,
        0,
      );
    }
  }
}