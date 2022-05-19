import { Null } from "../shared/types";

const NODE_CREATOR = Symbol("NODE_CREATOR");

export type VNodeType = string | Function;
export type VNodeProps = object;
export type VNodeChildren = (VNodeCreator | string)[];

export interface VNodeCreator {
  init: () => VNode;
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
  const creator = {
    init: () => createVNode(type, props, ...children),
    [NODE_CREATOR]: true,
  };

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
