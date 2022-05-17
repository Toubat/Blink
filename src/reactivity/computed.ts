import { NOOP, isObject } from '../shared';
import { computed as _computed } from 'mobx';
import { ReactiveFlag } from './reactive';
import { Ref } from './ref';
import { untrack } from './effect';

type ComputedGetter<T> = () => T;
type ComputedSetter<T> = (value: T) => void;

export interface ComputedOptions<T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}

export class ComputedImpl<T> implements Ref<T> {
  private _getter: ComputedGetter<T>;
  private _setter: ComputedSetter<T>;
  private _runner;
  private _value: T = undefined as any;
  // reactive flags
  public readonly __b_ref = true;

  constructor(getter, setter) {
    this._getter = getter;
    this._setter = setter;
    this._runner = _computed(this._getter);
  }

  get value(): T {
    this._value = this._runner.get();
    return this._value;
  }

  set value(newValue: T) {
    untrack(() => {
      if (newValue === this._value) return;
      this._setter(newValue);
    });
  }
}

export function computed<T>(options: ComputedGetter<T> | ComputedOptions<T>): Ref<T> {
  let getter: ComputedGetter<T>;
  let setter: ComputedSetter<T>;

  if (isObject(options)) {
    getter = (options as ComputedOptions<T>).get;
    setter = (options as ComputedOptions<T>).set;
  } else {
    getter = options as ComputedGetter<T>;
    setter = NOOP;
  }

  return new ComputedImpl<T>(getter, setter);
}
