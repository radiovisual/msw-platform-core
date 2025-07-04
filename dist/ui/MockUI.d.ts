import type { MockPlatformCore } from "../platform";
interface MockUIProps {
    platform: MockPlatformCore;
    onStateChange?: (opts: {
        disabledPluginIds: string[];
    }) => void;
    groupStorageKey?: string;
    disabledPluginIdsStorageKey?: string;
}
export default function MockUI({ platform, onStateChange, groupStorageKey, disabledPluginIdsStorageKey }: MockUIProps): import("react/jsx-runtime").JSX.Element;
export {};
