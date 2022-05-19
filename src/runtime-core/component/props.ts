export function initProps(props, el) {
  for (let key in props) {
    el.setAttribute(key, props[key]);
  }
}
