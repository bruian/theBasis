// https://eslint.org/docs/user-guide/configuring

module.exports = {
	root: true,
	parserOptions: {
		parser: 'babel-eslint',
	},
	env: {
		browser: true,
	},
	extends: [
		// https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
		// consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
		'plugin:vue/essential',
		'airbnb-base',
		'prettier',
	],
	// required to lint *.vue files
	plugins: ['vue'],
	// add your custom rules here
	rules: {
		// allow async-await
		'generator-star-spacing': 'off',
		// allow debugger during development
		'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'generator-star-spacing': 'off',
		'no-else-return': 'off',
		camelcase: 'off',
		'no-plusplus': 'off',
		'no-param-reassign': 'off',
		'prefer-const': 'off',
		'prefer-destructuring': 'off',
		'no-lonely-if': 'off',
		'no-bitwise': 'off',
		'no-useless-escape': 'off',
		'operator-assignment': 'off',
	},
};
