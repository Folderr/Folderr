/* eslint-disable @typescript-eslint/naming-convention */
module.exports = {
	extends: [
		"plugin:vue/vue3-recommended",
		"xo",
		"xo-typescript",
		"plugin:prettier/recommended",
	],
	parser: "vue-eslint-parser",
	parserOptions: {
		parser: "@typescript-eslint/parser",
		project: [
			"./tsconfig.json",
			"src/frontend/tsconfig.json",
			".eslintrc.js",
		],
		extraFileExtensions: [".vue"],
	},
	plugins: ["optimize-regex", "unicorn"],
	rules: {
		indent: "off",
		"@typescript-eslint/indent": "off",
		"max-len": [
			"error",
			{
				code: 100,
				comments: 100,
				ignoreUrls: true,
			},
		],
		"vue/multi-word-component-names": "warn",
		"no-underscore-dangle": "error",
		"unicorn/prefer-node-protocol": "off",
		"import/extensions": "off",
		"prettier/prettier": [
			"error",
			{},
			{
				endOfLine: "auto",
				useTabs: true,
				tabWidth: 4,
			},
		],
	},
};
