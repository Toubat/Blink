import { autorun } from 'mobx';
import { describe, it, expect, vi } from 'vitest';
import { computed } from '../computed';
import { reactive } from '../reactive';

describe('reactivity/computed', () => {
  it('happy path', () => {
    const observed = reactive({ foo: 1 });
    const foo = computed<number>(() => observed.foo + 1);

    expect(foo.value).to.equal(2);
  });

  it('should recompute', () => {
    const observed = reactive({ foo: 1 });
    const foo = computed(() => observed.foo + 1);

    observed.foo = 2;
    expect(foo.value).to.equal(3);
  });

  it('should trigger effect', () => {
    const observed = reactive({ foo: 'Hello', bar: 'World' });
    const data = computed<string>(() => observed.foo + ' ' + observed.bar);
    let dummy;

    autorun(() => {
      dummy = data.value;
    });

    expect(dummy).to.equal('Hello World');
    observed.foo = 'Goodbye';
    expect(dummy).to.equal('Goodbye World');
  });

  it('should set value inversely', () => {
    const observed = reactive({ foo: 'Hello', bar: 'World' });
    const data = computed<string>({
      get() {
        return observed.foo + ' ' + observed.bar;
      },
      set(value) {
        [observed.foo, observed.bar] = value.split(' ');
      },
    });

    expect(data.value).to.equal('Hello World');
    data.value = 'World Hello';
    expect(data.value).to.equal('World Hello');
  });

  it('should compute lazily', () => {
    const observed = reactive({ foo: 2 });
    const spyGetter = vi.fn().mockImplementation(() => observed.foo * observed.foo);
    const spySetter = vi.fn().mockImplementation((value) => (observed.foo = Math.sqrt(value)));
    const square = computed<number>({
      get: spyGetter,
      set: spySetter,
    });

    // should not call
    expect(spyGetter).toHaveBeenCalledTimes(0);
    expect(square.value).to.equal(4);
    expect(spyGetter).toHaveBeenCalledTimes(1);

    square.value = 9;
    expect(observed.foo).to.equal(3);
    expect(spyGetter).toHaveBeenCalledTimes(1);
    expect(spySetter).toHaveBeenCalledTimes(1);
  });

  it('should only call setter once when new/old values are the same', () => {
    const observed = reactive({ foo: 2 });
    const spyGetter = vi.fn().mockImplementation(() => observed.foo * observed.foo);
    const spySetter = vi.fn().mockImplementation((value) => (observed.foo = Math.sqrt(value)));
    const square = computed<number>({
      get: spyGetter,
      set: spySetter,
    });

    square.value = 4;
    expect(spyGetter).toHaveBeenCalledTimes(0);
    expect(spySetter).toHaveBeenCalledTimes(1);
  });
});
