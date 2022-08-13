import { Ref } from "../reactivity";
import { EMPTY_OBJ, EMPTY_ARRAY } from "../shared";
import { Null } from "../shared/types";
import { FC } from "./component";

const JSX_ELEMENT = Symbol("jsx-element");

// VNode flags
export const Text = Symbol("text");
export const Fragment = Symbol("fragment");
export const Reactive = Symbol("reactive");
export const Derived = Symbol("derived");

export type NodeType = string | FC | typeof Text | typeof Fragment | typeof Reactive;

export type NodeProps = object;

export type Child = string | JSXElement | Ref | Function;

export type NodeChildren = Child[];

export interface JSXElement {
  type: NodeType;
  props: NodeProps;
  children: NodeChildren;
  [JSX_ELEMENT]: boolean;
}

export function createJSXElement(
  type: NodeType,
  props: NodeProps | Null,
  ...children: NodeChildren
): JSXElement {
  const node: JSXElement = {
    type,
    props: props || EMPTY_OBJ,
    children: children || EMPTY_ARRAY,
    [JSX_ELEMENT]: true,
  };
  return node;
}

export function isJSXElement(value: any): boolean {
  return value && !!value[JSX_ELEMENT];
}
