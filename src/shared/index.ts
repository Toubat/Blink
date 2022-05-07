export const NOOP = () => {};

export const isObject = (val) => {
  return val !== null && typeof val === 'object';
};

export const isFunction = (val) => {
  return typeof val === 'function';
};
