import { describe, expect, it, vi } from 'vitest';
import { autorun } from 'mobx';
import { reactive } from '../reactive';

describe('reactivity/effect', () => {
  it('nested effect should only be called once', () => {
    const data = { foo: 1 };
    const observed = reactive(data);
    let dummy;

    const childSpy = vi.fn().mockImplementation(() => {
      dummy = observed.foo;
    });
    const parentSpy = vi.fn().mockImplementation(() => {
      autorun(childSpy);
    });
    autorun(parentSpy);

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
});
