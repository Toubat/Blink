import { makeAutoObservable, makeObservable, observable } from 'mobx';
import { hasChanged, isObject } from '../shared';
import { reactive, ReactiveFlag, UnwrapRef } from './reactive';

export type Ref<T> = {
  value: T;
  [ReactiveFlag.REF]: true;
};

export class RefImpl<T> {
  private _value: T;
  private _rawValue: T;
  // reactive flags
  public readonly __b_ref = true;

  constructor(value: T) {
    makeAutoObservable(this);
    this._rawValue = value;
    this._value = toReactive(value);
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = toReactive(newValue);
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
  return new RefImpl<T>(value);
}
