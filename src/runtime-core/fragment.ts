import { F } from "./component";
import { createJSXElement, NodeFlags } from "./element";

export function Fragment({ children = [] }: { children?: any[] }) {
  return createJSXElement(NodeFlags.FRAGMENT_NODE, null, ...children);
}
