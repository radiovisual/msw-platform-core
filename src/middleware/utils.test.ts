import {
    updateValueAtPath,
    getValueAtPath,
    hasPath,
    updateMultiplePaths,
    findPaths,
    deepClone,
  } from './utils';
  describe('middleware utils', () => {
    it('updateValueAtPath updates a nested value', () => {
      const obj = { user: { type: 'guest', name: 'Alice' } };
      const updated = updateValueAtPath(obj, 'user.type', 'admin');
      expect(updated).toEqual({ user: { type: 'admin', name: 'Alice' } });
      // original is not mutated
      expect(obj.user.type).toBe('guest');
    });
  
    it('updateValueAtPath creates missing path', () => {
      const obj = {};
      const updated = updateValueAtPath(obj, 'user.type', 'admin');
      expect(updated).toEqual({ user: { type: 'admin' } });
    });
  
    it('getValueAtPath gets a nested value', () => {
      const obj = { user: { type: 'guest', name: 'Alice' } };
      expect(getValueAtPath(obj, 'user.type')).toBe('guest');
      expect(getValueAtPath(obj, 'user.name')).toBe('Alice');
      expect(getValueAtPath(obj, 'user.missing')).toBeUndefined();
    });
  
    it('hasPath returns true if path exists', () => {
      const obj = { user: { type: 'guest' } };
      expect(hasPath(obj, 'user.type')).toBe(true);
      expect(hasPath(obj, 'user.missing')).toBe(false);
    });
  
    it('updateMultiplePaths updates several paths', () => {
      const obj = { user: { type: 'guest', name: 'Alice' }, contract: { id: 1 } };
      const updated = updateMultiplePaths(obj, [
        { path: 'user.type', value: 'admin' },
        { path: 'contract.id', value: 42 },
      ]);
      expect(updated).toEqual({ user: { type: 'admin', name: 'Alice' }, contract: { id: 42 } });
    });
  
    it('findPaths finds all matching paths with wildcard', () => {
      const obj = {
        users: {
          a: { type: 'admin' },
          b: { type: 'guest' },
        },
      };
      const paths = findPaths(obj, 'users.*.type');
      expect(paths.sort()).toEqual(['users.a.type', 'users.b.type']);
    });
  
    it('deepClone clones deeply', () => {
      const obj = { a: { b: { c: 1 } } };
      const clone = deepClone(obj);
      expect(clone).toEqual(obj);
      clone.a.b.c = 2;
      expect(obj.a.b.c).toBe(1);
    });
  });
  
  describe('middleware utils (advanced)', () => {
    it('updateValueAtPath updates array elements', () => {
      const obj = { users: [{ type: 'guest' }, { type: 'admin' }] };
      // Update first user's type
      const updated = updateValueAtPath(obj, 'users.0.type', 'member');
      expect(updated.users[0].type).toBe('member');
      expect(updated.users[1].type).toBe('admin');
      // Original is not mutated
      expect(obj.users[0].type).toBe('guest');
    });
  
    it('getValueAtPath gets value from array', () => {
      const obj = { users: [{ type: 'guest' }, { type: 'admin' }] };
      expect(getValueAtPath(obj, 'users.1.type')).toBe('admin');
      expect(getValueAtPath(obj, 'users.2.type')).toBeUndefined();
    });
  
    it('updateMultiplePaths updates nested and array paths', () => {
      const obj = { users: [{ type: 'guest' }, { type: 'admin' }], contract: { id: 1 } };
      const updated = updateMultiplePaths(obj, [
        { path: 'users.0.type', value: 'member' },
        { path: 'contract.id', value: 42 },
        { path: 'missing.path', value: 'x' },
      ]);
      expect(updated.users[0].type).toBe('member');
      expect(updated.contract.id).toBe(42);
      expect(updated.missing.path).toBe('x');
    });
  
    it('findPaths finds all matching paths with deep wildcards and arrays', () => {
      const obj = {
        users: [
          { type: 'admin', info: { status: 'active' } },
          { type: 'guest', info: { status: 'inactive' } },
        ],
        admins: [
          { type: 'admin', info: { status: 'active' } },
        ],
      };
      // Find all user types
      const userTypePaths = findPaths(obj, 'users.*.type');
      expect(userTypePaths).toEqual(['users.0.type', 'users.1.type']);
      // Find all info.status
      const statusPaths = findPaths(obj, 'users.*.info.status');
      expect(statusPaths).toEqual(['users.0.info.status', 'users.1.info.status']);
      // Find all types in both users and admins
      const allTypePaths = findPaths(obj, '*.0.type');
      expect(allTypePaths.sort()).toEqual(['admins.0.type', 'users.0.type']);
    });
  
    it('deepClone clones arrays and objects deeply', () => {
      const obj = { a: [{ b: 1 }, { b: 2 }], c: { d: [3, 4] } };
      const clone = deepClone(obj);
      expect(clone).toEqual(obj);
      clone.a[0].b = 99;
      clone.c.d[1] = 42;
      expect(obj.a[0].b).toBe(1);
      expect(obj.c.d[1]).toBe(4);
    });
  });
  