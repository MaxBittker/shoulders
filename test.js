const { processDeps } = require("./main.js");
const loc = process.argv[2] || "package.json";
const initialPackages = require("./" + loc).dependencies;

processDeps(initialPackages, result => {
  console.log(result);
});
// const urls = [
//   {url:"https://github.com/org/repo/tree/master/packages/babel-types"},
//   {url:"git+https://github.com/org/repo.git"},
//   {url:"git@github.com:org/repo.git"},
//   {url:"git+https://github.com/org/repo.js.git"},
//   {url:"git+https://github.com/org/repo.git#readme"},
// ];

// console.log(urls.map(parseRepo))
