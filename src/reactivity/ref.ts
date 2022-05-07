import { isObject } from '../shared';
import { ReactiveFlag } from './reactive';

export function isRef(target) {
  return isObject(target) && !!target[ReactiveFlag.REF];
}

export function unRef(target) {
  return isRef(target) ? target.value : target;
}
