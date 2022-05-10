import { makeAutoObservable, makeObservable, observable } from 'mobx';
import { hasChanged, isObject } from '../shared';
import { reactive, ReactiveFlag, toRaw, UnwrapRef } from './reactive';

export type Ref<T> = {
  value: T;
  [ReactiveFlag.REF]: true;
};

export class RefImpl<T> implements Ref<T> {
  private _value: T;
  private _rawValue: T;
  // reactive flags
  public readonly __b_ref = true;

  constructor(value: T, public readonly __v_shallow: boolean) {
    makeAutoObservable(this, {}, { deep: !__v_shallow });
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

export function ref<T>(value: T): Ref<T> {
  return new RefImpl<T>(value, false);
}

export function shallowRef<T>(value: T): Ref<T> {
  return new RefImpl<T>(value, true);
}
