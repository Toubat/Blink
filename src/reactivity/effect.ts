import { autorun, reaction } from 'mobx';
import { NOOP } from '../shared';

export type EffectScheduler = (runner: Function) => any;

export interface EffectOptions {
  scheduler?: EffectScheduler;
}

export interface EffectRunner {
  (): any;
  _effect: ReactiveEffect;
}

const DEFAULT_SCHEDULER = (run: Function) => run();

export class ReactiveEffect<T = any> {
  public stopFn: () => void;

  constructor(public fn: () => T, public scheduler: EffectScheduler = DEFAULT_SCHEDULER) {
    this.stopFn = autorun(fn, {
      scheduler,
    });
  }

  stop() {
    this.stopFn();
  }
}

export function effect<T = any>(fn: () => T, options: EffectOptions = {}) {
  const { scheduler } = options;

  const effect = new ReactiveEffect(fn, scheduler || DEFAULT_SCHEDULER);

  const runner = effect.fn as EffectRunner;
  runner._effect = effect;

  return runner;
}

export function stop(runner: EffectRunner) {
  runner._effect.stop();
}
