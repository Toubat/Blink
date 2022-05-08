import { describe, expect, it, vi } from 'vitest';
import { autorun, configure, observable, trace } from 'mobx';
import {
  isReactive,
  reactive,
  readonly,
  shallowReactive,
  toRaw,
  isReadonly,
  shallowReadonly,
} from '../reactive';
import { computed } from '../computed';

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

  it('readonly', () => {
    const observed = readonly({ foo: 1 });
    console.warn = vi.fn();

    expect(isReactive(observed)).to.equal(false);
    expect(isReadonly(observed)).to.equal(true);

    observed.foo = 2;
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should make nested object readonly', () => {
    const observed = readonly({ nested: { foo: 1 } });
    console.warn = vi.fn();

    expect(isReactive(observed)).to.equal(false);
    expect(isReadonly(observed)).to.equal(true);
    expect(isReactive(observed.nested)).to.equal(false);
    expect(isReadonly(observed.nested)).to.equal(true);

    observed.nested.foo = 2;
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should make array readonly', () => {
    const observed = readonly<any[]>([1, 2, { foo: 3 }]);
    console.warn = vi.fn();

    expect(isReactive(observed)).to.equal(false);
    expect(isReadonly(observed)).to.equal(true);

    observed[0] = 2;
    observed[2].foo = 2;
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it('should make nested array readonly', () => {
    const observed = readonly<any>({ nested: [1, 2, { foo: 3 }] });
    console.warn = vi.fn();

    expect(isReactive(observed.nested)).to.equal(false);
    expect(isReadonly(observed.nested)).to.equal(true);

    observed.nested[0] = 2;
    observed.nested[2].foo = 2;
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it('should make wrapped reactive readonly', () => {
    const observed = readonly(reactive({ foo: { bar: 1 } }));
    console.warn = vi.fn();

    expect(isReactive(observed)).to.equal(false);
    expect(isReadonly(observed)).to.equal(true);

    expect(isReadonly(observed.foo)).to.equal(true);
    observed.foo.bar = 2;
    expect(console.warn).toHaveBeenCalledTimes(1);

    const wrapped = readonly({ foo: reactive({ bar: 1 }) });

    expect(isReadonly(wrapped.foo)).to.equal(true);
    wrapped.foo.bar = 2;
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it('shallow readonly should unobserve nested data', () => {
    const observed = shallowReadonly({ nested: { foo: 1 } });

    expect(isReactive(observed)).to.equal(false);
    expect(isReadonly(observed)).to.equal(true);
    expect(isReactive(observed.nested)).to.equal(false);
    expect(isReadonly(observed.nested)).to.equal(false);
  });

  it('readonly prevent modification inside Map', () => {
    const observed = readonly(new Map([['foo', 1]]));
    let dummy;
    const spy = vi.fn().mockImplementation(() => {
      dummy = observed.get('foo');
    });
    autorun(spy);

    expect(isReadonly(observed)).to.equal(true);
    observed.set('foo', 2);
    expect(dummy).to.equal(1);
  });

  it('readonly still allow call function that modify reactive value', () => {
    const data = reactive({ foo: 1 });
    const observed = readonly({
      add(val) {
        data.foo += val;
      },
    });
    let dummy;

    autorun(() => {
      dummy = data.foo;
    });

    expect(dummy).to.equal(1);
    observed.add(2);
    expect(dummy).to.equal(3);
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

  it('array methods', () => {
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

    // sliced array should not be reactive
    const clone = observed.slice(0, 2);
    expect(isReactive(clone)).to.equal(false);
  });

  it('nested observable', () => {
    const observed = reactive({ foo: { bar: 1 } });
    let nestedObserved = reactive(observed);

    // same object
    expect(nestedObserved).to.equal(observed);
  });

  it('reactive Map', () => {
    const observed = reactive(new Map<string, any>());
    observed.set('foo', { bar: 1 });
    let dummy;

    autorun(() => {
      dummy = observed.get('foo');
    });

    expect(dummy).to.deep.equal({ bar: 1 });
    expect(isReactive(observed.get('foo'))).to.equal(true);

    observed.set('foo', 2);
    expect(dummy).to.equal(2);
    observed.delete('foo');
    expect(dummy).to.equal(undefined);
  });

  it('for each reactive Map', () => {
    const observed = reactive(
      new Map([
        ['foo', 1],
        ['bar', 2],
      ])
    );
    let dummy;
    let spy = vi.fn().mockImplementation(() => {
      observed.forEach((value) => {
        dummy = value;
      });
    });
    autorun(spy);

    expect(spy).toHaveBeenCalledTimes(1);
    observed.set('foo', 2);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('for each reactive Set', () => {
    const observed = reactive(new Set([1, 2, 3]));
    let dummy;
    let spy = vi.fn().mockImplementation(() => {
      observed.forEach((value) => {
        dummy = value;
      });
    });
    autorun(spy);

    expect(spy).toHaveBeenCalledTimes(1);
    observed.add(4);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('reactive Set', () => {
    const observed = reactive(new Set<number>());
    observed.add(1);
    let dummy;

    autorun(() => {
      dummy = observed.has(1);
    });

    expect(dummy).to.deep.equal(true);
    observed.delete(1);
    expect(dummy).to.deep.equal(false);
  });

  it('toRaw should convert reactive to plain object', () => {
    const spyToRaw = vi.fn().mockImplementation(toRaw);
    const raw = spyToRaw(
      readonly(
        reactive({
          foo: { bar: 1 },
          arr: [1, 2, 3],
          map: new Map([['1', { foo: 1 }]]),
          set: new Set([{ foo: 1 }]),
        })
      )
    );

    // should not be reactive
    expect(isReactive(raw)).to.equal(false);
    expect(isReactive(raw.foo)).to.equal(false);
    expect(isReactive(raw.foo.bar)).to.equal(false);
    expect(isReactive(raw.arr)).to.equal(false);
    expect(isReactive(raw.map)).to.equal(false);
    expect(isReactive(raw.map.get('1'))).to.equal(false);
    expect(isReactive(raw.set)).to.equal(false);
    expect(isReactive(raw.set.values().next().value)).to.equal(false);
  });

  it('toRaw should proceed conversion recursively', () => {
    const raw = toRaw({
      foo: reactive({
        foo: { bar: 1 },
      }),
    });

    // should not be reactive
    expect(isReactive(raw)).to.equal(false);
    expect(isReactive(raw.foo)).to.equal(false);
    expect(isReactive(raw.foo.foo)).to.equal(false);
    expect(isReactive(raw.foo.foo.bar)).to.equal(false);
  });

  it('toRaw should unRef computed value', () => {
    const observed = reactive({ foo: { bar: 1 } });
    const data = computed(() => observed.foo.bar + 1);
    const raw = toRaw(data);

    expect(raw).to.equal(2);
  });

  it('toRaw should unRef nested computed value', () => {
    const observed = reactive({ foo: { bar: 1 } });
    const data = computed(() => observed.foo);
    const raw = toRaw(reactive({ foo: data }));

    expect(raw).to.deep.equal({ foo: { bar: 1 } });
  });

  it('shallow toRaw should not proceed conversion recursively', () => {
    const spyToRaw = vi.fn().mockImplementation(toRaw);
    const raw = spyToRaw({ foo: reactive({ bar: 1 }) }, true);

    // should not be reactive
    expect(isReactive(raw)).to.equal(false);
    // should be reactive
    expect(isReactive(raw.foo)).to.equal(true);
    // should call toRaw once
    expect(spyToRaw).toHaveBeenCalledTimes(1);
  });
});
