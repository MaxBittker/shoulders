"use strict";
let koa = require("koa"),
  send = require("koa-send"),
  router = require("koa-router")(),
  serve = require("koa-static"),
  bodyParser = require("koa-bodyparser"),
  { processDeps } = require("./main.js");

let app = new koa();

app.use(serve(__dirname + "/public"));
app.use(bodyParser());

router.post("/api/process", async function(ctx, next) {
  //   console.log(ctx.request.body);
  let { dependencies, devDependencies } = ctx.request.body;
  let deps = Object.assign(dependencies, devDependencies);
  //   console.log(deps);
  await new Promise((resolve, reject) => {
    processDeps(deps, result => {
      ctx.body = JSON.stringify(result);
      resolve();
    });
  });
});

// app.use(async (ctx, next) => {
//   await new Promise((resolve, reject) => {
//     setTimeout(() => {
//       ctx.body = "Hello asynchronous world!";
//       resolve();
//     }, 100);
//   });
// });

app.use(router.routes());

app.listen(8000);
