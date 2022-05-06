import { isObservable, observable } from 'mobx';

type ReactiveObject<T extends object> = T;

export function reactive<T extends object>(target: ReactiveObject<T>): ReactiveObject<T> {
  return createReactiveObject<ReactiveObject<T>>(target, false);
}

export function shallowReactive<T extends object>(target: ReactiveObject<T>): ReactiveObject<T> {
  return createReactiveObject(target, true);
}

export function isReactive(target: any) {
  return isObservable(target);
}

function createReactiveObject<T extends object>(target: T, shalow: boolean): T {
  return observable<T>(target, {}, { deep: !shalow });
}
