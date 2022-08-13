import { JSXElement } from "./element";
import { Renderer } from "./renderer";

export function createViewWithRenderer<HostElement, HostText>(
  renderer: Renderer<HostElement, HostText>
) {
  return function createView(rootComponent: JSXElement) {
    return {
      render(container: HostElement) {
        renderer.renderRoot(rootComponent, container);
      },
    };
  };
}
