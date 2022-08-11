import { types as t } from "@babel/core";

/**
 * Babel plugin that wrap each JSX expression with a function call
 */
export function blink() {
  return {
    name: "blink",
    visitor: {
      JSXAttribute(path) {
        if (t.isStringLiteral(path.node.value)) {
          path.node.value = t.jsxExpressionContainer(path.node.value);
        }
      },
      JSXExpressionContainer(path) {
        if (path.node.expression.type === "JSXEmptyExpression") {
          path.node.expression = t.identifier("undefined");
        } else {
          path.node.expression = t.callExpression(t.identifier("Blink.r"), [
            t.arrowFunctionExpression([], path.node.expression, false),
          ]);
        }
      },
      JSXSpreadAttribute(path) {
        path.node.argument = t.callExpression(t.identifier("Blink.rs"), [path.node.argument]);
      },
    },
  };
}
