import { VNodeCreator } from "./node";
import { renderRoot } from "./renderer";

export function createView(rootComponent: VNodeCreator) {
  return {
    render(container: HTMLElement) {
      renderRoot(rootComponent, container);
    },
  };
}
