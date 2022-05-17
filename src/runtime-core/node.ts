export function createNode(type, props, ...children: any[]) {
  return () => {
    const node = {
      type,
      props: props || {},
      children,
    };
    return node;
  };
}

export function renderNode(node, container: HTMLElement) {
  if (typeof node === 'string') {
    container.appendChild(document.createTextNode(node));
    return;
  }
  const { type, props, children } = node();

  const el = document.createElement(type);

  initProps(props, el);

  children.forEach((child) => {
    renderNode(child, el);
  });

  container.appendChild(el);
}

export function initProps(props, el) {
  for (let key in props) {
    el.setAttribute(key, props[key]);
  }
}
