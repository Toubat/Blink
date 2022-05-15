import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { action, autorun, configure, observable, Reaction, reaction } from 'mobx';
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

  it('custom scheduler', () => {
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

  it('runner should re-run effect', () => {
    const observed = reactive({ foo: 1 });
    const spy = vi.fn().mockImplementation(() => observed.foo);
    const runner = effect(spy);

    observed.foo = 2;
    expect(spy).toHaveBeenCalledTimes(2);

    const foo = runner();
    expect(foo).to.equal(2);
    expect(spy).toHaveBeenCalledTimes(3);
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

  it('onStop should be called after stopped effect', () => {
    let dummy;
    const observed = reactive({ foo: 1 });
    const spy = vi.fn().mockImplementation(() => observed.foo);
    const onStop = vi.fn().mockImplementation(() => (dummy = observed.foo));

    const runner = effect(spy, {
      onStop,
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledTimes(0);
    expect(dummy).to.equal(undefined);

    stop(runner);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(dummy).to.equal(1);
  });

  it('should avoid infinite loops with other effects', () => {
    const nums = reactive({ num1: 0, num2: 1 });

    const spy1 = vi.fn().mockImplementation(() => (nums.num1 = nums.num2));
    const spy2 = vi.fn().mockImplementation(() => (nums.num2 = nums.num1));
    autorun(spy1);
    autorun(spy2);

    expect(nums.num1).toBe(1);
    expect(nums.num2).toBe(1);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    nums.num2 = 4;
    expect(nums.num1).toBe(4);
    expect(nums.num2).toBe(4);
    expect(spy1).toHaveBeenCalledTimes(2);
    expect(spy2).toHaveBeenCalledTimes(2);
    nums.num1 = 10;
    expect(nums.num1).toBe(10);
    expect(nums.num2).toBe(10);
    expect(spy1).toHaveBeenCalledTimes(3);
    expect(spy2).toHaveBeenCalledTimes(3);
  });
});
