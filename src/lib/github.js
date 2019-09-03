const octokit = new require('@octokit/rest')({
  auth: process.env.GITHUB_TOKEN,
});
const Buffer  = require('safe-buffer').Buffer;

export const appendToFile = async (filename, data, commitMessage = null) => {
  const { data: currentFile } = await octokit.repos.getContents({
    owner: 'brokalys',
    repo: 'data',
    path: `data/${filename}`,
  });

  let content = new Buffer(currentFile.content, 'base64').toString();
  content += data + "\n";

  await octokit.repos.createOrUpdateFile({
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
