import { renderNode } from './node';

export * from './h';

export function createView(rootComponent) {
  return {
    render(container: HTMLElement) {
      renderNode(rootComponent, container);
    },
  };
}
