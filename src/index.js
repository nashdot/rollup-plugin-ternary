import { extname } from 'path';
import acorn from 'acorn-jsx';
import { walk } from 'estree-walker';
import { createFilter } from 'rollup-pluginutils';
import MagicString from 'magic-string';

const strings = {};
function pullStrings(string) {
  return string.replace(/\"([^\"]+)\"/g, $m => {
    const key = `#${Math.random()}`;
    strings[key] = $m;

    return key;
  });
}

function pushStrings(string) {
  let result = string;
  Object.keys(strings).forEach(key => {
    result = result.replace(key, strings[key]);
  });

  return result;
}

// from: https://gist.github.com/DavidWells/50b891a9e012a1e748c2
function transform(expr) {
  // console.log(`in: ${expr}`);
  const string = pullStrings(expr);
  // console.log(`strings pulled: ${string}`);

  let questionMark = string.indexOf('?');
  let colon = string.indexOf(':', questionMark);

  if (questionMark === -1 || colon === -1) {
    return string;
  }

  const condition = string.substring(0, questionMark);
  const expressions = string.substring(questionMark + 1, string.length);
  let trueExpression = null;
  let falseExpression = null;

  // console.log("expressions: " + expressions);

  // While looking in pairs, find the location where the colon occurs before the question mark.
  questionMark = expressions.indexOf('?');
  colon = expressions.indexOf(':');
  while ((questionMark !== -1 && colon !== -1) && (questionMark < colon)) {
    questionMark = expressions.indexOf('?', questionMark + 1);
    colon = expressions.indexOf(':', colon + 1);
  }

  // console.log("\t" + "questionMark: " + questionMark);
  // console.log("\t" + "colon: " + colon);

  trueExpression = expressions.substring(0, colon);
  falseExpression = expressions.substring(colon + 1, expressions.length);

  // console.log("condition: " + condition);
  // console.log("trueExpression: " + trueExpression);
  // console.log("falseExpression: " + falseExpression);
  //
  // console.log("-");

  let result = `if (${condition}) {\n${transform(trueExpression)}\n} else {\n${transform(falseExpression)}\n}`;
  // console.log(`before strings pushed: ${result}`);
  result = pushStrings(result);
  // console.log(`out: ${result}`);

  return result;
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
            const converted = transform(code.slice(node.start, node.end));
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
