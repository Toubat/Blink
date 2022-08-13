import { EMPTY_STRING, isArray, isObject, isString } from "../shared";

export function normalizeClassName(value): string {
  if (isString(value)) {
    return value as string;
  }

  if (isArray(value)) {
    return value.filter((className) => !!className).join(" ");
  }

  if (isObject(value)) {
    return Object.entries(value)
      .map(([className, active]) => (active ? className : undefined))
      .filter((className) => !!className)
      .join(" ");
  }

  return EMPTY_STRING;
}

export function normalizeStyle(value): string {
  if (isString(value)) {
    return value as string;
  }

  if (isObject(value)) {
    return Object.entries(value)
      .map(([key, value]) => `${key}: ${isString(value) ? value : `${value}px`}`)
      .join(" ");
  }

  return EMPTY_STRING;
}
