export const isObject = (value: unknown): value is Record<any, any> => {
  // return Object.prototype.toString.call(value) === '[object Object]';
  return value != null && typeof value === 'object'
} 
