import { reaction } from "mobx";
import { isRef, unRef, untrack } from "../reactivity";
import { isFunction, EMPTY_OBJ, warn, isPrimitive, evalNestedFn } from "../shared";
import { Component } from "./component";
import { setProps } from "./props";
import {
  createJSXElement,
  isJSXElement,
  VNode,
  VNodeChildren,
  JSXElement,
  Text,
  VNodeChild,
  Fragment,
} from "./vnode";

export type HostElement = HTMLElement;
const createElement = document.createElement.bind(document);

export function renderRoot(root: JSXElement, container: HostElement) {
  if (!isJSXElement(root)) {
    warn(`Root component should be a JSX element, but got ${root} instead.`);
    return;
  }
  initVNode(root, container);
}

function initVNode(jsx: JSXElement, container: HostElement) {
  // if (isPrimitive(creator)) {
  //   warn(`Functional component should return JSX element, but got ${creator} instead.`);
  //   return;
  // }

  // { type, props, children } = vnode
  const vnode = jsx();

  console.log(vnode.children);

  const renderVNode = getVNodeRenderer(vnode);
  renderVNode(vnode, container);
}

function getVNodeRenderer(node: VNode) {
  switch (node.type) {
    case Fragment:
      return renderFragmentVNode;
    case Text:
      return renderTextVNode;
    default:
      return isFunction(node.type) ? renderComponentVNode : renderElementVNode;
  }
}

export function renderFragmentVNode(node: VNode, container: HostElement) {
  const { children } = node;

  renderChildren(children, container);
}

export function renderComponentVNode(node: VNode, container: HostElement) {
  const { type, props, children } = node;

  const setup = type as Component;

  // TODO: activate reactive context to collect reactive effect during setup stage
  const creator = untrack(() => setup({ ...props, children }));

  // TODO: setup component

  renderChild(creator, container);
  // TODO: deactivate reactive context
}

export function renderElementVNode(node: VNode, container: HostElement) {
  const { type, props, children } = node;

  const el = createElement(type as string);

  setProps(props, el);
  renderChildren(children, el);

  container.appendChild(el);
}

function renderTextVNode(node: VNode, container: HostElement) {
  const { children } = node;

  const text = children[0] as string;
  container.appendChild(document.createTextNode(text));
}

function renderChildren(children: VNodeChildren, container: HostElement) {
  children.forEach((child) => {
    renderChild(child, container);
  });
}

function renderChild(child: VNodeChild, container: HostElement): void {
  if (isJSXElement(child)) {
    return initVNode(child as JSXElement, container);
  }

  if (isFunction(child)) {
    return renderChild((child as Function)(), container);
  }

  if (isRef(child)) {
    return renderChild(unRef(child), container);
  }

  const textElement = createJSXElement(Text, EMPTY_OBJ, child);
  return initVNode(textElement, container);
}

/**
 * TODO:
 * - reactive value gets updated in children list
 *    - should re-generate children list
 * - element props gets updated
 * - component props gets updated
 *
 */
