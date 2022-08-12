import { ToRefs } from "..";
import { JSXElement } from "./jsx-element";

export type FC<T extends object = any> = (props: ToRefs<T> & { children?: any }) => JSXElement;
