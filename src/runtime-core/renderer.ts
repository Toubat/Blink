import { effect, isRef, Ref, unRef, untrack } from "../reactivity";
import { isString, isFunction, EMPTY_OBJ, isNumber, warn, isNull } from "../shared";
import { Component } from "./component";
import { setProps } from "./props";
import {
  createJSXElement,
  isJSXElement,
  NodeChildren,
  JSXElement,
  Child,
  Text,
  Fragment,
  Reactive,
  Derived,
} from "./jsx-element";
import { reaction } from "mobx";

// TODO: refactor these into a separate directory
export type HostElement = HTMLElement;
export type HostText = Text;
export const createElement = document.createElement.bind(document);
export const createTextElement = document.createTextNode.bind(document);
export const insertElement = (
  container: HostElement,
  el: HostElement | HostText,
  anchor?: HostElement
) => {
  container.insertBefore(el, anchor || null);
};
export const setBaseProp = (container: HostElement, prop: string, value: any) => {
  isNull(value) ? container.removeAttribute(prop) : container.setAttribute(prop, value);
};

export type RenderNode = (node: JSXElement, container: HostElement) => void;

export function renderRoot(root: JSXElement, container: HostElement) {
  if (!isJSXElement(root)) {
    return warn(`Root component should be a JSX element, but got ${root} instead.`);
  }
  initNode(root, container);
}

function initNode(node: JSXElement, container: HostElement) {
  // { type, props, children } = vnode
  console.log(node.children);

  const renderNode = getNodeRenderer(node);
  renderNode(node, container);
}

function getNodeRenderer(node: JSXElement): RenderNode {
  switch (node.type) {
    case Fragment:
      return renderFragmentNode;
    case Text:
      return renderTextNode;
    case Reactive:
      return renderReactiveNode;
    case Derived:
      return renderDerivedNode;
    default:
      return isFunction(node.type) ? renderComponentNode : renderElementNode;
  }
}

function renderFragmentNode(node: JSXElement, container: HostElement) {
  const { children } = node;

  renderChildren(children, container);
}

function renderReactiveNode(node: JSXElement, container: HostElement) {
  const { children } = node;

  const observed = children[0] as Ref<Child>;

  const context = null;
  reaction(
    () => {
      // TODO: cleanup old effects stored in previous reactive context
      // ...
      // TODO: activate reactive context to collect reactive effect during setup stage
      // ...
      return observed.value;
    },
    (currValue, prevValue) => {
      if (currValue === prevValue) return;

      const renderResult = untrack(() => data);

      // TODO: diff inner node if reactive value is a JSX element
      renderChild(data, container);
    }
  );
}

function renderDerivedNode(node: JSXElement, container: HostElement) {
  const { children } = node;

  const derived: Child = (children[0] as Function)();

  renderChild(derived, container);
}

function renderComponentNode(node: JSXElement, container: HostElement) {
  const { type, props, children } = node;

  const setup = type as Component;

  // TODO: activate reactive context to collect reactive effect during setup stage
  const renderResult = untrack(() => setup({ ...props, children }));

  // TODO: setup component

  renderChild(renderResult, container);
  // TODO: deactivate reactive context
}

function renderElementNode(node: JSXElement, container: HostElement) {
  const { type, props, children } = node;

  const el = createElement(type as string);

  setProps(props, el);
  renderChildren(children, el);

  insertElement(container, el);
}

function renderTextNode(node: JSXElement, container: HostElement) {
  const { children } = node;

  const text = children[0] as string;
  const el = createTextElement(text);

  insertElement(container, el);
}

function renderChildren(children: NodeChildren, container: HostElement) {
  children.forEach((child) => {
    renderChild(child, container);
  });
}

function renderChild(child: Child, container: HostElement): void {
  if (isJSXElement(child)) {
    return initNode(child as JSXElement, container);
  }

  if (isFunction(child)) {
    const derivedElement = createJSXElement(Derived, EMPTY_OBJ, child);
    return initNode(derivedElement, container);
  }

  if (isRef(child)) {
    const reactiveElement = createJSXElement(Reactive, EMPTY_OBJ, child);
    return initNode(reactiveElement, container);
  }

  if (isString(child) || isNumber(child)) {
    const textElement = createJSXElement(Text, EMPTY_OBJ, child);
    return initNode(textElement, container);
  }

  warn(`"${typeof child}" is not a valid JSX element.`);
}

/**
 * TODO:
 * - reactive value gets updated in children list
 *    - should re-generate children list
 * - element props gets updated
 * - component props gets updated
 *
 */
