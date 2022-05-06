import { describe, expect, it, vi } from 'vitest';
import { autorun, configure } from 'mobx';
import { isReactive, reactive, shallowReactive } from '../reactive';

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

  it('create new reactive field', () => {
    const observed = reactive<any>({ foo: 1 });
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

  it('shalow reactive', () => {
    const observed = shallowReactive({ nested: { foo: 1 } });
    let dummy;

    expect(isReactive(observed)).to.equal(true);
    expect(isReactive(observed.nested)).to.equal(false);

    autorun(() => {
      dummy = observed.nested.foo;
    });
    expect(dummy).to.equal(1);

    // should not call effect
    observed.nested.foo = 2;
    expect(dummy).to.equal(1);
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

  it('nested observable', () => {
    const observed = reactive({ foo: 1 });
    const nestedObsered = reactive(observed);

    // same object
    expect(nestedObsered).to.equal(observed);

    nestedObsered.foo = 2;
    expect(observed.foo).to.equal(2);

    observed.foo = 3;
    expect(nestedObsered.foo).to.equal(3);
  });
});
