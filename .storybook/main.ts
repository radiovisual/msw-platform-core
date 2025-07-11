import type { StorybookConfig } from '@storybook/react-webpack5';
import { initialize, mswDecorator } from 'msw-storybook-addon';

initialize({
	onUnhandledRequest: 'bypass',
});

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
};

export const decorators = [mswDecorator];

export default config;
