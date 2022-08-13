import { effect, unRef, proxyRef, UnwrapNestedRefs, Ref, isRef } from "../index";
import { isArray, isNull, isObject, isString, isFunction, toDerivedValue } from "../shared";
import { HostElement, setBaseProp } from "./renderer";

export type PropPluginOptions<T, V> = {
  key: RegExp | string;
  setup: (key: string, value: T, prevValue: T, element: V) => void;
};

export type BlinkPropPlugin<T, V> = (
  propKey: string,
  propValue: T,
  prevValue,
  element: V
) => boolean;

export function createPropPlugin<T, V>(options: PropPluginOptions<T, V>): BlinkPropPlugin<T, V> {
  const { key, setup: patch } = options;

  return (propKey: string, propValue: T, prevValue: T, element: V) => {
    // check if the prop key matches the key provided by the plugin
    const matched = isString(key) ? propKey === key : (key as RegExp).test(propKey);
    if (!matched) return false;

    patch(propKey, propValue, prevValue, element);
    return true;
  };
}

export function setProps<T extends HTMLElement>(props: object, el: T) {
  for (let key in props) {
    let prevValue;

    effect(() => {
      console.log(prevValue);

      const value = toDerivedValue(props[key]);
      if (prevValue !== value) {
        setProp(key, value, prevValue, el);
        prevValue = value;
      }
    });
  }
}

const stylePropPlugin = createPropPlugin<object | string, HTMLElement>({
  key: "style",
  setup(key, value, prevValue, el) {
    if (isString(value)) {
      el.style.cssText = value as string;
    } else if (isObject(value)) {
      Object.entries(value).forEach(([key, value]) =>
        el.style.setProperty(key, isString(value) ? value : `${value}px`)
      );
    }
  },
});

const classPropPlugin = createPropPlugin<string | any[] | Record<string, boolean>, HTMLElement>({
  key: "class",
  setup(key, value, prevValue, el) {
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
    setBaseProp(el, key, className ? className : undefined, prevValue);
  },
});

const listenerPropPlugin = createPropPlugin<(event: Event) => void, HTMLElement>({
  key: /^on[A-Z]/,
  setup(key, value, prevValue, el) {
    const eventName = key.slice(2).toLowerCase();

    // remove previous listener if it exists
    isFunction(prevValue) && el.removeEventListener(eventName, prevValue);
    // add current listener
    el.addEventListener(eventName, value);
  },
});

const customPropPlugin = createPropPlugin<any, HTMLElement>({
  key: /^(use):[a-z]/,
  setup(key, value, prevValue, el) {
    const [, customKey] = key.split(":");
    setBaseProp(el, customKey, value, prevValue);
  },
});

const plugins = [stylePropPlugin, classPropPlugin, listenerPropPlugin, customPropPlugin];

export function setProp<T extends HTMLElement>(key: string, value: any, prevValue: any, el: T) {
  // use regex to match property name that needs customized behavior
  for (let plugin of plugins) {
    if (plugin(key, value, prevValue, el)) return;
  }
  setBaseProp(el, key, value, prevValue);
}
