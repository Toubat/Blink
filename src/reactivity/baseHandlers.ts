import { bind, warn } from "../shared";
import { untrack } from "./effect";
import {
  allowReadonlyMutation,
  createReactiveProxy,
  isReadonlyMutationAllowed,
  ReactiveFlag,
} from "./reactive";
import { isRef, unRef } from "./ref";

function createGetter<T extends object>(isShallow: boolean, isReadonly: boolean) {
  return function get(target: T, key: string | symbol, receiver: object) {
    if (key === ReactiveFlag.REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlag.READONLY) {
      return isReadonly;
    } else if (key === ReactiveFlag.SHALLOW) {
      return isShallow;
    } else if (key === ReactiveFlag.RAW && isReadonly) {
      return unRef(target);
    }

    const value = bind(target, unRef(Reflect.get(target, key, receiver)));

    return isShallow ? value : createReactiveProxy(value, isShallow, isReadonly);
  };
}

function createSetter<T extends object>(isShallow: boolean, isReadonly: boolean) {
  return function set(target: T, key: string | symbol, value: unknown, receiver: object) {
    // avoid setting property value on a readonly object
    if (isReadonly && !isReadonlyMutationAllowed()) {
      warn(`Cannot set key "${String(key)}" on readonly object`);
      return true;
    }

    return untrack(() => {
      const res = Reflect.get(target, key);

      if (isRef(res) && !isRef(value)) {
        res.value = value;
        return true;
      }

      return Reflect.set(target, key, value, receiver);
    });
  };
}

function createCaller<T extends object>(isShallow: boolean, isReadonly: boolean) {
  return function apply(target: T, thisArg, args) {
    const value = Reflect.apply(target as Function, thisArg, args);

    return createReactiveProxy(value, isShallow, isReadonly);
  };
}

const reactiveHandler = {
  get: createGetter(false, false),
  set: createSetter(false, false),
  apply: createCaller(false, false),
};

const shallowReactiveHandler = {
  get: createGetter(true, false),
  set: createSetter(true, false),
  apply: createCaller(true, false),
};

const readonlyHandler = {
  get: createGetter(false, true),
  set: createSetter(false, true),
  apply: createCaller(false, true),
};

const shallowReadonlyHandler = {
  get: createGetter(true, true),
  set: createSetter(true, true),
  apply: createCaller(true, true),
};

export function getBaseHandler(isShallow: boolean, isReadonly: boolean) {
  return isReadonly
    ? isShallow
      ? shallowReadonlyHandler
      : readonlyHandler
    : isShallow
    ? shallowReactiveHandler
    : reactiveHandler;
}
