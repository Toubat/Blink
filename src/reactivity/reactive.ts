import { isObservable, observable, toJS } from "mobx";
import { isObject, isPrimitive, toRawType, warn } from "../shared";
import { getBaseHandler } from "./baseHandlers";
import { CollectionTypes, getCollectionHandlers } from "./collectionHandlers";
import { isRef, Ref, unRef, UnwrapNestedRefs } from "./ref";

export enum ReactiveFlag {
  REACTIVE = "__b_reactive",
  READONLY = "__b_readonly",
  SHALLOW = "__b_shallow",
  REF = "__b_ref",
  RAW = "__b_raw",
}

export const enum TargetType {
  INVALID = 0,
  COMMON = 1,
  COLLECTION = 2,
}

export let allowReadonlyMutation = false;

function targetTypeMap(rawType: string) {
  switch (rawType) {
    case "Object":
    case "Array":
      return TargetType.COMMON;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return TargetType.COLLECTION;
    default:
      return TargetType.INVALID;
  }
}

export function reactive<T extends object>(target: T): UnwrapNestedRefs<T> {
  return createReactiveObject(target, false, false);
}

export function shallowReactive<T extends object>(target: T): UnwrapNestedRefs<T> {
  return createReactiveObject(target, true, false);
}

export function readonly<T extends object>(target: T): UnwrapNestedRefs<T> {
  return createReactiveObject(target, false, true);
}

export function shallowReadonly<T extends object>(target: T): UnwrapNestedRefs<T> {
  return createReactiveObject(target, true, true);
}

export function toRaw<T>(target: T, shallow: boolean = false): T {
  let rawTarget = target;

  // handle chain of readonly & ref
  while (isReadonly(rawTarget) || isRef(rawTarget)) {
    rawTarget = unRef(rawTarget);
    rawTarget = rawTarget[ReactiveFlag.RAW] !== undefined ? rawTarget[ReactiveFlag.RAW] : rawTarget;
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

function createReactiveObject<T extends object>(target: T, shallow: boolean, readonly: boolean) {
  // avoid calling reactive/readonly() on a readonly object
  // avoid calling reactive() on a reactive object

  if (isReadonly(target)) {
    warn(`Cannot make object that already has a readonly modifier to be reactive/readonly.`);
    return target;
  }

  if (isReactive(target) && !readonly) {
    warn(`Cannot make object that already has a reactive modifier to be reactive.`);
    return target;
  }

  const shouldObserve = !(isObservable(target) || readonly);
  const observed = shouldObserve ? observable(target, {}, { deep: !shallow }) : target;

  return createReactiveProxy(observed, shallow, readonly);
}

export function createReactiveProxy(target, isShallow: boolean, isReadonly: boolean) {
  // stop recurse if value is primitive data type
  if (isPrimitive(target)) {
    return target;
  }

  const targetType = targetTypeMap(toRawType(target));

  // proxy handlers
  const baseHandler = getBaseHandler(isShallow, isReadonly);
  const collectionHandler = getCollectionHandlers(isShallow, isReadonly);

  const handler = targetType === TargetType.COLLECTION ? collectionHandler : baseHandler;

  return new Proxy(target, handler);
}

export function setReadonlyMutation(value: boolean) {
  allowReadonlyMutation = value;
}

export function isReadonlyMutationAllowed() {
  return allowReadonlyMutation;
}
