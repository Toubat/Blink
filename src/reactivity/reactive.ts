import { isObservable, observable, toJS } from 'mobx';
import { isObject, isPrimitive, toRawType, warn } from '../shared';
import { getBaseHandler } from './baseHandlers';
import { getCollectionHandlers } from './collectionHandlers';
import { ComputedImpl } from './computed';
import { isRef, Ref, RefImpl, unRef } from './ref';

export enum ReactiveFlag {
  REACTIVE = '__b_reactive',
  READONLY = '__b_readonly',
  SHALLOW = '__b_shallow',
  REF = '__b_ref',
  RAW = '__b_raw',
}

export const enum TargetType {
  INVALID = 0,
  COMMON = 1,
  COLLECTION = 2,
}

export type UnwrapRef<T> = T extends Ref<infer V> ? V : T;

function targetTypeMap(rawType: string) {
  switch (rawType) {
    case 'Object':
    case 'Array':
      return TargetType.COMMON;
    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
      return TargetType.COLLECTION;
    default:
      return TargetType.INVALID;
  }
}

export function reactive<T extends object>(target: T): T {
  return createReactiveObject(target, false, false);
}

export function shallowReactive<T extends object>(target: T): T {
  return createReactiveObject(target, true, false);
}

export function readonly<T extends object>(target: T): T {
  return createReactiveObject(target, false, true);
}

export function shallowReadonly<T extends object>(target: T): T {
  return createReactiveObject(target, true, true);
}

export function toRaw<T>(target: T, shallow: boolean = false): T {
  let rawTarget = target;

  // handle chain of readonly
  while (isReadonly(rawTarget)) {
    rawTarget = rawTarget[ReactiveFlag.RAW];
  }

  // handle chain of ref
  while (isRef(rawTarget)) {
    rawTarget = unRef(rawTarget);
  }

  // unobserve target if it is observable
  if (isObservable(rawTarget)) {
    rawTarget = toJS(target);
  }

  // recursively convert nested reactive objects to raw objects
  if (!shallow && isObject(rawTarget)) {
    for (const key in rawTarget) {
      rawTarget[key] = toRaw(rawTarget[key]);
    }
  }

  return rawTarget;
}

export function isReactive(target) {
  return isObject(target) && isObservable(target) && !!target[ReactiveFlag.REACTIVE];
}

export function isReadonly(target) {
  return isObject(target) && !!target[ReactiveFlag.READONLY];
}

export function isShallow(target) {
  return isObject(target) && !!target[ReactiveFlag.SHALLOW];
}

function createReactiveObject<T extends object>(target: T, shallow: boolean, readonly: boolean): T {
  // avoid calling reactive/readonly() on a readonly object
  // avoid calling reactive() on a reactive object
  if (isReadonly(target) || (isReactive(target) && !readonly)) {
    return target;
  }

  const shouldObserve = !(isObservable(target) || readonly);
  const observed = shouldObserve ? observable(target, {}, { deep: !shallow }) : target;

  return createReactiveProxy(observed, shallow, readonly);
}

export function createReactiveProxy<T extends object>(
  target: T,
  isShallow: boolean,
  isReadonly: boolean
): T {
  // stop recurse if value is primitive data type
  if (isPrimitive(target)) return target;

  const targetType = targetTypeMap(toRawType(target));

  // proxy handlers
  const baseHandler = getBaseHandler(isShallow, isReadonly);
  const collectionHandler = getCollectionHandlers(isShallow, isReadonly);

  const handler = targetType === TargetType.COLLECTION ? collectionHandler : baseHandler;

  return new Proxy(target, handler as ProxyHandler<T>);
}
