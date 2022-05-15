import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { action, autorun, configure, Reaction, reaction } from 'mobx';
import { reactive } from '../reactive';
import { effect, stop } from '../effect';

configure({
  enforceActions: 'never',
  useProxies: 'always',
});

describe('reactivity/effect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('nested effect should only be called once', () => {
    const data = { foo: 1 };
    const observed = reactive(data);
    let dummy;

    const childSpy = vi.fn().mockImplementation(() => {
      dummy = observed.foo;
    });
    const parentSpy = vi.fn().mockImplementation(() => {
      effect(childSpy);
    });
    effect(parentSpy);

    // should call both child effect and parent effect
    expect(childSpy).toHaveBeenCalledTimes(1);
    expect(parentSpy).toHaveBeenCalledTimes(1);
    expect(dummy).to.equal(1);

    // should only call child effect
    observed.foo = 2;
    expect(childSpy).toHaveBeenCalledTimes(2);
    expect(parentSpy).toHaveBeenCalledTimes(1);
    expect(dummy).to.equal(2);
  });

  it('custome scheduler', () => {
    const observed = reactive({ foo: 1 });
    let dummy;
    const spy = vi.fn().mockImplementation(() => (dummy = observed.foo));

    effect(spy, {
      scheduler: (run) => {
        run();
        run();
      },
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(dummy).to.equal(1);
    observed.foo = 2;
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('should stop effect', () => {
    const observed = reactive({ foo: 1 });
    let dummy;
    const spy = vi.fn().mockImplementation(() => (dummy = observed.foo));

    const runner = effect(spy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(dummy).to.equal(1);
    observed.foo = 2;
    expect(spy).toHaveBeenCalledTimes(2);
    expect(dummy).to.equal(2);

    stop(runner);
    observed.foo = 3;
    expect(spy).toHaveBeenCalledTimes(2);
    expect(dummy).to.equal(2);
  });
});
