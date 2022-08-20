import { effect, toRaw } from "../reactivity";
import { isString, toDerivedValue } from "../shared";

export type SetBasePropFn<V> = (key: string, value: any, prevValue: any, el: V) => void;

export type SetPropsOptions<V> = {
  props: object;
  el: V;
  setBaseProp: SetBasePropFn<V>;
  plugins?: BlinkPropPlugin<any, V>[];
};

export type SetPropOptions<V> = {
  key: string;
  value: any;
  prevValue: any;
  el: V;
  setBaseProp: SetBasePropFn<V>;
  plugins?: BlinkPropPlugin<any, V>[];
};

export type SetupPropOptions<T, V> = {
  key: string;
  value: T;
  prevValue: T;
  el: V;
  setBaseProp: SetBasePropFn<V>;
};

export type PropPluginOptions<T, V> = {
  key: RegExp | string;
  setup: (options: SetupPropOptions<T, V>) => void;
};

export type BlinkPropPlugin<T = any, V = any> = (options: SetupPropOptions<T, V>) => boolean;

export function createPropPlugin<T, V>(options: PropPluginOptions<T, V>): BlinkPropPlugin<T, V> {
  const { key, setup } = options;

  return ({ key: propKey, value, prevValue, el, setBaseProp }) => {
    // check if the prop key matches the key provided by the plugin
    const matched = isString(key) ? propKey === key : (key as RegExp).test(propKey);
    if (!matched) return false;

    setup({ key: propKey, value, prevValue, el, setBaseProp });
    return true;
  };
}

export function setProps<V>({ props, el, setBaseProp, plugins = [] }: SetPropsOptions<V>) {
  for (let key in props) {
    let prevValue;

    effect(() => {
      const value = toDerivedValue(props[key], !key.startsWith("$"));
      setProp({ key, value, prevValue, el, setBaseProp, plugins });

      // it is important to turn off tracking for prevValue to avoid
      // unnecessary dependency tracking and falsly effect triggering
      prevValue = key.startsWith("$") ? value : toRaw(value);
    });
  }
}

export function setProp<V>({
  key,
  value,
  prevValue,
  el,
  setBaseProp,
  plugins = [],
}: SetPropOptions<V>) {
  // use regex to match property name that needs customized behavior
  for (let plugin of plugins) {
    if (
      plugin({
        key,
        value,
        prevValue,
        el,
        setBaseProp,
      })
    )
      return;
  }
  setBaseProp(key, value, prevValue, el);
}
