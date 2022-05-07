export const EMPTY_FUNCTION = () => {};

export const isObject = (val) => {
  return val !== null && typeof val === 'object';
};

export const isFunction = (val) => {
  return typeof val === 'function';
};
