import { NOOP, isObject, warn } from "../shared";
import { computed as _computed } from "mobx";
import { Ref } from "./ref";
import { untrack } from "./effect";
import { setReadonlyMutation } from "./reactive";

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
  private __value: T = undefined as any;
  // reactive flags
  public readonly __b_ref = true;

  constructor(getter, setter) {
    this._getter = getter;
    this._setter = setter;
    this._runner = _computed(this._getter);
  }

  get value(): T {
    this.__value = this._runner.get();
    const v = this.__value;
    return v;
  }

  set value(newValue: T) {
    setReadonlyMutation(true);

    untrack(() => {
      if (newValue === this.__value) return;
      this._setter(newValue);
    });
    setReadonlyMutation(false);
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
    setter = () => {
      warn(`Computed property setter is not supported`);
    };
  }

  return new ComputedImpl<T>(getter, setter);
}
