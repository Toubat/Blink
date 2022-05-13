import { autorun, reaction } from 'mobx';

/**
 * Effect
 */
export type EffectScheduler = (...args: any[]) => any;

export interface EffectOptions {
  scheduler?: EffectScheduler;
}

export class ReactiveEffect<T = any> {
  public stopFn: () => void;

  constructor(public fn: () => T, public scheduler?: EffectScheduler) {
    this.stopFn = autorun(fn);
  }

  stop() {
    this.stopFn();
  }
}

export function effect(fn, options = {}) {
  return new ReactiveEffect(fn);
}
