const fetchUrl = require("fetch").fetchUrl;
const loc = process.argv[2] || "package.json";
const initialPackages = require('./' + loc).dependencies;
const OAUTH = require('./secret.js');

const concurrency = 8;

let seenDeps = {};
let seenContribs = {};
let seenRepos = {};
let repoQueue = [];
let maxQueueLength = 0;
let outstanding = 0;

const loadDeps = (packages) => {
  if(packages)
    Object.keys(packages).forEach(getPackageInfo);
}

const parseRepo = ({url, type}) => {
  let ghI =url.indexOf("github.com");
  if(  ghI === -1){
    console.log(type, url)
    throw new Error(type);
  }
  url = url.slice(ghI);
  const splur = url.split(/\/|:/);

  const owner = splur[1]
  const repo = splur[2].replace(/\.git.*$/,'')
  return {owner, repo};
}

const summary = () => {
  console.log("finishing:")
  return {
    numContributors:Object.keys(seenContribs).length,
    numDependencies: Object.keys(seenDeps).length,
    contributors: Object.keys(seenContribs).sort((a,b) => seenContribs[a] - seenContribs[b]),
    dependencies: Object.keys(seenDeps).sort(),
  }
}

const checkQueue = ()=> {
  if(outstanding < concurrency && repoQueue.length > 0){
    let popped = repoQueue.pop();
    // console.log(`${repoQueue.length}/${maxQueueLength} : ${Object.keys(seenContribs).length}`)
    // console.log(`p: ${popped.url}`);
    getContributors(popped);
  }
}

const getContributors = (repository, n=0) => {
  try{
    var {repo, owner} = parseRepo(repository);
  }catch (e){
    console.log(e)
    console.log(repository)
    return
  }

  if(outstanding > concurrency){
    repoQueue.push(repository);
    maxQueueLength = Math.max(maxQueueLength, repoQueue.length);
    return
  }

  if(seenRepos[repo+owner]) {
    checkQueue()
    return
  };
  outstanding++;
  // const url = `http://api.github.com/repos/${owner}/${repo}/contributors?access_token=${OAUTH}`
  const url = `http://localhost:8080/repos/${owner}/${repo}/contributors?access_token=${OAUTH}`
  fetchUrl(url, function(error, meta, body){
    if(error){
      console.log(`retry repo: ${n} ${owner} ${repo} ${error}`)
      outstanding--;
      getContributors(repository, ++n);
      return
    }

    const contributors = JSON.parse(body.toString());
    outstanding--;

    if(contributors.message){ //ratelimited :(
      console.log(`failed: ${n} ${repository.url} ${owner} ${repo} ${contributors.message}`)
      return;
    }
    seenRepos[repo+owner] = true;
    if(contributors.length ) {
      contributors.forEach(({login, contributions, avatar_url})=>{
        let foundC = seenContribs[login] || 0;
        seenContribs[login] = foundC + contributions;
      })
    }

    if(outstanding < concurrency && repoQueue.length > 0){
       //work through queue
      checkQueue();
      return;
    }

    if(outstanding===0){
      let s = summary();
      console.log(s)
      s.contributors.forEach(c=>{
          console.log(`${seenContribs[c]}: ${c}`)
        }
      )
    }
  });
}

const getPackageInfo = (package, n=0) => {
  if(seenDeps[package]) return;

  fetchUrl(`http://localhost:7070/${package}/latest/`, function(error, meta, body){
      if (error) {
        console.log(`retry package: ${n} ${package}`)
        getPackageInfo(package,++n)
      } else {
        seenDeps[package] = true;
        const {repository, dependencies} = JSON.parse(body.toString());

        if(repository){
          getContributors(repository)
        }else{
          console.log(package +" has no repo")
        }
        loadDeps(dependencies)
      }
  });
}

loadDeps(initialPackages)
module.exports = {getPackageInfo, loadDeps, parseRepo, getContributors}
