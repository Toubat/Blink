import { autorun, configure } from 'mobx';
import { describe, expect, it, vi } from 'vitest';
import { isReactive, reactive } from '../reactive';
import { isRef, ref, unRef } from '../ref';

configure({
  enforceActions: 'never',
  useProxies: 'always',
});

describe('reactivity/ref', () => {
  it('happy path', () => {
    const observed = ref(1);

    expect(observed.value).toBe(1);
    observed.value = 2;
    expect(observed.value).toBe(2);
  });

  it('should trigger effect', () => {
    const observed = ref(1);
    const spy = vi.fn().mockImplementation(() => observed.value);
    autorun(spy);

    expect(spy).toHaveBeenCalledTimes(1);
    observed.value = 2;
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should not trigger effect when value is not changed', () => {
    const observed = ref(1);
    const spy = vi.fn().mockImplementation(() => observed.value);
    autorun(spy);

    observed.value = 1;
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1,
    });

    let dummy;
    autorun(() => {
      dummy = a.value.count;
    });

    expect(isReactive(a.value)).toBe(true);
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  it('should detect whether object is a ref', () => {
    const a = ref(1);
    const user = reactive({ age: 1 });

    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });

  it('should unwrap ref', () => {
    const a = ref(1);

    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });

  it('should set ref value without calling value()', () => {
    const observed = reactive({
      num: ref<number>(1),
    });

    let dummy;
    autorun(() => {
      dummy = observed.num;
    });

    expect(dummy).toBe(1);
    expect(observed.num).to.equal(1);
    observed.num = 2;
    expect(dummy).toBe(2);
    expect(observed.num).to.equal(2);
  });
});
