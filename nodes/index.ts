import { BrowserInstance } from './BrowserInstance/BrowserInstance.node';
import { PageAction } from './PageAction/PageAction.node';

export { BrowserInstance } from './BrowserInstance/BrowserInstance.node';
export { PageAction } from './PageAction/PageAction.node';

// Export the nodes in the format expected by n8n
export const nodes = [
  new BrowserInstance(),
  new PageAction(),
];