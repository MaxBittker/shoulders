const fetchUrl = require("fetch").fetchUrl;
const OAUTH = require("./secret");
const { fetchData, parseRepo } = require("./utils");
const concurrency = 1;
let outstanding = 0;

const processDeps = (deps, cb) => {
  let seenDeps = {};
  let seenContribs = {};
  let seenRepos = {};
  let repoQueue = [];
  let maxQueueLength = 0;

  const summary = () => {
    console.log("finishing:");
    return {
      numContributors: Object.keys(seenContribs).length,
      numDependencies: Object.keys(seenDeps).length,
      contributors: Object.keys(seenContribs).sort(
        (a, b) => seenContribs[a] - seenContribs[b]
      ),
      dependencies: Object.keys(seenDeps).sort()
    };
  };

  const checkQueue = () => {
    if (outstanding < concurrency && repoQueue.length > 0) {
      let popped = repoQueue.pop();
      // console.log(`${repoQueue.length}/${maxQueueLength} : ${Object.keys(seenContribs).length}`)
      // console.log(`p: ${popped.url}`);
      getContributors(popped);
    }
  };

  async function getContributors(repository, n = 0) {
    try {
      var { repo, owner } = parseRepo(repository);
    } catch (e) {
      console.log("get contribs failed: " + repo + " : " + e);
      return;
    }

    if (outstanding > concurrency) {
      repoQueue.push(repository);
      maxQueueLength = Math.max(maxQueueLength, repoQueue.length);
      return;
    }

    if (seenRepos[repo + owner]) {
      checkQueue();
      return;
    }
    outstanding++;
    // const url = `http://api.github.com/repos/${owner}/${repo}/contributors?access_token=${OAUTH}`
    const url = `http://localhost:1010/repos/${owner}/${repo}/contributors?access_token=${OAUTH}`;
    try {
      let contributors = await fetchData(url);
      outstanding--;
      if (contributors.message) {
        //ratelimited :(
        console.log(
          `failed: ${n} ${repository.url} ${owner} ${repo} ${contributors.message}`
        );
        return;
      }

      seenRepos[repo + owner] = true;

      if (contributors.length) {
        contributors.forEach(({ login, contributions, avatar_url }) => {
          let foundC = seenContribs[login] || 0;
          seenContribs[login] = foundC + contributions;
        });
      }

      if (outstanding < concurrency && repoQueue.length > 0) {
        //work through queue
        checkQueue();
        return;
      }

      if (outstanding === 0) {
        let s = summary();
        cb(s);
        // s.contributors.forEach(c => {
        // console.log(`${seenContribs[c]}: ${c}`);
        // });
      }
    } catch (err) {
      console.log(`retry repo: ${n} ${owner} ${repo} ${err}`);
      outstanding--;
      getContributors(repository, ++n);
    }
  }

  async function getPackageInfo(pkg, n = 0) {
    if (seenDeps[pkg]) return;
    try {
      // const body = await fetchData(`http://localhost:9090/${pkg}/latest/`, false);
      const body = await fetchData(
        `http://registry.npmjs.org/${pkg}/latest/`,
        false
      );
      if (!body) {
        console.log("empty: " + pkg);
      }
      const { repository, dependencies } = JSON.parse(body.toString());
      seenDeps[pkg] = true;
      if (repository) {
        // console.log(repository)
        getContributors(repository);
      } else {
        console.log(pkg + " has no repo");
        return getPackageInfo(pkg, ++n);
      }
      loadDeps(dependencies);
    } catch (error) {
      console.log(`retry pkg: ${n} ${pkg}: ${error}`);
      getPackageInfo(pkg, ++n);
    }
  }
  const loadDeps = packages => {
    if (packages) Object.keys(packages).forEach(getPackageInfo);
  };

  loadDeps(deps);
};
module.exports = { processDeps };
