import { isFunction } from "../shared";
import { initProps } from "./component/props";
import { isVNodeCreator, VNode, VNodeChildren, VNodeCreator } from "./node";

const createElement = document.createElement.bind(document);

export function renderRoot(root: VNodeCreator, container: HTMLElement) {
  instantiate(root, container);
}

function instantiate(creator: VNodeCreator, container: HTMLElement) {
  const vnode = creator.init();

  if (isFunction(vnode.type)) {
    renderComponentVNode(vnode, container);
  } else {
    renderElementVNode(vnode, container);
  }
}

export function renderComponentVNode(node: VNode, container: HTMLElement) {
  const { type, props, children } = node;

  const initFn = type as Function;
  const creator: VNodeCreator = initFn(props);
  // TODO: setup component

  instantiate(creator, container);
}

export function renderElementVNode(node: VNode, container: HTMLElement) {
  const { type, props, children } = node;

  const el: HTMLElement = createElement(type as string);

  initProps(props, el);

  renderChildren(children, el);

  container.appendChild(el);
}

function renderChildren(children: VNodeChildren, container: HTMLElement) {
  children.forEach((child) => {
    if (isVNodeCreator(child)) {
      instantiate(child as VNodeCreator, container);
    } else {
      renderTextVNode(child as string, container);
    }
  });
}

function renderTextVNode(text: string, container: HTMLElement) {
  container.appendChild(document.createTextNode(text));
}

/**
 * view.render -> renderRoot
 *
 */
