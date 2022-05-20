import { Null } from "../shared/types";
import { BlockComponent, InlineComponent } from "./component";

const NODE_CREATOR = Symbol("node_creator");

// VNode flags
export const Text = Symbol("text");
export const Fragment = Symbol("fragment");
export const Inline = Symbol("inline");

export type VNodeType =
  | string
  | BlockComponent
  | typeof Text
  | typeof Fragment
  | typeof Inline;

export type VNodeProps = object;

export type VNodeChild = string | VNodeCreator | BlockComponent;

export type VNodeChildren = VNodeChild[];

export interface VNodeCreator {
  (): VNode;
  [NODE_CREATOR]: boolean;
}

export interface VNode {
  type: VNodeType;
  props: VNodeProps;
  children: VNodeChildren;
}

export function createVNodeCreator(
  type: VNodeType,
  props: VNodeProps | Null,
  ...children: VNodeChildren
): VNodeCreator {
  const createVNodeFn = () => createVNode(type, props, ...children);
  const creator = createVNodeFn as VNodeCreator;
  creator[NODE_CREATOR] = true;

  return creator;
}

export function isVNodeCreator(value: any): boolean {
  return value && !!value[NODE_CREATOR];
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
