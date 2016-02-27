# rollup-plugin-ternary

Unpack ternary conditional operators

## Installation

```bash
npm install --save-dev rollup-plugin-ternary
```

## Usage
```js
import {rollup} from 'rollup';
import ternary from 'rollup-plugin-ternary';

rollup({
  entry: 'src/index.js',
  plugins: [
    ternary({
      // Restrict by extension (Default: .js)
      extensions: [ '.js', '.jsx' ],

      // Restrict with include or exclude paths (Default: all project directories)
      include: 'node_modules/**',
      exclude: 'node_modules/**',

      // Activate SourceMap (Default: true)
      sourceMap: true,

      // Transforms only extra ternary expressions (Default: true)
      extra: true
    })
  ]
});
```

## License

Copyright (c) 2016 Nashdot, MIT License
