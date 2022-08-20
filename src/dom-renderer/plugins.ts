import { error, isArray, isFunction, isObject, isString } from "../shared";
import { createPropPlugin } from "../runtime-core/props";
import { normalizeClassName, normalizeStyle } from "./utils";
import { isShallow, Ref, untrack } from "../reactivity";

const stylePropPlugin = createPropPlugin<object | string, HTMLElement>({
  key: "style",
  setup({ key, value, prevValue, el, setBaseProp }) {
    const style = normalizeStyle(value);
    const prevStyle = normalizeStyle(prevValue);

    if (style === prevStyle) return;
    setBaseProp(key, style, prevStyle, el);
  },
});

const classPropPlugin = createPropPlugin<string | any[] | Record<string, boolean>, HTMLElement>({
  key: "class",
  setup({ key, value, prevValue, el, setBaseProp }) {
    const className = normalizeClassName(value);
    const prevClassName = normalizeClassName(prevValue);

    if (className === prevClassName) return;
    setBaseProp(key, className, prevClassName, el);
  },
});

const listenerPropPlugin = createPropPlugin<(event: Event) => void, HTMLElement>({
  key: /^on[A-Z]/,
  setup({ key, value, prevValue, el }) {
    const eventName = key.slice(2).toLowerCase();

    // remove previous listener if it exists
    isFunction(prevValue) && el.removeEventListener(eventName, prevValue);
    // add current listener
    el.addEventListener(eventName, value);
  },
});

const customPropPlugin = createPropPlugin<any, HTMLElement>({
  key: /^(use):[a-z]/,
  setup({ key, value, prevValue, el, setBaseProp }) {
    const [, customKey] = key.split(":");
    setBaseProp(customKey, value, prevValue, el);
  },
});

const refPropPlugin = createPropPlugin<Ref<HTMLElement>, HTMLElement>({
  key: "$ref",
  setup({ value, el }) {
    if (!isShallow(value)) {
      error("$ref attribute should be accessed by shallow ref");
      return;
    }
    value.value = el;
  },
});

export const plugins = [
  stylePropPlugin,
  classPropPlugin,
  listenerPropPlugin,
  customPropPlugin,
  refPropPlugin,
];
