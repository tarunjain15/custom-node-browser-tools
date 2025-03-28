import type {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class BrowserToolsApi implements ICredentialType {
	// This is a placeholder credential that isn't actually used by the nodes
	// but exists to satisfy the linting configuration
	name = 'browserToolsApi';
	displayName = 'Browser Tools API';
	documentationUrl = 'https://example.com/docs/browser-tools';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials.apiKey}}',
			},
		},
	};
}
