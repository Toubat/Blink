import { Ref } from "../reactivity";
import { Null } from "../shared/types";
import { Component } from "./component";

const JSX_ELEMENT = Symbol("jsx-element");

// VNode flags
export const Text = Symbol("text");
export const Fragment = Symbol("fragment");

export type VNodeType = string | Component | typeof Text | typeof Fragment;

export type VNodeProps = object;

export type VNodeChild = string | JSXElement | Component | Ref;

export type VNodeChildren = VNodeChild[];

export interface JSXElement {
  type: VNodeType;
  props: VNodeProps;
  children: VNodeChildren;
  [JSX_ELEMENT]: boolean;
}

export function createJSXElement(
  type: VNodeType,
  props: VNodeProps | Null,
  ...children: VNodeChildren
): JSXElement {
  const node: JSXElement = {
    type,
    props: props || {},
    children,
    [JSX_ELEMENT]: true,
  };

  return node;
}

export function isJSXElement(value: any): boolean {
  return value && !!value[JSX_ELEMENT];
}
