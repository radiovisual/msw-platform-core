"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockUI = exports.storybookHandlersFromPlatform = exports.mswHandlersFromPlatform = exports.InMemoryPersistence = exports.MockPlatformCore = exports.createMockPlatform = void 0;
__exportStar(require("./types"), exports);
var platform_1 = require("./platform");
Object.defineProperty(exports, "createMockPlatform", { enumerable: true, get: function () { return platform_1.createMockPlatform; } });
Object.defineProperty(exports, "MockPlatformCore", { enumerable: true, get: function () { return platform_1.MockPlatformCore; } });
Object.defineProperty(exports, "InMemoryPersistence", { enumerable: true, get: function () { return platform_1.InMemoryPersistence; } });
var msw_1 = require("./adapters/msw");
Object.defineProperty(exports, "mswHandlersFromPlatform", { enumerable: true, get: function () { return msw_1.mswHandlersFromPlatform; } });
var storybook_1 = require("./adapters/storybook");
Object.defineProperty(exports, "storybookHandlersFromPlatform", { enumerable: true, get: function () { return storybook_1.storybookHandlersFromPlatform; } });
var MockUI_1 = require("./ui/MockUI");
Object.defineProperty(exports, "MockUI", { enumerable: true, get: function () { return __importDefault(MockUI_1).default; } });
