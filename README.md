shooter.js
==========

fetch subtitle from shooter.cn

## Install

- via `npm`:

  ```
  npm install -g shooter
  ```
  
- via `git`:

  ```
  git clone https://github.com/zyxar/shooter.js
  cd shooter.js/
  npm install -g
  ```


## Example 

```js
var Fn = require('..').API.fetch;
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

- `API.getHash(file)`

  - return `string` or `null`;
  - get four slice (4096) md5 hash values;

- `API.submit(callback)`

  - should be called after `getHash()`;
  - get subtitle information of the film file;
  - `callback(error, list)`, list is supposed to be an array with each element a metadata of a subtitle file;

- `API.fetch(file, callback)`

  - all-in-one

## Class

- `FilmFile`:

  ```js
  function FilmFile (fullpath) {/*...*/};
  FilmFile.prototype.parse = function(fullpath) {/*...*/};
  FilmFile.prototype.fetch = function(callback) {/*...*/};
  ```

## Note

- basic support for `http_proxy` or `HTTP_PROXY`;
