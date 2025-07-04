# Mock Service Worker (MSW) API Reference

Comprehensive cheat sheet for using `msw` in browser & Node.js, focusing on HTTP method handlers, setup, and best practices. Only use this guide as an example of the MSW API for MSW v2+.

## 🔧 Installation & Initialization

```bash
npm install msw --save-dev
npx msw init <PUBLIC_DIR> --save
```

* `msw init` generates `mockServiceWorker.js` in your public directory.

## 🌐 HTTP Handler API (`http` namespace)

Used for REST-style HTTP requests.

### Syntax

```typescript
http.<method>(predicate, resolver, options?)
```

### Supported Methods

* `http.get()`, `http.post()`, `http.put()`, `http.patch()`, `http.delete()`, `http.head()`, `http.options()`
* `http.all()` for any method

### Examples

```typescript
import { http, HttpResponse } from 'msw';

http.get('/user/:id', ({ params }) => {
  return HttpResponse.json({ id: params.id, name: 'Alice' });
});

http.post('/login', async ({ request }) => {
  const body = await request.formData();
  return HttpResponse.text('Logged in ' + body.get('username'));
});

http.delete('/items/:itemId', ({ params }) => HttpResponse.json({ deleted: params.itemId }));
```

## 🧪 Response Helpers: `HttpResponse`

* `HttpResponse.json(body, init?)`
* `HttpResponse.text(body, init?)`
* `HttpResponse.error()`

## 🌍 Browser Integration

### Setup Worker

`src/mocks/browser.js`

```typescript
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### Enable Mocking

```typescript
async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') return;
  const { worker } = await import('./mocks/browser');
  await worker.start({
    serviceWorker: { url: '/mockServiceWorker.js' },
    onUnhandledRequest: 'warn', // or 'bypass', 'error'
    quiet: false,
    waitUntilReady: true
  });
}

enableMocking().then(() => {
  ReactDOM.render(<App />, root);
});
```

## ⚙️ Bypass Real Requests

```typescript
http.get('/user', async ({ request }) => {
  const [input, init] = bypass(request);
  const res = await fetch(input, init);
  const data = await res.json();
  return HttpResponse.json({ ...data, extra: true });
});
```

## 🧪 Node.js Integration

### Setup Server

`src/mocks/node.js`

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Use in Code

```typescript
import { server } from './mocks/node';
server.listen();
```

### Use in Tests

```typescript
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/node';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Event Subscriptions

```typescript
server.events.on('request:start', ({ request }) => {
  console.log('MSW intercepted:', request.method, request.url);
});
```

## 📚 Additional Namespaces

* `graphql` for GraphQL operations.
* Legacy: `rest` alias to HTTP REST handlers.

## 📝 Request (`req`) Object

Available in handler resolver:

* `req.url`, `req.method`, `req.headers`
* `req.params` (dynamic route parts)
* `req.json()`, `req.formData()`, `req.text()`, etc.

## ✅ Best Practices

* Always `await worker.start()` in browser
* Serve `mockServiceWorker.js` correctly
* Conditionally enable mocking
* Use shared handlers for browser & Node
* Reset handlers after each test
* Configure `onUnhandledRequest`
* Use `bypass()` when necessary
* Prefer `HttpResponse` helpers

## 🧭 Shared Handlers Example

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/items', () =>
    HttpResponse.json([
      { id: '1', name: 'Book' },
      { id: '2', name: 'Pen' },
    ])
  ),

  http.post('/api/items', async ({ request }) => {
    const item = await request.json();
    return HttpResponse.json({ ...item, id: Date.now().toString() }, { status: 201 });
  }),

  http.delete('/api/items/:id', () => HttpResponse.status(204)),
];
```

These handlers can be used in both browser and Node.js.
