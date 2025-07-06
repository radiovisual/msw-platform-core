import { updateValueAtPath, getValueAtPath, extractResponseBody, extractResponseHeaders, isResponseData } from './utils';

describe('updateValueAtPath', () => {
	it('should update a value at a specific path', () => {
		const obj = { a: { b: { c: 1 } } };
		const result = updateValueAtPath(obj, 'a.b.c', 2);
		expect(result).toEqual({ a: { b: { c: 2 } } });
	});

	it('should create nested objects if they do not exist', () => {
		const obj = {};
		const result = updateValueAtPath(obj, 'a.b.c', 1);
		expect(result).toEqual({ a: { b: { c: 1 } } });
	});

	it('should handle arrays', () => {
		const obj = { items: [1, 2, 3] };
		const result = updateValueAtPath(obj, 'items.1', 5);
		expect(result).toEqual({ items: [1, 5, 3] });
	});
});

describe('getValueAtPath', () => {
	it('should get a value at a specific path', () => {
		const obj = { a: { b: { c: 1 } } };
		const result = getValueAtPath(obj, 'a.b.c');
		expect(result).toBe(1);
	});

	it('should return undefined for non-existent paths', () => {
		const obj = { a: { b: 1 } };
		const result = getValueAtPath(obj, 'a.b.c');
		expect(result).toBeUndefined();
	});

	it('should handle arrays', () => {
		const obj = { items: [1, 2, 3] };
		const result = getValueAtPath(obj, 'items.1');
		expect(result).toBe(2);
	});
});

describe('Response Header Utilities', () => {
	describe('extractResponseBody', () => {
		it('should extract body from ResponseData object', () => {
			const responseData = {
				body: { message: 'success' },
				headers: { 'Content-Type': 'application/json' },
			};
			const result = extractResponseBody(responseData);
			expect(result).toEqual({ message: 'success' });
		});

		it('should return the value directly for simple responses', () => {
			const simpleResponse = { message: 'success' };
			const result = extractResponseBody(simpleResponse);
			expect(result).toEqual({ message: 'success' });
		});

		it('should handle primitive values', () => {
			const primitiveResponse = 'hello';
			const result = extractResponseBody(primitiveResponse);
			expect(result).toBe('hello');
		});

		it('should handle null and undefined', () => {
			expect(extractResponseBody(null)).toBeNull();
			expect(extractResponseBody(undefined)).toBeUndefined();
		});
	});

	describe('extractResponseHeaders', () => {
		it('should extract headers from ResponseData object', () => {
			const responseData = {
				body: { message: 'success' },
				headers: { 'Content-Type': 'application/json', 'X-Custom': 'value' },
			};
			const result = extractResponseHeaders(responseData);
			expect(result).toEqual({ 'Content-Type': 'application/json', 'X-Custom': 'value' });
		});

		it('should return empty object for simple responses', () => {
			const simpleResponse = { message: 'success' };
			const result = extractResponseHeaders(simpleResponse);
			expect(result).toEqual({});
		});

		it('should return empty object when headers are undefined', () => {
			const responseData = {
				body: { message: 'success' },
				headers: undefined,
			};
			const result = extractResponseHeaders(responseData);
			expect(result).toEqual({});
		});

		it('should handle null and undefined', () => {
			expect(extractResponseHeaders(null)).toEqual({});
			expect(extractResponseHeaders(undefined)).toEqual({});
		});
	});

	describe('isResponseData', () => {
		it('should return true for ResponseData objects', () => {
			const responseData = {
				body: { message: 'success' },
				headers: { 'Content-Type': 'application/json' },
			};
			expect(isResponseData(responseData)).toBe(true);
		});

		it('should return false for simple responses', () => {
			const simpleResponse = { message: 'success' };
			expect(isResponseData(simpleResponse)).toBe(false);
		});

		it('should return false for objects without body property', () => {
			const obj = { headers: { 'Content-Type': 'application/json' } };
			expect(isResponseData(obj)).toBe(false);
		});

		it('should return false for null and undefined', () => {
			expect(isResponseData(null)).toBe(false);
			expect(isResponseData(undefined)).toBe(false);
		});

		it('should return false for primitive values', () => {
			expect(isResponseData('hello')).toBe(false);
			expect(isResponseData(123)).toBe(false);
			expect(isResponseData(true)).toBe(false);
		});
	});
});
