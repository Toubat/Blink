import { describe, expect, it, vi } from 'vitest';
import { autorun, configure, isObservable, observable, trace } from 'mobx';
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
    expect(isObservable(observed)).to.equal(false);
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

    // should not modify
    observed.nested.foo = 2;
    expect(observed.nested.foo).to.equal(1);
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

  it('should make wrapped/nested reactive readonly', () => {
    const wrapped = readonly(reactive({ foo: { bar: 1 } }));
    const nested = readonly({ foo: reactive({ bar: 1 }) });
    console.warn = vi.fn();

    const spy = vi.fn().mockImplementation(() => wrapped.foo.bar + nested.foo.bar);
    autorun(spy);

    expect(isReadonly(wrapped)).to.equal(true);
    expect(isReadonly(wrapped.foo)).to.equal(true);
    expect(isReadonly(nested)).to.equal(true);
    expect(isReadonly(nested.foo)).to.equal(true);

    // should not modify
    wrapped.foo.bar = 2;
    expect(wrapped.foo.bar).to.equal(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledTimes(1);

    // should not modify
    expect(isReadonly(nested.foo)).to.equal(true);
    nested.foo.bar = 2;
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it('changes is readonly should not be propagated to original reactive object', () => {
    const wrapped = reactive({ foo: { bar: 1 } });
    const observed = readonly(wrapped);
    const spy = vi.fn().mockImplementation(() => wrapped.foo.bar);
    console.warn = vi.fn();
    autorun(spy);

    observed.foo.bar = 2;
    expect(spy).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('shallow readonly should unobserve nested data', () => {
    const observed = shallowReadonly({ nested: { foo: 1 } });
    console.warn = vi.fn();

    expect(isReactive(observed)).to.equal(false);
    expect(isReadonly(observed)).to.equal(true);
    expect(isReactive(observed.nested)).to.equal(false);
    expect(isReadonly(observed.nested)).to.equal(false);

    // change nested data
    observed.nested.foo = 2;
    expect(console.warn).toHaveBeenCalledTimes(0);
  });

  it('readonly prevent modification inside Map', () => {
    const observed = readonly(new Map([['foo', 1]]));
    let dummy;
    console.warn = vi.fn();

    const spy = vi.fn().mockImplementation(() => {
      dummy = observed.get('foo');
    });
    autorun(spy);

    expect(isReadonly(observed)).to.equal(true);
    observed.set('foo', 2);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(dummy).to.equal(1);
  });

  it('readonly prevent modification inside Set', () => {
    const observed = readonly(new Set([1, 2, 3]));
    console.warn = vi.fn();

    expect(isReadonly(observed)).to.equal(true);
    observed.add(4);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('data inside readonly Map should be readonly', () => {
    const observed = readonly(new Map([['foo', { bar: 1 }]]));

    expect(isReadonly(observed.get('foo'))).to.equal(true);
  });

  it('data inside readonly Set should be readonly', () => {
    const observed = readonly(new Set([{ foo: 1 }]));

    expect(isReadonly(observed.values().next().value)).to.equal(true);
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
    let spy = vi.fn().mockImplementation(() => observed[0]);

    autorun(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    observed.push(4);
    expect(spy).toHaveBeenCalledTimes(2);

    observed.splice(0, 1);
    expect(spy).toHaveBeenCalledTimes(3);

    // sliced array should not be reactive
    const clone = observed.slice(0, 2);
    expect(isReactive(clone)).to.equal(false);
  });

  it('nested observable', () => {
    const observed = reactive({ foo: { bar: 1 } });
    console.warn = vi.fn();
    const nestedObserved = reactive(observed);

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
    const raw = toRaw(
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

    // should not be readonly
    expect(isReadonly(raw)).to.equal(false);
    expect(isReadonly(raw.foo)).to.equal(false);
    expect(isReadonly(raw.foo.bar)).to.equal(false);
    expect(isReadonly(raw.arr)).to.equal(false);
    expect(isReadonly(raw.map)).to.equal(false);
    expect(isReadonly(raw.map.get('1'))).to.equal(false);
    expect(isReadonly(raw.set)).to.equal(false);
    expect(isReadonly(raw.set.values().next().value)).to.equal(false);
  });

  it('toRaw should convert readonly to plain object', () => {
    const raw = toRaw(readonly({ foo: { bar: 1 } }));
    console.warn = vi.fn();

    // should not be readonly
    raw.foo.bar = 2;
    expect(console.warn).toHaveBeenCalledTimes(0);
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

  it('extreme test', () => {
    console.warn = vi.fn();
    const observed = readonly(readonly(readonly(reactive(reactive({ foo: { bar: 1 } })))));
    const raw = toRaw(observed);

    // should not be reactive
    expect(isReactive(raw)).to.equal(false);
    expect(isReactive(raw.foo)).to.equal(false);

    // should not be readonly
    expect(isReadonly(raw)).to.equal(false);
    expect(isReadonly(raw.foo)).to.equal(false);
  });

  it('chain of computed', () => {
    const observed = reactive({ foo: { bar: 1 } });
    const data = computed(() => observed.foo.bar + 1);
    const data2 = computed(() => data.value + 1);
    const data3 = computed(() => data2.value + 1);
    const data4 = computed(() => data3.value + 1);

    observed.foo.bar = 2;
    expect(data4.value).to.equal(6);

    const raw = toRaw(data4);
    expect(raw).to.equal(6);
  });
});
