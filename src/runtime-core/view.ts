import { JSXElement } from "./jsx-element";
import { renderRoot } from "./renderer";

export function createView(rootComponent: JSXElement) {
  return {
    render(container: HTMLElement) {
      renderRoot(rootComponent, container);
    },
  };
}
