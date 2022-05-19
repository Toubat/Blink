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
  Fragment,
  VNodeChild,
} from "./node";

const createElement = document.createElement.bind(document);

export function renderRoot(root: VNodeCreator, container: HTMLElement) {
  initVNode(root, container);
}

function initVNode(creator: VNodeCreator, container: HTMLElement) {
  const vnode = creator();

  console.log(vnode.children);

  switch (vnode.type) {
    case Text:
      renderTextVNode(vnode, container);
      break;
    case Inline:
      renderInlineVNode(vnode, container);
      break;
    default:
      if (isFunction(vnode.type)) {
        renderComponentVNode(vnode, container);
      } else {
        renderElementVNode(vnode, container);
      }
  }
}

export function renderComponentVNode(node: VNode, container: HTMLElement) {
  const { type, props, children } = node;

  const component = type as BlockComponent;
  const creator = component(props);
  // TODO: setup component

  initVNode(creator, container);
}

export function renderElementVNode(node: VNode, container: HTMLElement) {
  const { type, props, children } = node;

  const el = createElement(type as string);

  initProps(props, el);
  renderChildren(children, el);

  container.appendChild(el);
}

function renderTextVNode(node: VNode, container: HTMLElement) {
  const { children } = node;

  const text = children[0] as string;
  container.appendChild(document.createTextNode(text));
}

export function renderInlineVNode(node: VNode, container: HTMLElement) {
  const { props, children } = node;

  const component = children[0] as InlineComponent;
  // invoke inline component
  const result = component();

  renderChild(result, container);
}

function renderChildren(children: VNodeChildren, container: HTMLElement) {
  children.forEach((child) => {
    renderChild(child, container);
  });
}

function renderChild(child: VNodeChild, container: HTMLElement) {
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
