import { derived, readonly, Ref } from "../reactivity";
import { isFunction } from "../shared";
import { JSXElement } from "./element";

export interface FC<T extends object = any> {
  (props: T, context: { children?: any }): JSXElement;
}

export interface Context {
  children?: any[];
  $ref?: Ref;
  $emit?: {
    [key: string]: Function;
  };
}

export type RawProps<T extends object> = {
  [key in keyof T]: T[key];
} & Context;

export type Builder<T extends object> = (props: T, context: Context) => JSXElement;

export function F<T extends object>(builder: Builder<T>) {
  return function (rawProps: RawProps<T>) {
    const props: any = {};
    const context: any = {};

    for (let [key, value] of Object.entries(rawProps)) {
      if (key.startsWith("$") || key === "children") {
        context[key] = isFunction(value) ? (value as Function)() : value;
      } else {
        props[key] = value;
      }
    }

    return builder(readonly(derived(props)), context);
  };
}
