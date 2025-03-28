import { INodeTypeDescription } from 'n8n-workflow';
import { PageActionType, SelectorType } from './types';

export const nodeDescription: INodeTypeDescription = {
	displayName: 'Page Action',
	name: 'pageAction',
	group: ['browser'],
	version: 1,
	description: 'Perform actions on browser pages',
	icon: 'file:icon.svg',
	defaults: {
		name: 'Page Action',
	},
	// @ts-ignore
	inputs: ['main'],
	// @ts-ignore
	outputs: ['main'],
	properties: [
		{
			displayName: 'Browser Name',
			name: 'browserName',
			type: 'string',
			default: '',
			placeholder: 'my_browser',
			description:
				'Name of the browser instance to use. If you leave this empty, a default name will be used based on the execution ID.',
		},
		{
			displayName: 'Page ID',
			name: 'pageId',
			type: 'string',
			default: '',
			placeholder: 'my_page',
			description:
				'Identifier for the page to operate on. If you leave this empty, a default ID will be used based on the execution ID.',
		},
		{
			displayName: 'Action',
			name: 'action',
			type: 'options',
			default: '',
			default: PageActionType.GOTO,
			options: [
				{
					name: 'Go to URL',
					value: PageActionType.GOTO,
					description: 'Navigate to a specified URL',
				},
				{
					name: 'Click Element',
					value: PageActionType.CLICK,
					description: 'Click on an element in the page',
				},
				{
					name: 'Input Text',
					value: PageActionType.TEXT_INPUT,
					description: 'Type text into an input field',
				},
				{
					name: 'Wait for Element',
					value: PageActionType.WAIT_FOR_SELECTOR,
					description: 'Wait for an element to appear in the page',
				},
				{
					name: 'Take Screenshot',
					value: PageActionType.SCREENSHOT,
					description: 'Capture a screenshot of the page',
				},
				{
					name: 'Get HTML',
					value: PageActionType.GET_HTML,
					description: 'Get the HTML content of the page or a specific element',
				},
				{
					name: 'Get Text',
					value: PageActionType.GET_TEXT,
					description: 'Get the text content of an element',
				},
			],
		},

		// URL Action parameters
		{
			displayName: 'URL',
			name: 'url',
			type: 'string',
			default: '',
			placeholder: 'https://www.example.com',
			description: 'The URL to navigate to',
			required: true,
			displayOptions: {
				show: {
					action: [PageActionType.GOTO],
				},
			},
		},

		// Selector type (common for click, text input, wait, get text)
		{
			displayName: 'Selector Type',
			name: 'selectorType',
			type: 'options',
			default: '',
			default: SelectorType.CSS,
			options: [
				{
					name: 'CSS Selector',
					value: SelectorType.CSS,
					description: 'Use CSS selectors to target elements',
				},
				{
					name: 'XPath',
					value: SelectorType.XPATH,
					description: 'Use XPath to target elements',
				},
			],
			description: 'The type of selector to use for targeting elements',
			displayOptions: {
				show: {
					action: [
						PageActionType.CLICK,
						PageActionType.TEXT_INPUT,
						PageActionType.WAIT_FOR_SELECTOR,
						PageActionType.GET_TEXT,
					],
				},
			},
		},

		// Element selector (common for click, text input, wait, get text)
		{
			displayName: 'Selector',
			name: 'selector',
			type: 'string',
			default: '',
			placeholder: '#submit-button or //button[@ID="submit"]',
			description: 'The selector to identify the target element',
			required: true,
			displayOptions: {
				show: {
					action: [
						PageActionType.CLICK,
						PageActionType.TEXT_INPUT,
						PageActionType.WAIT_FOR_SELECTOR,
						PageActionType.GET_TEXT,
					],
				},
			},
		},

		// Wait for selector options
		{
			displayName: 'Wait Options',
			name: 'waitOptions',
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			options: [
				{
					displayName: 'Timeout (Ms)',
					name: 'timeout',
					type: 'number',
					default: 30000,
					description: 'Maximum time to wait in milliseconds',
				},
				{
					displayName: 'Wait Until Visible',
					name: 'visible',
					type: 'boolean',
					default: false,
					description: 'Wait until the element is visible in the DOM and on-screen',
				},
				{
					displayName: 'Wait Until Hidden',
					name: 'hidden',
					type: 'boolean',
					default: false,
					description: 'Wait until the element is not present in the DOM or is hidden',
				},
			],
			displayOptions: {
				show: {
					action: [PageActionType.WAIT_FOR_SELECTOR],
				},
			},
		},

		// Text input options
		{
			displayName: 'Text',
			name: 'text',
			type: 'string',
			default: '',
			description: 'The text to type into the selected element',
			required: true,
			displayOptions: {
				show: {
					action: [PageActionType.TEXT_INPUT],
				},
			},
		},
		{
			displayName: 'Type Options',
			name: 'typeOptions',
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			options: [
				{
					displayName: 'Delay (Ms)',
					name: 'delay',
					type: 'number',
					default: 0,
					description: 'Delay between key presses in milliseconds (0 for no delay)',
				},
			],
			displayOptions: {
				show: {
					action: [PageActionType.TEXT_INPUT],
				},
			},
		},

		// Screenshot options
		{
			displayName: 'Screenshot Options',
			name: 'screenshotOptions',
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			options: [
				{
					displayName: 'Full Page',
					name: 'fullPage',
					type: 'boolean',
					default: false,
					description: 'When true, takes a screenshot of the full scrollable page',
				},
				{
					displayName: 'Output Field Name',
					name: 'outputFieldName',
					type: 'string',
					default: 'screenshot',
					description: 'The name of the binary field to store the screenshot in',
				},
				{
					displayName: 'Encoding',
					name: 'encoding',
					type: 'options',
					default: 'binary',
					options: [
						{
							name: 'Binary',
							value: 'binary',
							description: 'Return the screenshot as binary data',
						},
						{
							name: 'Base64',
							value: 'base64',
							description: 'Return the screenshot as a Base64 encoded string',
						},
					],
					description: 'The encoding of the screenshot output',
				},
			],
			displayOptions: {
				show: {
					action: [PageActionType.SCREENSHOT],
				},
			},
		},

		// HTML options
		{
			displayName: 'HTML Options',
			name: 'htmlOptions',
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			options: [
				{
					displayName: 'Element Selector',
					name: 'selector',
					type: 'string',
					default: '',
					description: 'Optional: Get HTML of a specific element instead of the entire page',
				},
				{
					displayName: 'Selector Type',
					name: 'selectorType',
					type: 'options',
					default: '',
					default: SelectorType.CSS,
					options: [
						{
							name: 'CSS Selector',
							value: SelectorType.CSS,
							description: 'Use CSS selectors to target elements',
						},
						{
							name: 'XPath',
							value: SelectorType.XPATH,
							description: 'Use XPath to target elements',
						},
					],
					description: 'The type of selector to use for targeting elements',
				},
				{
					displayName: 'Include Outer HTML',
					name: 'includeOuterHTML',
					type: 'boolean',
					default: true,
					description: 'Include the element\'s outer HTML (when a selector is specified)',
				},
			],
			displayOptions: {
				show: {
					action: [PageActionType.GET_HTML],
				},
			},
		},

		// Text options
		{
			displayName: 'Text Options',
			name: 'textOptions',
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			options: [
				{
					displayName: 'Trim',
					name: 'trim',
					type: 'boolean',
					default: true,
					description: 'Trim whitespace from the beginning and end of the extracted text',
				},
			],
			displayOptions: {
				show: {
					action: [PageActionType.GET_TEXT],
				},
			},
		},
	],
};