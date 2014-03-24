shooter.js
==========

fetch subtitle from shooter.cn


## Example 

```js
var Fn = require('..').fetch;
var path = require('path');

var args = process.argv;
// argv[0] === 'node'
// argv[1] === 'XXX/bin/main.js'
args = args.slice(2);

args.map(function (current, index, array) {
  Fn(current, function(err, res) {
    if (!err) {
      console.log(path.basename(current), '->', res);
    } else {
      console.log(err);
    }
  });
});
```

## Funcs

- `getHash(file)`

  - return `string` or `null`;
  - get four slice (4096) md5 hash values;

- `submit(callback)`

  - should be called after `getHash()`;
  - get subtitle information of the film file;
  - `callback(error, list)`, list is supposed to be an array with each element a metadata of a subtitle file;

- `fetch(file, callback)`

  - all-in-one


## Note

- basic support for `http_proxy` or `HTTP_PROXY`;
