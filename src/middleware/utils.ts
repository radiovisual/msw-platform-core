/**
 * Middleware utility functions for common operations
 */

/**
 * Updates a value at a specific path in an object
 * @param obj - The object to update
 * @param path - Dot-separated path (e.g., 'user.type', 'user.contract.type')
 * @param value - The new value to set
 * @returns The updated object (deep cloned)
 */
export function updateValueAtPath(obj: any, path: string, value: any): any {
  const cloned = deepClone(obj);
  const pathParts = path.split('.');
  let current = cloned;
  
  // Navigate to the parent of the target property
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      // Path doesn't exist, create it
      current[part] = {};
    }
    current = current[part];
  }
  
  // Set the value at the final path
  const finalPart = pathParts[pathParts.length - 1];
  current[finalPart] = value;
  
  return cloned;
}

/**
 * Gets a value at a specific path in an object
 * @param obj - The object to search
 * @param path - Dot-separated path (e.g., 'user.type', 'user.contract.type')
 * @returns The value at the path, or undefined if path doesn't exist
 */
export function getValueAtPath(obj: any, path: string): any {
  const pathParts = path.split('.');
  let current = obj;
  
  for (const part of pathParts) {
    if (current == null || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Checks if a path exists in an object
 * @param obj - The object to check
 * @param path - Dot-separated path
 * @returns True if the path exists, false otherwise
 */
export function hasPath(obj: any, path: string): boolean {
  const pathParts = path.split('.');
  let current = obj;
  for (const part of pathParts) {
    if (current == null || !(part in current)) {
      return false;
    }
    current = current[part];
  }
  return true;
}

/**
 * Updates multiple values at different paths in one operation
 * @param obj - The object to update
 * @param updates - Array of { path, value } objects
 * @returns The updated object (deep cloned)
 */
export function updateMultiplePaths(obj: any, updates: Array<{ path: string; value: any }>): any {
  let result = deepClone(obj);
  
  for (const { path, value } of updates) {
    result = updateValueAtPath(result, path, value);
  }
  
  return result;
}

/**
 * Deep clone an object
 * @param obj - The object to clone
 * @returns A deep clone of the object
 */
export function deepClone(obj: any): any {
  if (Array.isArray(obj)) return obj.map(deepClone);
  if (obj && typeof obj === 'object') {
    const out: any = {};
    for (const k in obj) out[k] = deepClone(obj[k]);
    return out;
  }
  return obj;
}

/**
 * Finds all paths in an object that match a pattern
 * @param obj - The object to search
 * @param pattern - String pattern to match (supports wildcards like 'user.*.type')
 * @returns Array of matching paths
 */
export function findPaths(obj: any, pattern: string): string[] {
  const paths: string[] = [];
  const patternParts = pattern.split('.');
  
  function search(current: any, currentPath: string[], depth: number) {
    if (depth >= patternParts.length) return;
    
    const patternPart = patternParts[depth];
    
    if (patternPart === '*') {
      // Wildcard - search all properties
      if (current && typeof current === 'object') {
        for (const key in current) {
          const newPath = [...currentPath, key];
          if (depth === patternParts.length - 1) {
            paths.push(newPath.join('.'));
          } else {
            search(current[key], newPath, depth + 1);
          }
        }
      }
    } else {
      // Exact match
      if (current && typeof current === 'object' && patternPart in current) {
        const newPath = [...currentPath, patternPart];
        if (depth === patternParts.length - 1) {
          paths.push(newPath.join('.'));
        } else {
          search(current[patternPart], newPath, depth + 1);
        }
      }
    }
  }
  
  search(obj, [], 0);
  return paths;
} 