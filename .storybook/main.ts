import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	addons: [
		'@storybook/addon-webpack5-compiler-swc',
		'@storybook/addon-essentials',
		'@chromatic-com/storybook',
		'@storybook/addon-interactions',
	],
	framework: {
		name: '@storybook/react-webpack5',
		options: {},
	},
	staticDirs: ['./public'],
	webpackFinal: async config => {
		// Add LESS support
		config.module?.rules?.push({
			test: /\.less$/,
			use: ['style-loader', 'css-loader', 'less-loader'],
		});

		return config;
	},
};

export default config;
