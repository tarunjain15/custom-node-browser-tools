import { INodeTypeDescription } from 'n8n-workflow';
import { BrowserWheelAction } from './types';

export const nodeDescription: INodeTypeDescription = {
	displayName: 'Browser Instance',
	name: 'browserInstance',
	group: ['browser'],
	version: 1,
	description: 'Start and control browser instances',
	icon: 'file:icon.svg',
	defaults: {
		name: 'Browser Instance',
	},
	// @ts-expect-error - n8n expects string literal 'main' but TypeScript expects NodeConnectionType
	inputs: ['main'],
	// @ts-expect-error - n8n expects string literal 'main' but TypeScript expects NodeConnectionType
	outputs: ['main'],
	properties: [
		{
			displayName: 'Browser Action is:',
			name: 'browserAction',
			type: 'options',
			default: BrowserWheelAction.START,
			options: [
				{
					name: 'Start Browser',
					value: BrowserWheelAction.START,
					description: 'Start a new browser instance or reset an existing one',
				},
				{
					name: 'Stop Browser',
					value: BrowserWheelAction.STOP,
					description: 'Stop a browser instance or close a specific page',
				},
				{
					name: 'List Browsers',
					value: BrowserWheelAction.LIST,
					description: 'List all active browser instances with their details',
				},
			],
		},
		{
			displayName: 'Browser Name or ID',
			name: 'browserName',
			type: 'options',
			typeOptions: {
				loadOptionsMethod: 'getBrowserNameSuggestions',
				loadOptionsDependsOn: [],
			},
			default: '',
			description: 'Name of the browser instance to use. Select an eternal browser or leave empty to use a custom name. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		},
		{
			displayName: 'Custom Browser Name',
			name: 'customBrowserName',
			type: 'string',
			default: '',
			placeholder: 'my_browser',
			description:
				'A unique identifier for the browser instance. This overrides any selected Browser Name above. If both fields are empty, a default name will be used based on the execution ID.',
		},
		// START action options
		{
			displayName: 'Headless Mode',
			name: 'headless',
			type: 'boolean',
			default: true,
			description:
				'Whether to run the browser in headless mode (without visible UI). Disable for debugging purposes.',
			displayOptions: {
				show: {
					browserAction: [BrowserWheelAction.START],
				},
			},
		},
		// STOP action options
		{
			displayName: 'Page ID',
			name: 'pageId',
			type: 'string',
			default: '',
			placeholder: 'my_page',
			description:
				'The ID of the specific page to close. If left empty, the entire browser instance will be closed.',
			displayOptions: {
				show: {
					browserAction: [BrowserWheelAction.STOP],
				},
			},
		},
		{
			displayName: 'Force Clean',
			name: 'forceClean',
			type: 'boolean',
			default: false,
			description:
				'Whether to force close the browser even if it is an eternal browser. Use with caution.',
			displayOptions: {
				show: {
					browserAction: [BrowserWheelAction.STOP],
				},
			},
		},
	],
};
