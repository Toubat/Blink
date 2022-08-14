import { EMPTY_OBJ, EMPTY_ARRAY, isString, isNumber, isFunction, error } from "../shared";
import { Null } from "../shared/types";
import { FC } from "./component";

const JSX_ELEMENT = Symbol("jsx-element");

// VNode flags
export enum NodeFlags {
  TEXT_NODE = 1 << 0,
  FRAGMENT_NODE = 1 << 1,
  REACTIVE_NODE = 1 << 2,
}

export type NodeType = string | FC | NodeFlags;

export type NodeProps = object;

export type NodeChild = string | number | JSXElement | Function;

export interface JSXElement {
  type: NodeType;
  props: NodeProps;
  children: NodeChild[];
  [JSX_ELEMENT]: boolean;
}

export function createJSXElement(
  type: NodeType,
  props: NodeProps | Null,
  ...children: NodeChild[]
): JSXElement {
  const node: JSXElement = {
    type,
    props: props || EMPTY_OBJ,
    children: normalizeChildren(type, children) || EMPTY_ARRAY,
    [JSX_ELEMENT]: true,
  };

  return node;
}

export function normalizeChildren(type: NodeType, children: NodeChild[]): NodeChild[] {
  if (isLeafNode(type)) return children;

  return children.map((child) => {
    if (isString(child) || isNumber(child)) {
      return createJSXElement(NodeFlags.TEXT_NODE, null, child);
    }

    if (isFunction(child)) {
      return createJSXElement(NodeFlags.REACTIVE_NODE, null, child);
    }

    return child;
  });
}

function isLeafNode(type: NodeType): boolean {
  return type === NodeFlags.TEXT_NODE || type === NodeFlags.REACTIVE_NODE;
}

export function isJSXElement(value: any): boolean {
  return value && !!value[JSX_ELEMENT];
}
