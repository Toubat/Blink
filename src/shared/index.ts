export const NOOP = () => {};

export const isObject = (val: unknown) => {
  return val !== null && typeof val === 'object';
};

export const isFunction = (val: unknown) => {
  return typeof val === 'function';
};

export const isPrimitive = (val: unknown) => {
  return !isObject(val) && !isFunction(val);
};

export const extend = Object.assign;

export const hasOwn = (val: object, key: string | symbol): key is keyof typeof val =>
  Object.prototype.hasOwnProperty.call(val, key);

export const toRawType = (value: unknown): string => {
  return toTypeString(value).slice(8, -1);
};

export const toTypeString = (value: unknown): string => {
  return Object.prototype.toString.call(value);
};
