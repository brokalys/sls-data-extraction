const octokit = require('@octokit/rest')();
const Buffer  = require('safe-buffer').Buffer;

export const appendToFile = async (filename, data, commitMessage = null) => {
  await octokit.authenticate({
    type: 'token',
    token: process.env.GITHUB_TOKEN,
  });

  const { data: currentFile } = await octokit.repos.getContent({
    owner: 'brokalys',
    repo: 'data',
    path: `data/${filename}`,
  });

  let content = new Buffer(currentFile.content, 'base64').toString();
  content += data + "\n";

  await octokit.repos.updateFile({
    owner: 'brokalys',
    repo: 'data',
    path: currentFile.path,
    message: commitMessage,
    content: new Buffer(content).toString('base64'),
    sha: currentFile.sha,
    committer: {
      name: 'Brokalys bot',
      email: 'noreply@brokalys.com',
    },
    author: {
      name: 'Brokalys bot',
      email: 'noreply@brokalys.com',
    },
  });
};
