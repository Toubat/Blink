import { autorun, reaction, runInAction, transaction, untracked } from 'mobx';
import { extend, isFunction } from '../shared';

export type EffectScheduler = (runner: Function) => any;

export interface EffectOptions {
  scheduler?: EffectScheduler;
  onStop?: () => void;
}

export interface EffectRunner<T = any> {
  (): T;
  _effect: ReactiveEffect<T>;
}

const DEFAULT_SCHEDULER = (run: Function) => run();

export class ReactiveEffect<T = any> {
  public stopFn: () => void;
  public onStop?: () => void;

  constructor(public fn: () => T, public scheduler: EffectScheduler = DEFAULT_SCHEDULER) {
    this.stopFn = autorun(fn, {
      scheduler,
    });
  }

  stop() {
    this.stopFn();
    this.onStop && this.onStop();
  }
}

export function effect<T>(fn: () => T, options: EffectOptions = {}) {
  const { scheduler, onStop } = options;

  if ((fn as EffectRunner)._effect) {
    fn = (fn as EffectRunner)._effect.fn;
  }

  const effect = new ReactiveEffect(fn, scheduler || DEFAULT_SCHEDULER);
  extend(effect, { onStop });

  const runner = effect.fn as EffectRunner<T>;
  runner._effect = effect;

  return runner;
}

export function untrack<T>(fn: () => T) {
  return untracked(fn);
}

export function stop(runner: EffectRunner) {
  runner._effect.stop();
}
