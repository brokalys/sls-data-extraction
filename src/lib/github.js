const { Octokit } = require('@octokit/rest');
const Buffer  = require('safe-buffer').Buffer;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const appendToFile = async (filename, data, commitMessage = null) => {
  const { data: currentFile } = await octokit.repos.getContent({
    owner: 'brokalys',
    repo: 'data',
    path: `data/${filename}`,
  });

  let content = Buffer.from(currentFile.content, 'base64').toString();
  content += data + "\n";

  await octokit.repos.createOrUpdateFileContents({
    owner: 'brokalys',
    repo: 'data',
    path: currentFile.path,
    message: commitMessage,
    content: Buffer.from(content).toString('base64'),
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

export default { appendToFile };
