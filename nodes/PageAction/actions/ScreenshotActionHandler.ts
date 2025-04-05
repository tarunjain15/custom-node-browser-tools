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
      // Add a longer delay before screenshot to ensure page is fully rendered
      console.log('Adding a longer delay before screenshot to ensure page is fully loaded');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Wait for the page to be properly loaded
      const page = executor.page;

      try {
        // Wait for network to be idle using a more generous timeout
        console.log('Waiting for network to be idle before taking screenshot');
        await page.waitForNavigation({
          waitUntil: 'networkidle0',
          timeout: 10000,
        });
      } catch (err) {
        // Ignore navigation timeout - might not be navigating
        console.log('Navigation timeout during screenshot preparation - continuing anyway');
      }

      try {
        // Wait for content to be fully loaded
        console.log('Checking if page is fully loaded');
        await page.evaluate(() => {
          return new Promise((resolve) => {
            if (document.readyState === 'complete') {
              return resolve(true);
            }

            window.addEventListener('load', () => resolve(true), { once: true });
            
            // Also resolve after 2 seconds as a fallback
            setTimeout(() => resolve(true), 2000);
          });
        });
        
        // Additional waiting for any animations or delayed content
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (err) {
        console.log(`DOM ready check failed, continuing anyway: ${err.message}`);
      }
      
      // Wait for all images to load
      try {
        console.log('Waiting for all images to load');
        await page.evaluate(() => {
          return new Promise((resolve) => {
            const images = document.querySelectorAll('img');
            if (images.length === 0) return resolve(true);
            
            let loadedImages = 0;
            const imageLoaded = () => {
              loadedImages++;
              if (loadedImages === images.length) {
                resolve(true);
              }
            };
            
            images.forEach(img => {
              if (img.complete) {
                imageLoaded();
              } else {
                img.addEventListener('load', imageLoaded, { once: true });
                img.addEventListener('error', imageLoaded, { once: true });
              }
            });
            
            // Fallback timeout after 3 seconds
            setTimeout(() => resolve(true), 3000);
          });
        });
      } catch (err) {
        console.log(`Image loading check failed, continuing anyway: ${err.message}`);
      }

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