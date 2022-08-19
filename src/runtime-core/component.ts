import { JSXElement } from "./element";

export interface FC<T extends object = any> {
  (props: T, context: { children?: any }): JSXElement;
}
