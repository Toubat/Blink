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
