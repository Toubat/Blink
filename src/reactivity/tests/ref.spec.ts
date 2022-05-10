import { autorun, configure, isObservable } from 'mobx';
import { describe, expect, it, vi } from 'vitest';
import { isReactive, reactive } from '../reactive';
import { isRef, Ref, ref, shallowRef, unRef } from '../ref';

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

  it('should unwrap ref value in reactive object', () => {
    const observed = reactive<any>({
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

  it('should unwrap ref value in ref array', () => {
    const observed = ref([1, 2, ref(0)]);

    expect(observed.value).to.deep.equal([1, 2, 0]);
    expect(observed.value[2]).to.equal(0);
  });

  it('should not trigger change on shallow ref', () => {
    const observed = shallowRef({ foo: 1 });
    const spy = vi.fn().mockImplementation(() => observed.value.foo);
    autorun(spy);

    // should not trigger effect
    expect(spy).toHaveBeenCalledTimes(1);
    observed.value.foo = 2;
    expect(spy).toHaveBeenCalledTimes(1);

    // should trigger effect
    observed.value = { foo: 3 };
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('shallow ref should not unwrap ref value', () => {
    const observed = shallowRef<any>([1, 2, ref(0)]);
    const spy = vi.fn().mockImplementation(() => observed.value[2].value);
    autorun(spy);

    expect(isRef(observed.value[2])).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    observed.value[2].value = 3;
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('reactive(ref())', () => {
    const observed = reactive(ref(1));

    expect(isReactive(observed)).toBe(true);
  });
});
