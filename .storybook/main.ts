import type { StorybookConfig } from "@storybook/react-webpack5";
import { initialize, mswDecorator } from "msw-storybook-addon";

initialize({
  onUnhandledRequest: "bypass",
});

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-onboarding",
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  webpackFinal: async (config) => {
    // Add PostCSS loader for Tailwind
    if (config?.module?.rules) {
      config.module.rules.push({
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: require.resolve('../postcss.config.js'),
              },
            },
          },
        ],
        include: /src/,
      });
    }
    return config;
  },
};

export const decorators = [mswDecorator];

export default config;
