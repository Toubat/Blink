export const NOOP = () => {};

export const EMPTY_OBJ = {};

export const EMPTY_ARRAY = [];

export const isNull = (val: unknown) => {
  return val === null || val === undefined;
};

export const isString = (val: unknown) => {
  return val !== null && typeof val === "string";
};

export const isNumber = (val: unknown) => {
  return val !== null && typeof val === "number";
};

export const isArray = Array.isArray;

export const isObject = (val: unknown) => {
  return val !== null && typeof val === "object";
};

export const isFunction = (val: unknown) => {
  return typeof val === "function";
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

export const bind = <T extends object>(target: T, value) => {
  return isFunction(value) ? value.bind(target) : value;
};

export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue);

export const evalNestedFn = (value: any) => {
  if (isFunction(value)) return evalNestedFn(value());
  return value;
};

export const warn = (msg: string) => {
  console.warn(`[blink]: ${msg}`);
};
