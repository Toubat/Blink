import { VNodeCreator } from "./vnode";

export type BlockComponent = (props: object) => VNodeCreator;
export type InlineComponent = () => VNodeCreator | string;
