// Jest setup file to mock TextEncoder and fetch API globals for jsdom environment
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.Response === 'undefined') {
  const fetch = require('node-fetch');
  global.Response = fetch.Response;
  global.Request = fetch.Request;
  global.Headers = fetch.Headers;
}
if (typeof global.BroadcastChannel === 'undefined') {
    global.BroadcastChannel = class {
      constructor() {}
      postMessage() {}
      close() {}
      addEventListener() {}
      removeEventListener() {}
      onmessage = null;
    };
  }