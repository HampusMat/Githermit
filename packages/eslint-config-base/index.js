module.exports = {
	rules: {
		"no-console": "off",
		"no-debugger": "off",
		"array-bracket-spacing": [
			"error",
			"always"
		],
		"array-bracket-newline": [ "warn", "consistent" ],
		"array-element-newline": "off",
		"arrow-body-style": "off",
		"arrow-parens": [
			"error",
			"as-needed"
		],
		"arrow-spacing": [
			"error",
			{
				after: true,
				before: true
			}
		],
		"brace-style": [ "error", "stroustrup", { allowSingleLine: false } ],
		camelcase: "off",
		"capitalized-comments": [
			"error",
			"always"
		],
		"comma-spacing": [
			"error",
			{
				after: true,
				before: false
			}
		],
		"comma-style": [
			"error",
			"last"
		],
		"comma-dangle": [ "error", "never" ],
		"computed-property-spacing": [
			"error",
			"never"
		],
		curly: [ "error", "all" ],
		"dot-notation": "off",
		"eol-last": [
			"error",
			"never"
		],
		eqeqeq: "error",
		"func-names": "off",
		"func-style": [ "error", "declaration" ],
		"id-length": "off",
		"implicit-arrow-linebreak": [
			"error",
			"beside"
		],
		indent: [ "warn", "tab" ],
		"keyword-spacing": [ "error", {
			before: false,
			overrides: {
				from: { before: true },
				for: { after: false },
				if: { after: false },
				throw: { after: false },
				while: { after: false }
			}
		} ],
		"linebreak-style": [
			"error",
			"unix"
		],
		"line-comment-position": [ "error", { position: "above" } ],
		"max-len": "off",
		"max-lines": [ "error", 600 ],
		"max-params": [ "error", 6 ],
		"max-statements": "off",
		"multiline-comment-style": [ "error", "bare-block" ],
		"no-await-in-loop": "off",
		"no-control-regex": "off",
		"no-else-return": [
			"error",
			{
				allowElseIf: true
			}
		],
		"no-extra-parens": "off",
		"no-magic-numbers": "off",
		"no-tabs": "off",
		"no-ternary": "off",
		"no-underscore-dangle": [ "error", { allowAfterThis: true } ],
		"no-var": "error",
		"object-curly-spacing": [
			"error",
			"always"
		],
		"object-shorthand": "off",
		"one-var": "off",
		"padded-blocks": "off",
		"prefer-arrow-callback": "off",
		"prefer-const": "off",
		"prefer-destructuring": "off",
		"prefer-template": "off",
		"quote-props": [ "error", "as-needed" ],
		quotes: [ "error", "double" ],
		semi: [ "error", "always" ],
		"semi-style": [
			"error",
			"last"
		],
		"sort-keys": "off",
		"space-before-function-paren": [ "error", "never" ],
		"space-in-parens": [
			"error",
			"never"
		],
		"spaced-comment": [
			"error",
			"always"
		],
		strict: [
			"error",
			"never"
		],
		"template-curly-spacing": [
			"error",
			"never"
		],
		"unicode-bom": [
			"error",
			"never"
		],
		yoda: [
			"error",
			"never"
		]
	}
};