import { describe, expect, it, vi } from 'vitest';
import { autorun, configure, observable, trace } from 'mobx';
import { isReactive, reactive, shallowReactive, readonly, isReadonly } from '../reactive';

configure({
  enforceActions: 'never',
  useProxies: 'always',
});

describe('reactivity/reactive', () => {
  it('access field', () => {
    const observed = reactive({ foo: 1 });

    observed.foo = 2;
    expect(observed.foo).to.equal(2);
  });

  it('should observe newly added field', () => {
    const observed = reactive<{ foo: number; bar?: number }>({ foo: 1 });
    let dummy;

    observed.bar = 3;
    expect(observed.bar).to.equal(3);

    autorun(() => {
      dummy = observed.bar;
    });
    expect(dummy).to.equal(3);

    // should reinvoke effect
    observed.bar = 2;
    expect(dummy).to.equal(2);
  });

  it('shallow reactive', () => {
    const observed = shallowReactive({ nested: { foo: 1 } });
    let dummy;
    const spy = vi.fn().mockImplementation(() => {
      dummy = observed.nested.foo;
    });

    expect(isReactive(observed)).to.equal(true);
    expect(isReactive(observed.nested)).to.equal(false);

    autorun(spy);
    expect(dummy).to.equal(1);
    expect(spy).toHaveBeenCalledTimes(1);

    // should not call effect
    observed.nested.foo = 2;
    expect(dummy).to.equal(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('reactive array', () => {
    const observed = reactive([1, 2, 3]);
    let dummy;

    autorun(() => {
      dummy = observed[0];
    });

    expect(dummy).to.equal(1);
    observed[0] = 2;
    expect(dummy).to.equal(2);
  });

  it('array push', () => {
    const observed = reactive([1, 2, 3]);
    let dummy;
    let spy = vi.fn().mockImplementation(() => {
      dummy = observed[0];
    });

    autorun(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    observed.push(4);
    expect(spy).toHaveBeenCalledTimes(2);

    observed.splice(0, 1);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(dummy).to.equal(2);
  });

  it('nested observable', () => {
    const observed = reactive({ foo: { bar: 1 } });
    let nestedObserved = reactive(observed);

    // same object
    expect(nestedObserved).to.equal(observed);
  });

  it('reactive Map', () => {
    const observed = reactive(new Map());
    observed.set('foo', 1);
    let dummy;

    autorun(() => {
      dummy = observed.get('foo');
    });

    expect(dummy).to.equal(1);
    observed.set('foo', 2);
    expect(dummy).to.equal(2);
  });

  it('reactive Set', () => {
    const observed = reactive(new Set());
    observed.add(1);
    let dummy;

    autorun(() => {
      dummy = observed.size;
    });

    expect(dummy).to.equal(1);
    observed.add(2);
    observed.add(3);
    expect(dummy).to.equal(3);
  });

  it('readonly should throw error upon set', () => {
    const observed = readonly({ foo: { bar: 1 } });

    // should not be reactive
    expect(isReactive(observed)).to.equal(false);
    expect(isReadonly(observed.foo)).to.equal(true);
    expect(() => (observed.foo.bar = 2)).toThrowError();
  });

  it('readonly should make nested reactive readonly', () => {
    const observed = readonly({
      foo: reactive({ bar: 1, arr: [1, 2, 3], map: new Map(), set: new Set() }),
    });

    expect(isReactive(observed)).to.equal(false);
    expect(isReactive(observed.foo)).to.equal(false);
    expect(isReadonly(observed.foo)).to.equal(true);

    // should not set value
    expect(() => (observed.foo.bar = 2)).toThrowError();
    // should not manupulate array
    expect(() => (observed.foo.arr[0] = 2)).toThrowError();
    expect(() => observed.foo.arr.push(4)).toThrowError();
    expect(() => observed.foo.arr.pop()).toThrowError();
    // should not manupulate map
    expect(() => observed.foo.map.set('1', 1)).toThrowError();
    // should not manupulate set
    expect(() => observed.foo.set.add(1)).toThrowError();
  });
});
