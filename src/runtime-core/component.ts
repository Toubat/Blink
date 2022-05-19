import { VNodeCreator } from "./node";

export type BlockComponent = (props: object) => VNodeCreator;
export type InlineComponent = () => VNodeCreator | string;
