import { createViewWithRenderer } from "../runtime-core";
import { createRenderer, Renderer } from "../runtime-core/renderer";
import { EMPTY_STRING, isNull } from "../shared";
import { plugins } from "./plugins";
import { normalizeStyle } from "./utils";

const renderer = createRenderer<HTMLElement, Text>({
  createElement(tag) {
    return document.createElement(tag);
  },
  createTextElement(text) {
    return document.createTextNode(text);
  },
  setTextContent(el, text) {
    el.textContent = text;
  },
  insertElement(container, el, anchor) {
    container.insertBefore(el, anchor || null);
  },
  setBaseProp(key, value, prevValue, container) {
    isNull(value) || value === EMPTY_STRING
      ? container.removeAttribute(key)
      : container.setAttribute(key, value);
  },
  propPlugins: plugins,
});

export const createView = createViewWithRenderer(renderer);
