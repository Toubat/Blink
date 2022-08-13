import { types as t } from "@babel/core";

/**
 * Babel plugin that wrap each JSX expression with a ref callback,
 * and wrap values of each object under JSX spread operator with a ref callback.
 */
export function blink() {
  return {
    name: "blink",
    visitor: {
      JSXExpressionContainer(path) {
        if (t.isJSXEmptyExpression(path.node.expression)) {
          path.remove();
        } else {
          path
            .get("expression")
            .replaceWith(t.arrowFunctionExpression([], path.node.expression, false));
        }
      },
      JSXSpreadAttribute(path) {
        path
          .get("argument")
          .replaceWith(t.callExpression(t.identifier("Blink.cs"), [path.node.argument]));
      },
    },
  };
}
