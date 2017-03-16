const { parseRepo } = require("./main.js");

const urls = [
  {url:"https://github.com/org/repo/tree/master/packages/babel-types"},
  {url:"git+https://github.com/org/repo.git"},
  {url:"git@github.com:org/repo.git"},
  {url:"git+https://github.com/org/repo.js.git"},
  {url:"git+https://github.com/org/repo.git#readme"},
];

console.log(urls.map(parseRepo))
