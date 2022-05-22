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
  (): VNode;
  [JSX_ELEMENT]: boolean;
}

export interface VNode {
  type: VNodeType;
  props: VNodeProps;
  children: VNodeChildren;
}

export function createJSXElement(
  type: VNodeType,
  props: VNodeProps | Null,
  ...children: VNodeChildren
): JSXElement {
  const createVNodeFn = () => createVNode(type, props, ...children);
  const creator = createVNodeFn as JSXElement;
  creator[JSX_ELEMENT] = true;

  return creator;
}

export function isJSXElement(value: any): boolean {
  return value && !!value[JSX_ELEMENT];
}

function createVNode(
  type: VNodeType,
  props: VNodeProps | Null,
  ...children: VNodeChildren
): VNode {
  const node: VNode = {
    type,
    props: props || {},
    children,
  };

  return node;
}
