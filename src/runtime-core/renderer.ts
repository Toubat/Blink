import { isFunction } from "../shared";
import { BlockComponent, InlineComponent } from "./component";
import { initProps } from "./component-props";
import {
  createVNodeCreator,
  isVNodeCreator,
  VNode,
  VNodeChildren,
  VNodeCreator,
  Text,
  Inline,
  VNodeChild,
} from "./vnode";

export type HostElement = HTMLElement;
const createElement = document.createElement.bind(document);

export function renderRoot(root: VNodeCreator, container: HostElement) {
  initVNode(root, container);
}

function initVNode(creator: VNodeCreator, container: HostElement) {
  // TODO: reactify
  const vnode = creator();

  console.log(vnode.children);

  const renderVNode = getVNodeRenderer(vnode);
  renderVNode(vnode, container);
}

function getVNodeRenderer(node: VNode) {
  switch (node.type) {
    case Text:
      return renderTextVNode;
    case Inline:
      return renderInlineVNode;
    default:
      return isFunction(node.type) ? renderComponentVNode : renderElementVNode;
  }
}

export function renderComponentVNode(node: VNode, container: HostElement) {
  const { type, props, children } = node;

  const component = type as BlockComponent;
  const creator = component({ ...props, children });
  // TODO: setup component

  initVNode(creator, container);
}

export function renderElementVNode(node: VNode, container: HostElement) {
  const { type, props, children } = node;

  const el = createElement(type as string);

  initProps(props, el);
  renderChildren(children, el);

  container.appendChild(el);
}

function renderTextVNode(node: VNode, container: HostElement) {
  const { children } = node;

  const text = children[0] as string;
  container.appendChild(document.createTextNode(text));
}

export function renderInlineVNode(node: VNode, container: HostElement) {
  const { props, children } = node;

  const component = children[0] as InlineComponent;
  // invoke inline component
  const result = component();

  renderChild(result, container);
}

function renderChildren(children: VNodeChildren, container: HostElement) {
  children.forEach((child) => {
    renderChild(child, container);
  });
}

function renderChild(child: VNodeChild, container: HostElement) {
  if (isVNodeCreator(child)) {
    initVNode(child as VNodeCreator, container);
  } else if (isFunction(child)) {
    const inlineCreator = createVNodeCreator(Inline, {}, child);
    initVNode(inlineCreator, container);
  } else {
    const textCreator = createVNodeCreator(Text, {}, child);
    initVNode(textCreator, container);
  }
}

/**
 * TODO:
 * - reactive value gets updated in children list
 *    - should re-generate children list
 * - element props gets updated
 * - component props gets updated
 *
 */
