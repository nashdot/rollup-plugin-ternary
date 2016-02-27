import { extname } from 'path';
import acorn from 'acorn-jsx';
import { walk } from 'estree-walker';
import { createFilter } from 'rollup-pluginutils';
import MagicString from 'magic-string';
import escodegen from 'escodegen';

function convert(ast) {
  let trueExpression;
  let falseExpression;
  const condition = escodegen.generate(ast.test);

  if (ast.consequent.type === 'ConditionalExpression') {
    trueExpression = convert(ast.consequent);
  } else {
    trueExpression = escodegen.generate(ast.consequent);
  }

  if (ast.alternate.type === 'ConditionalExpression') {
    falseExpression = convert(ast.alternate);
  } else {
    falseExpression = escodegen.generate(ast.alternate);
  }

  return `if (${condition}) {\n${trueExpression}\n} else {\n${falseExpression}\n}`;
}

export default function plugin(options = {}) {
  const extensions = options.extensions || ['.js'];
  const filter = createFilter(options.include, options.exclude);
  const sourceMap = options.sourceMap !== false;
  const extra = options.extra !== false;

  return {
    transform: (code, id) => {
      if (!filter(id)) {
        return null;
      }
      if (extensions.indexOf(extname(id)) === -1) {
        return null;
      }

      let ast;

      try {
        ast = acorn.parse(code, {
          ecmaVersion: 6,
          sourceType: 'module',
          plugins: {
            jsx: true
          }
        });
      } catch (err) {
        err.message += ` in ${id}`;
        throw err;
      }

      const magicString = new MagicString(code);

      walk(ast, {
        enter: (node) => {
          if (node.type === 'ConditionalExpression') {
            if (extra && node.consequent.type !== 'ConditionalExpression') {
              return;
            }

            if (sourceMap) {
              magicString.addSourcemapLocation(node.start);
              magicString.addSourcemapLocation(node.end);
            }

            // console.log(`\nfile: ${id}`);
            const converted = convert(node);
            magicString.overwrite(node.start, node.end, converted);
            return;
          }
        }
      });

      const resultCode = magicString.toString();
      const map = sourceMap ? magicString.generateMap() : null;

      return {
        code: resultCode,
        map: map
      };
    }
  };
}
