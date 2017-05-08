const request = require("request-promise");

async function fetchData(url, json = true) {
  const options = {
    uri: url,
    headers: {
      "User-Agent": "Request-Promise"
    },
    json: json
  };
  try {
    var body = await request.get(options);
    return body;
  } catch (err) {
    console.log("Got an error:", err);
  }
}

const parseRepo = ({ url, type }) => {
  let ghI = url.indexOf("github.com");
  if (ghI === -1) {
    console.log(type, url);
    throw new Error(type);
  }
  url = url.slice(ghI);
  const splur = url.split(/\/|:/);

  const owner = splur[1];
  const repo = splur[2].replace(/\.git.*$/, "");
  return { owner, repo };
};

module.exports = { fetchData, parseRepo };
