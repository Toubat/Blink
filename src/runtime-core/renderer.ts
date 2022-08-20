import { derived, effect, readonly, untrack } from "../reactivity";
import { isFunction, warn, isArray, toDerivedValue, error, isObject } from "../shared";
import { BlinkPropPlugin, SetBasePropFn, setProps } from "./props";
import { isJSXElement, JSXElement, NodeChild, NodeFlags, normalizeChildren } from "./element";
import { FC } from "./component";
import { finishMount, getMountedCallback } from "./mounted";

export interface RendererOptions<HostElement, HostText> {
  createElement: (tag: string) => HostElement;
  createTextElement: (text: string) => HostText;
  setTextContent: (el: HostText, text: string) => void;
  insertElement: (container: HostElement, el: HostElement | HostText, anchor?: HostElement) => void;
  setBaseProp: SetBasePropFn<HostElement>;
  propPlugins?: BlinkPropPlugin<any, HostElement>[];
}

export interface Renderer<HostElement, HostText> {
  renderRoot: (root: JSXElement, container: HostElement) => void;
}

export function createRenderer<HostElement, HostText>({
  createElement,
  createTextElement,
  setTextContent,
  insertElement,
  setBaseProp,
  propPlugins: plugins,
}: RendererOptions<HostElement, HostText>): Renderer<HostElement, HostText> {
  type RenderNode = (node: JSXElement, container: HostElement) => void;

  function renderRoot(root: JSXElement, container: HostElement) {
    if (!isJSXElement(root)) {
      return warn(`Root component should be a JSX element, but got ${root} instead.`);
    }
    initNode(root, container);
  }

  function initNode(node: JSXElement, container: HostElement) {
    if (!isJSXElement(node)) {
      error(`"${typeof node}" is not a valid JSX element.`);
    }
    const renderNode = getNodeRenderer(node);
    renderNode(node, container);
  }

  function getNodeRenderer(node: JSXElement): RenderNode {
    switch (node.type) {
      case NodeFlags.FRAGMENT_NODE:
        return renderFragmentNode;
      case NodeFlags.TEXT_NODE:
        return renderTextNode;
      case NodeFlags.REACTIVE_NODE:
        return renderReactiveNode;
      default:
        return isFunction(node.type) ? renderComponentNode : renderElementNode;
    }
  }

  function renderFragmentNode(node: JSXElement, container: HostElement) {
    const { children } = node;

    renderChildren(children, container);
  }

  function renderComponentNode(node: JSXElement, container: HostElement) {
    const { type, props, children } = node;

    const setup = type as Function;

    // TODO: activate reactive context to collect reactive effect during setup stage
    const renderResult = untrack(() => setup({ ...props, children }));
    const mounted = getMountedCallback();
    /**
     * {
     *    message: () => "sample",
     *    a: () => Ref<number>(111),
     * }
     *
     * =>
     *
     * {
     *    message: "sample",
     *    a: 111,
     * }
     *
     */

    // TODO: setup component
    const context = null;
    // reaction(
    //   () => {
    //     // TODO: cleanup old effects stored in previous reactive context
    //     // ...
    //     // TODO: activate reactive context to collect reactive effect during setup stage
    //     // ...
    //     return observed.value;
    //   },
    //   (currValue, prevValue) => {
    //     if (currValue === prevValue) return;

    //     // const renderResult = untrack(() => data);

    //     // TODO: diff inner node if reactive value is a JSX element
    //     // renderChild(data, container);
    //   }
    // );

    initNode(renderResult, container);
    // TODO: deactivate reactive context

    // invoke life cycle hooks
    mounted();
    finishMount();
  }

  function renderReactiveNode(node: JSXElement, container: HostElement) {
    const { children } = node;

    let isMounted = false;
    let el: HostText;
    // TODO: should track dependency of derived element
    effect(() => {
      const derived = toDerivedValue(children[0]);
      const displayValue = isObject(derived) ? JSON.stringify(derived) : derived;

      if (isJSXElement(derived)) {
        return warn(`JSX expression should not contain JSX element.`);
      }

      if (!isMounted) {
        isMounted = true;
        el = createTextElement(displayValue);
        insertElement(container, el);
      } else {
        setTextContent(el, displayValue);
      }
    });
  }

  function renderElementNode(node: JSXElement, container: HostElement) {
    const { type, props, children } = node;

    const el = createElement(type as string);

    setProps<HostElement>({
      props,
      el,
      setBaseProp,
      plugins,
    });
    renderChildren(children, el);

    insertElement(container, el);
  }

  function renderTextNode(node: JSXElement, container: HostElement) {
    const { children } = node;

    const text = children[0] as string;
    const el = createTextElement(text);

    insertElement(container, el);
  }

  function renderChildren(children: NodeChild[], container: HostElement) {
    children.forEach((child) => {
      initNode(child as JSXElement, container);
    });
  }

  return {
    renderRoot,
  };
}

/**
 * TODO:
 * - reactive value gets updated in children list
 *    - should re-generate children list
 * - element props gets updated
 * - component props gets updated
 *
 */
