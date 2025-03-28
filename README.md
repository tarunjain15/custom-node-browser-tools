# Browser Tools for n8n

This package contains custom nodes for [n8n](https://n8n.io) that provide browser automation capabilities. The nodes allow you to control browser instances and perform various page actions using Puppeteer.

## Nodes

This package includes the following nodes:

1. **Browser Instance**: Control browser instances for automation
   - Start and stop browser sessions
   - Manage browser pages
   - Configure headless/non-headless mode

2. **Page Action**: Perform actions within browser pages
   - Navigate to URLs
   - Click elements
   - Input text
   - Wait for selectors
   - Take screenshots
   - Extract HTML and text content

## Prerequisites

- [n8n](https://n8n.io) (version 0.214.0 or later)
- Node.js (version 18 or later)

## Installation

1. Navigate to the n8n installation directory
2. Install the package:
   ```
   npm install @tarunjain15/custom-node-browser-tools
   ```

3. Start n8n

## Usage

After installation, the Browser Tools nodes will be available in your n8n instance. You can use them in workflows to automate browser interactions.

### Sample Workflow

1. Use a "Browser Instance" node to start a new browser session
2. Use a "Page Action" node to navigate to a URL
3. Use additional "Page Action" nodes to perform actions like clicking buttons, filling forms, etc.
4. Finally, use another "Browser Instance" node to close the browser when finished

## License

[MIT](LICENSE.md)