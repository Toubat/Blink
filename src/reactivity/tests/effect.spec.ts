import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { autorun, configure, observable, reaction } from 'mobx';
import { reactive, readonly } from '../reactive';
import { effect, stop, untrack } from '../effect';
import { computed } from '../computed';
import { ref } from '../ref';

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

  it('should untrack set action in effect', () => {
    const observed = observable({ foo: 1 });

    const spy = vi.fn().mockImplementation(() => {
      observed.foo++;
    });
    autorun(spy);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(observed.foo).to.equal(2);
  });

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

  it('should not be triggered by mutating a property, which is used in an inactive branch', () => {
    let dummy;
    const obj = reactive({ prop: 'value', run: true });

    const conditionalSpy = vi.fn().mockImplementation(() => {
      dummy = obj.run ? obj.prop : 'other';
    });
    effect(conditionalSpy);

    expect(dummy).toBe('value');
    expect(conditionalSpy).toHaveBeenCalledTimes(1);
    obj.run = false;
    expect(dummy).toBe('other');
    expect(conditionalSpy).toHaveBeenCalledTimes(2);
    obj.prop = 'value2';
    expect(dummy).toBe('other');
    expect(conditionalSpy).toHaveBeenCalledTimes(2);
  });

  it('reactive in effect', () => {
    let observed;
    let dummy;

    const inner = vi.fn().mockImplementation(() => {
      if (!observed) {
        const obj = reactive({ bar: ref(1) });
        obj.bar++;
        observed = obj;
      }
      dummy = observed.bar;
    });

    const spy = vi.fn().mockImplementation(() => {
      const obj = reactive({ foo: 1 });
      obj.foo++;
      effect(inner);
    });

    effect(spy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(inner).toHaveBeenCalledTimes(1);
    expect(observed.bar).toBe(2);

    observed.bar++;
    expect(spy).toHaveBeenCalledTimes(1);
    expect(inner).toHaveBeenCalledTimes(2);
    expect(dummy).toBe(3);
  });

  it('comprehensive test', () => {
    let dummy: any = {};
    let outer_b;

    const a = reactive({ foo: 1 });
    const outer = vi.fn().mockImplementation(() => {
      let b: { bar: number };
      untrack(() => {
        b = reactive({ bar: 2 });
        b.bar++;
        outer_b = b;
      });

      effect(() => {
        middle(readonly(b));
      });
    });
    const middle = vi.fn().mockImplementation((b) => {
      const c = reactive({ baz: 3 });
      b.bar;

      effect(() => {
        inner(b, c);
      });
    });

    const inner = vi.fn((b, c) => {
      dummy = {
        foo: a.foo,
        bar: b.bar,
        baz: c.baz,
      };
    });

    effect(outer);
    expect(outer).toHaveBeenCalledTimes(1);
    expect(middle).toHaveBeenCalledTimes(1);
    expect(inner).toHaveBeenCalledTimes(1);
    expect(dummy).toEqual({ foo: 1, bar: 3, baz: 3 });

    // should not invoke outer and middle effect
    a.foo = 2;
    expect(outer).toHaveBeenCalledTimes(1);
    expect(middle).toHaveBeenCalledTimes(1);
    expect(inner).toHaveBeenCalledTimes(2);
    expect(dummy).toEqual({ foo: 2, bar: 3, baz: 3 });

    // should not invoke outer effect
    outer_b.bar = 4;
    expect(outer).toHaveBeenCalledTimes(1);
    expect(middle).toHaveBeenCalledTimes(2);
    expect(inner).toHaveBeenCalledTimes(4);
  });

  it('reaction', () => {
    let dummy: any = {};
    let outer_b;
    let inner_c;
    const a = reactive({ foo: 1 });

    const outer = vi.fn().mockImplementation(() => {
      let b: { bar: number };
      untrack(() => {
        b = reactive({ bar: 2 });
        b.bar++;
        outer_b = b;
      });

      reaction(
        () => b.bar,
        (b) => {
          middle(b);
        },
        {
          fireImmediately: true,
        }
      );
    });

    const middle = vi.fn().mockImplementation((b) => {
      const c = reactive({ baz: 3 });
      b.bar;
      inner_c = c;

      reaction(
        () => c.baz,
        (c) => {
          inner(b, c);
        },
        {
          fireImmediately: true,
        }
      );
    });

    const inner = vi.fn((b, c) => {
      dummy = {
        foo: a.foo,
        bar: b,
        baz: c,
      };
    });

    reaction(() => a.foo, outer, {
      fireImmediately: true,
    });
    expect(outer).toHaveBeenCalledTimes(1);
    expect(middle).toHaveBeenCalledTimes(1);
    expect(inner).toHaveBeenCalledTimes(1);
    expect(dummy).toEqual({ foo: 1, bar: 3, baz: 3 });

    // should invoke all
    a.foo = 2;
    expect(outer).toHaveBeenCalledTimes(2);
    expect(middle).toHaveBeenCalledTimes(2);
    expect(inner).toHaveBeenCalledTimes(2);
    expect(dummy).toEqual({ foo: 2, bar: 3, baz: 3 });

    // should not invoke outer effect
    outer_b.bar = 4;
    expect(outer).toHaveBeenCalledTimes(2);
    expect(middle).toHaveBeenCalledTimes(3);
    expect(inner).toHaveBeenCalledTimes(3);

    // should not invoke outer and middle effect
    inner_c.baz = 4;
    expect(outer).toHaveBeenCalledTimes(2);
    expect(middle).toHaveBeenCalledTimes(3);
    expect(inner).toHaveBeenCalledTimes(4);
  });
});
