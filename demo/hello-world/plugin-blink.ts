import { types as t } from "@babel/core";

/**
 * Babel plugin that wrap each JSX expression with a ref callback,
 * and wrap values of each object under JSX spread operator with a ref callback.
 */
export function blink() {
  return {
    name: "blink",
    visitor: {
      JSXAttribute(path) {
        if (t.isStringLiteral(path.node.value)) {
          path.get("value").replaceWith(t.jsxExpressionContainer(path.node.value));
        }
      },
      JSXExpressionContainer(path) {
        if (t.isJSXEmptyExpression(path.node.expression)) {
          path.remove();
        } else {
          path
            .get("expression")
            .replaceWith(
              t.callExpression(t.identifier("Blink.r"), [
                t.arrowFunctionExpression([], path.node.expression, false),
              ])
            );
        }
      },
      JSXSpreadAttribute(path) {
        path
          .get("argument")
          .replaceWith(t.callExpression(t.identifier("Blink.rs"), [path.node.argument]));
      },
    },
  };
}
