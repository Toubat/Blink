import { isObject } from '../shared';
import { ReactiveFlag, readonly } from './reactive';

export const immutableHandler = {
  get(target, key) {
    const value = Reflect.get(target, key);

    if (key === ReactiveFlag.IS_READONLY) {
      return true;
    } else if (!isObject(value)) {
      return value;
    }

    return readonly(value);
  },
  set(target, key) {
    throw new Error(`Cannot set property ${String(key)} on readonly object ${target}`);
  },
};
