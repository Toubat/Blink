import { bind, hasOwn, warn } from '../shared';
import { createReactiveProxy, ReactiveFlag } from './reactive';

export type CollectionTypes = Map<any, any> | Set<any> | WeakMap<any, any> | WeakSet<any>;

export enum TriggerOpType {
  SET = 'set',
  ADD = 'add',
  DELETE = 'delete',
  CLEAR = 'clear',
}

function createReadonlyMethod(type: TriggerOpType) {
  return function (this: CollectionTypes, ...args: unknown[]) {
    const key = args[0] ? `on key "${args[0]}"` : '';
    warn(`Operation ${type} ${key}cannot be done on readonly collection type`);

    return type === TriggerOpType.DELETE ? false : this;
  };
}

const readtiveInstrumentations: Record<string, Function> = {};

const readonlyInstrumentations: Record<string, Function> = {
  add: createReadonlyMethod(TriggerOpType.ADD),
  set: createReadonlyMethod(TriggerOpType.SET),
  delete: createReadonlyMethod(TriggerOpType.DELETE),
  clear: createReadonlyMethod(TriggerOpType.CLEAR),
};

function createInstrumentationGetter<T extends object>(isShallow: boolean, isReadonly: boolean) {
  const instrumentations: Record<string, Function> = isReadonly
    ? readonlyInstrumentations
    : readtiveInstrumentations;

  return function get(target: T, key: string | symbol, receiver: T) {
    if (key === ReactiveFlag.REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlag.READONLY) {
      return isReadonly;
    } else if (key === ReactiveFlag.SHALLOW) {
      return isShallow;
    } else if (key === ReactiveFlag.RAW && isReadonly) {
      return target;
    }

    const hasKey = hasOwn(instrumentations, key) && key in target;
    const value = bind(target, Reflect.get(hasKey ? instrumentations : target, key, receiver));

    return isShallow ? value : createReactiveProxy(value, isShallow, isReadonly);
  };
}

const reactiveCollectionHandlers = {
  get: createInstrumentationGetter(false, false),
};

const shallowReactiveCollectionHandlers = {
  get: createInstrumentationGetter(true, false),
};

const readonlyCollectionHandlers = {
  get: createInstrumentationGetter(false, true),
};

const shallowReadonlyCollectionHandlers = {
  get: createInstrumentationGetter(true, true),
};

export function getCollectionHandlers(isShallow: boolean, isReadonly: boolean) {
  return isReadonly
    ? isShallow
      ? shallowReadonlyCollectionHandlers
      : readonlyCollectionHandlers
    : isShallow
    ? shallowReactiveCollectionHandlers
    : reactiveCollectionHandlers;
}
