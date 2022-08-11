import { effect, unRef, proxyRef, UnwrapNestedRefs, Ref, isRef } from "../index";
import { isArray, isNull, isObject, isString, isFunction } from "../shared";
import { HostElement, setBaseProp } from "./renderer";

export type PropPluginOptions<T, V> = {
  key: RegExp | string;
  setup: (key: string, value: T, element: V) => void;
};
export type BlinkPropPlugin<T, V> = (propKey: string, propValue: T, element: V) => boolean;

export function createPropPlugin<T, V>(options: PropPluginOptions<T, V>): BlinkPropPlugin<T, V> {
  const { key, setup: patch } = options;

  return (propKey: string, propValue: T, element: V) => {
    // check if the prop key matches the key provided by the plugin
    const matched = isString(key) ? propKey === key : (key as RegExp).test(propKey);
    if (!matched) return false;

    patch(propKey, propValue, element);
    return true;
  };
}

export function setProps<T extends HTMLElement>(props: object, el: T) {
  for (let key in props) {
    effect(() => setProp(key, props[key], el));
  }
}

const stylePropPlugin = createPropPlugin<object | string, HostElement>({
  key: "style",
  setup(key, value, el) {
    if (isString(value)) {
      el.style.cssText = value as string;
    } else if (isObject(value)) {
      Object.entries(value).forEach(([key, value]) =>
        el.style.setProperty(key, isString(value) ? value : `${value}px`)
      );
    }
  },
});

const classPropPlugin = createPropPlugin<string | any[] | Record<string, boolean>, HostElement>({
  key: "class",
  setup(key, value, el) {
    let className: string | undefined;

    if (isString(value)) {
      className = value as string;
    } else if (isArray(value)) {
      className = value.filter((className) => !!className).join(" ");
    } else if (isObject(value)) {
      className = Object.entries(value)
        .map(([className, active]) => (active ? className : undefined))
        .filter((className) => !!className)
        .join(" ");
    }
    setBaseProp(el, key, className ? className : undefined);
  },
});

const listenerPropPlugin = createPropPlugin<(event: Event) => void, HostElement>({
  key: /^on[A-Z]/,
  setup(key, value, el) {
    const eventName = key.slice(2).toLowerCase();
    el.addEventListener(eventName, value);
  },
});

const customPropPlugin = createPropPlugin<any, HostElement>({
  key: /^(use):[a-z]/,
  setup(key, value, el) {
    const [, customKey] = key.split(":");
    setBaseProp(el, customKey, value);
  },
});

const plugins = [stylePropPlugin, classPropPlugin, listenerPropPlugin, customPropPlugin];

export function setProp<T extends HTMLElement>(key: string, value: any, el: T) {
  if (isRef(value)) {
    value = value.value;
  }
  // use regex to match property name that needs customized behavior
  for (let plugin of plugins) {
    if (plugin(key, value, el)) return;
  }
  setBaseProp(el, key, unRef(value));
}
