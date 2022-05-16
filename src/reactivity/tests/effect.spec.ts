import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { autorun, configure, observable } from 'mobx';
import { reactive } from '../reactive';
import { effect, stop } from '../effect';
import { computed } from '../computed';

configure({
  enforceActions: 'never',
  useProxies: 'always',
});

describe('reactivity/effect', () => {
  it('should handle multiple effects', () => {
    let dummy1, dummy2;
    const counter = reactive({ num: 0 });
    effect(() => (dummy1 = counter.num));
    effect(() => (dummy2 = counter.num));

    expect(dummy1).toBe(0);
    expect(dummy2).toBe(0);
    counter.num++;
    expect(dummy1).toBe(1);
    expect(dummy2).toBe(1);
  });

  it('should observe delete operations', () => {
    let dummy;
    const obj = reactive<{
      prop?: string;
    }>({ prop: 'value' });
    effect(() => (dummy = obj.prop));

    expect(dummy).toBe('value');
    delete obj.prop;
    expect(dummy).toBe(undefined);
  });

  it('should observe has operations', () => {
    let dummy;
    const obj = reactive<{ prop?: string | number }>({ prop: 'value' });
    effect(() => (dummy = 'prop' in obj));

    expect(dummy).toBe(true);
    delete obj.prop;
    expect(dummy).toBe(false);
    obj.prop = 12;
    expect(dummy).toBe(true);
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

  it('wrapped effect runner should create a new effect with the same effect fn', () => {
    const observed = reactive({ foo: 1 });
    let dummy = 0;
    const runner = effect(() => {
      dummy += observed.foo;
    });
    const otherRunner = effect(runner);

    expect(runner._effect.fn).toBe(otherRunner._effect.fn);
    expect(dummy).toBe(2);

    observed.foo = 2;
    expect(dummy).toBe(6);
  });

  // it('should untrack set action in effect', () => {
  //   const observed = observable({ foo: 1 });

  //   const spy = vi.fn().mockImplementation(() => {
  //     observed.foo++;
  //   });
  //   autorun(spy);

  //   expect(spy).toHaveBeenCalledTimes(1);
  //   expect(observed.foo).to.equal(2);
  //   observed.foo = 3;
  //   expect(spy).toHaveBeenCalledTimes(2);
  //   expect(observed.foo).to.equal(4);
  // });

  it('should avoid infinite loops with other effects', () => {
    const nums = reactive({ num1: 0, num2: 1 });

    const spy1 = vi.fn().mockImplementation(() => (nums.num1 = nums.num2));
    const spy2 = vi.fn().mockImplementation(() => (nums.num2 = nums.num1));
    effect(spy1);
    effect(spy2);

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

  it('should observe json methods', () => {
    let dummy = <Record<string, number>>{};
    const obj = reactive<Record<string, number>>({});

    effect(() => {
      dummy = JSON.parse(JSON.stringify(obj));
    });

    obj.a = 1;
    expect(dummy.a).toBe(1);
  });
});
