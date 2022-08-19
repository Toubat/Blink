import { createJSXElement, NodeFlags } from "./element";

export function Fragment({ children }) {
  return createJSXElement(NodeFlags.FRAGMENT_NODE, null, ...children);
}
