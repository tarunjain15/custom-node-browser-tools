/**
 * @type {import('@types/eslint').ESLint.ConfigData}
 */
module.exports = {
	extends: [
		"./.eslintrc.js",
		"plugin:@typescript-eslint/recommended"
	],
	
	parser: "@typescript-eslint/parser",
	
	plugins: [
		"@typescript-eslint",
	],

	rules: {
		// Add stricter rules for prepublish
		// Allow console statements in development but warn about them
		"no-console": process.env.NODE_ENV === 'production' ? "error" : "warn",
		"prefer-const": "error",
		"@typescript-eslint/no-explicit-any": "warn",
		"@typescript-eslint/no-unused-vars": "error",
		"@typescript-eslint/explicit-function-return-type": "off", // Turn off if too strict
		// Allow ts-expect-error comments which we need for n8n compatibility
		"@typescript-eslint/ban-ts-comment": ["error", {
			"ts-expect-error": "allow-with-description",
			"minimumDescriptionLength": 10
		}],
	},

	overrides: [
		{
			files: ['package.json'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			rules: {
				'n8n-nodes-base/community-package-json-name-still-default': 'error',
			},
		},
		// Add specific rules for node files
		{
			files: ['nodes/**/*.ts'],
			rules: {
				// Disable problematic input/output checks
				'n8n-nodes-base/node-class-description-inputs-wrong': 'off',
				'n8n-nodes-base/node-class-description-outputs-wrong': 'off',
				'n8n-nodes-base/node-execute-block-missing-continue-on-fail': 'error',
				// Disable the default missing warning since we have some specific cases
				'n8n-nodes-base/node-param-default-missing': 'off',
				// Disable the filename convention check if you prefer your current structure
				'n8n-nodes-base/node-filename-against-convention': 'off',
				'n8n-nodes-base/node-param-description-boolean-without-whether': 'error',
			}
		}
	],
};