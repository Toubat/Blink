import { createJSXElement, NodeFlags } from "./element";

export function Fragment(_, { children }) {
  return createJSXElement(NodeFlags.FRAGMENT_NODE, null, ...children);
}
