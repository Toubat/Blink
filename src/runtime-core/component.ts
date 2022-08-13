import { JSXElement } from "./element";

export type FC<T extends object = any> = {
  (props: T, context: { children?: any }): JSXElement;
};
