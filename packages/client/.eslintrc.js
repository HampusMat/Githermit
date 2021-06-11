module.exports = {
	root: true,
	env: {
		node: true
	},
	extends: [
		"plugin:vue/vue3-strongly-recommended",
		"@vue/standard"
	],
	parserOptions: {
		parser: "babel-eslint"
	},
	ignorePatterns: [ "/src/util/*" ],
	rules: {
		"no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
		"no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
		curly: "warn",
		"array-bracket-newline": [ "warn", "consistent" ],
		"array-bracket-spacing": [ "warn", "always" ],
		"capitalized-comments": [ "warn", "always" ],
		"implicit-arrow-linebreak": [ "warn", "beside" ],
		indent: [ "warn", "tab" ],
		"linebreak-style": [ "warn", "unix" ],
		"comma-dangle": [ "error", "never" ],
		semi: [ "error", "always" ],
		"no-var": "error",
		quotes: [ "error", "double" ],
		"quote-props": [ "error", "as-needed" ],
		"space-before-function-paren": [ "error", "never" ],
		camelcase: "off",
		"no-tabs": "off",
		"keyword-spacing": [ "error", {
			overrides: {
				if: { after: false },
				for: { after: false },
				while: { after: false }
			}
		} ],
		"vue/max-attributes-per-line": [ "warn", {
			singleline: {
				max: 2,
				allowFirstLine: true
			},
			multiline: {
				max: 2,
				allowFirstLine: false
			}
		} ],
		"vue/html-closing-bracket-newline": [ "error", {
			singleline: "never",
			multiline: "never"
		} ],
		"vue/html-indent": [ "error", "tab" ]
	}
};
