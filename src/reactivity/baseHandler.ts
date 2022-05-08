import { isFunction } from '../shared';
import { createReactiveProxy, ReactiveFlag } from './reactive';
import { unRef } from './ref';

function createGetter<T extends object>(isShallow: boolean, isReadonly: boolean) {
  return function get(target: T, key: string | symbol, receiver: object) {
    if (key === ReactiveFlag.REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlag.READONLY) {
      return isReadonly;
    }

    let value = unRef(Reflect.get(target, key, receiver));

    // bind target to function's thisArg
    if (isFunction(value)) {
      value = value.bind(target);
    }

    if (isShallow) {
      return value;
    }

    return createReactiveProxy(value, isShallow, isReadonly);
  };
}

function createSetter<T extends object>(isShallow: boolean, isReadonly: boolean) {
  return function set(target: T, key: string | symbol, value: unknown, receiver: object) {
    if (isReadonly) {
      console.warn(`Cannot set property ${String(key)} on readonly object`);
    }
    return Reflect.set(target, key, value, receiver);
  };
}

function createCaller<T extends object>(isShallow: boolean, isReadonly: boolean) {
  return function apply(target: T, thisArg, args) {
    // console.log('target', thisArg instanceof Map);
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

export function getBaseHandler<T extends object>(
  isShallow: boolean,
  isReadonly: boolean
): ProxyHandler<T> {
  return isReadonly
    ? isShallow
      ? shallowReadonlyHandler
      : readonlyHandler
    : isShallow
    ? shallowReactiveHandler
    : reactiveHandler;
}
