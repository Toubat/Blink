import { makeAutoObservable } from 'mobx';
import { hasChanged, isObject } from '../shared';
import { reactive, ReactiveFlag, toRaw, UnwrapRef } from './reactive';

export type Ref<T = any> = {
  value: T;
  [ReactiveFlag.REF]: true;
};

export class RefImpl<T> implements Ref<T> {
  private _value: T;
  private _rawValue: T;
  // reactive flags
  public readonly __b_ref = true;

  constructor(value: T, public readonly __v_shallow: boolean) {
    makeAutoObservable(this, {}, { deep: false });
    this._rawValue = __v_shallow ? value : toRaw(value);
    this._value = __v_shallow ? value : toReactive(value);
  }

  get value() {
    return this._value;
  }

  set value(newValue) {
    newValue = this.__v_shallow ? newValue : toRaw(newValue);
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = this.__v_shallow ? newValue : toReactive(newValue);
    }
  }
}

function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

export function isRef(target) {
  return isObject(target) && !!target[ReactiveFlag.REF];
}

export function unRef(target) {
  return isRef(target) ? target.value : target;
}

export function ref<T>(value: T): Ref<UnwrapRef<T>>;
export function ref(value) {
  if (isRef(value)) return value;

  return new RefImpl(value, false);
}

export function shallowRef<T>(value: T): Ref<UnwrapRef<T>>;
export function shallowRef(value) {
  if (isRef(value)) return value;

  return new RefImpl(value, true);
}
