import type { Meta, StoryObj } from '@storybook/react';
declare function DemoApp(): import('react/jsx-runtime').JSX.Element;
declare const meta: Meta<typeof DemoApp>;
export default meta;
type Story = StoryObj<typeof DemoApp>;
export declare const Default: Story;
export declare const WithFlagEnabled: Story;
