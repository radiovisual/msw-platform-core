import type { Preview } from "@storybook/react";
import { initialize, mswDecorator } from "msw-storybook-addon";

initialize({
  onUnhandledRequest: "bypass",
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export const decorators = [mswDecorator];

export default preview;
