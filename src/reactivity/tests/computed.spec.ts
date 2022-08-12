import { configure } from "mobx";
import { describe, it, expect, vi } from "vitest";
import { computed } from "../computed";
import { reactive, ReactiveFlag } from "../reactive";
import { effect } from "../effect";
import { isRef, ref } from "../ref";

configure({
  enforceActions: "never",
  useProxies: "always",
});

describe("reactivity/computed", () => {
  it("happy path", () => {
    const observed = reactive({ foo: 1 });
    const foo = computed<number>(() => observed.foo + 1);

    expect(isRef(foo)).to.equal(true);
    expect(foo.value).to.equal(2);
  });

  it("should recompute", () => {
    const observed = reactive({ foo: 1 });
    const foo = computed(() => observed.foo + 1);

    observed.foo = 2;
    expect(foo.value).to.equal(3);
  });

  it("access inner value of reactive object", () => {
    const observed = reactive({ foo: { nested: 1 } });
    const foo = computed(() => observed);
    let dummy;
    effect(() => {
      dummy = observed.foo.nested;
    });

    expect(dummy).toBe(1);
    observed.foo.nested = 2;
    expect(dummy).toBe(2);
  });

  it("should trigger effect", () => {
    const observed = reactive({ foo: "Hello", bar: "World" });
    const data = computed<string>(() => observed.foo + " " + observed.bar);
    let dummy;

    effect(() => {
      dummy = data.value;
    });

    expect(dummy).to.equal("Hello World");
    observed.foo = "Goodbye";
    expect(dummy).to.equal("Goodbye World");
  });

  it("should set value inversely", () => {
    const observed = reactive({ foo: "Hello", bar: "World" });
    const data = computed<string>({
      get() {
        return observed.foo + " " + observed.bar;
      },
      set(value) {
        [observed.foo, observed.bar] = value.split(" ");
      },
    });

    expect(data.value).to.equal("Hello World");
    data.value = "World Hello";
    expect(data.value).to.equal("World Hello");
  });

  it("should compute lazily", () => {
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

  it("should only call setter once when new/old values are the same", () => {
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

  it('should not access "value" field when computed is inside reactive ', () => {
    const observed = reactive({ foo: 1 });
    const data = computed(() => observed.foo + 1);
    const nested = reactive({ data });
    let dummy;

    expect(nested.data).to.equal(2);
    observed.foo = 2;
    expect(nested.data).to.equal(3);

    effect(() => {
      dummy = nested.data;
    });

    // should still be call effect
    expect(dummy).to.equal(3);
    observed.foo = 3;
    expect(dummy).to.equal(4);
  });

  it("should set computed value without calling value()", () => {
    const observed = reactive({ foo: 1 });
    const data = reactive({
      num: computed<number>({
        get: () => observed.foo + 1,
        set: (value) => (observed.foo = value - 1),
      }),
    });

    expect(data.num).to.equal(2);
    data.num = 3;
    expect(observed.foo).to.equal(2);
  });

  it("nested computed", () => {
    const val = ref(1);
    const c1 = computed(() => val.value);
    const c2 = computed(() => c1.value + 1);
    const c3 = computed(() => c2.value + 1);
    const c4 = computed(() => c3.value + 1);

    expect(c4.value).to.equal(4);
    val.value++;
    expect(c4.value).to.equal(5);
  });
});
