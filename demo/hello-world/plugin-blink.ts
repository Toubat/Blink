import { types as t } from "@babel/core";

/**
 * Babel plugin that wrap each JSX expression with a function call
 */
export function blink() {
  return {
    name: "blink",
    visitor: {
      JSXExpressionContainer(path) {
        if (path.node.expression.type === "JSXEmptyExpression") {
          path.node.expression = t.identifier("undefined");
        } else {
          path.node.expression = t.arrowFunctionExpression([], path.node.expression, false);
        }
      },
    },
  };
}
