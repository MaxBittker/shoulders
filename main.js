const fetchUrl = require("fetch").fetchUrl;
const initialPackages = require('./'+process.argv[2]).dependencies;
const OAUTH = require('./secret.js');

const concurrency = 3;

let seenDeps = {};
let seenContribs = {};
let repoQueue = [];

let outstanding = 0;

const loadDeps = (packages) => {
  if(packages)
    Object.keys(packages).forEach(getPackageInfo);
}

const parseRepo = ({url, type}) => {
  if( url.indexOf("github") === -1){
    console.log(type, url)
    throw new Error(type);
  }
  const splur = url.split('/');
  const owner = splur[splur.length - 2]
  const repo = splur[splur.length - 1].split('.')[0]
  return {owner, repo};
}

const getContributors = (repository, n=0) => {
  var {repo, owner} = parseRepo(repository);

  const url = `http://api.github.com/repos/${owner}/${repo}/contributors?access_token=${OAUTH}`
  // console.log(url)
  if(outstanding > concurrency){
    console.log(`enqueing: ${repo}`)
    repoQueue.push(repository);
    return
  }
  outstanding++;
  fetchUrl(url, function(error, meta, body){
    if(error){
      // throw error;
      console.log(`rr: ${n} ${owner} ${repo} ${error}`)
      outstanding--;
      getContributors(repository, ++n);
      return
    }
    const contributors = JSON.parse(body.toString());
    outstanding--;

    if(contributors.message){ //ratelimited :(
      console.log(contributors.message)
    }

    if(contributors.length ) {
      contributors.map(c=>c.login).forEach(c=>{
        console.log(c.login)
        seenContribs[c] = true;
      })
    }

    if(outstanding < concurrency && repoQueue.length > 0){
       //work through queue
      let popped = repoQueue.pop();
      console.log(`popping: ${popped.url}`);
      getContributors(popped, ++n);
      return;
    }

    if(outstanding===0){
        console.log("finishing:")
        Object.keys(seenContribs).forEach(c => console.log(c))
        console.log(Object.keys(seenContribs).length)
    }
  });
}

const getPackageInfo = (package, n=0) => {
  if(seenDeps[package]) return;

  fetchUrl(`https://registry.npmjs.org/${package}/latest/`, function(error, meta, body){
      if (error) {
        console.log(`rp: ${n} ${package}`)
        getPackageInfo(package,++n)
      } else {
        const {repository, dependencies} = JSON.parse(body.toString());
        getContributors(repository)
        loadDeps(dependencies)
      }
  });
}

loadDeps(initialPackages)
