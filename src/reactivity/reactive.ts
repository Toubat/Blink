import { isObservable, observable } from 'mobx';
import { immutableHandler } from './baseHandler';

export enum ReactiveFlag {
  IS_READONLY = '__b_isReadonly',
}

export type Target<T> = T extends object ? T : never;

export type Reactive<T> = Target<T> & {
  [ReactiveFlag.IS_READONLY]?: boolean;
};

export function reactive<T>(target: Target<T>): Reactive<T> {
  return createReactiveObject<T>(target, false);
}

export function shallowReactive<T extends object>(target: Reactive<T>): Reactive<T> {
  return createReactiveObject(target, true);
}

export function readonly<T extends object>(target: Target<T>): Reactive<T> {
  if (isReadonly(target)) return target;

  return new Proxy(target, immutableHandler);
}

export function isReactive(target) {
  return isObservable(target) && !isReadonly(target);
}

export function isReadonly(target) {
  return !!target[ReactiveFlag.IS_READONLY];
}

function createReactiveObject<T>(target: Target<T>, shallow: boolean): Reactive<T> {
  if (isReactive(target)) return target;

  return observable(target, {}, { deep: !shallow });
}
