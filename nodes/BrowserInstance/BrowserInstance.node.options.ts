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
			displayName: 'Browser Action',
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
			],
		},
		{
			displayName: 'Browser name is:',
			name: 'browserName',
			type: 'string',
			default: '',
			placeholder: 'my_browser',
			description:
				'A unique identifier for the browser instance. If you leave this empty, a default name will be used based on the execution ID.',
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
	],
};