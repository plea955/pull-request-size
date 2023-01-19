const nock = require('nock');
const { Probot, ProbotOctokit } = require('probot');
const myProbotApp = require('../src/index');
import {Labels} from '../src/labels';
const mockListFiles = require('./mocks/list-pull-request-files.json');
const mockLabel = require('./mocks/label.json');
const mockFileContent  = require('./mocks/file-content.json');
const pullNumber = '31';
const owner = 'noqcks';
const repo = 'pull-request-size';
const baseURL = `/repos/${owner}/${repo}`;
const baseUrlDotGitHub = `/repos/${owner}/.github`;

const label: {[key: string]: string}= {
  xsmall: 'size%2FXS',
  small: 'size%2FS',
  medium: 'size%2FM',
};

const confCustomNameSLabel: Labels = {
  XS: {
    name: 'customxsmall',
    lines: 5,
    color: '3CBF00',
  },
  S: {
    name: 'customsmall',
    lines: 10,
    color: '5D9801',
  },
  M: {
    name: 'custommedium',
    lines: 30,
    color: '7F7203',
  },
  L: {
    name: 'customlarge',
    lines: 100,
    color: 'A14C05',
  },
  XL: {
    name: 'customxlarge',
    lines: 500,
    color: 'C32607',
  },
  XXL: {
    name: 'customxxlarge',
    lines: 1000,
    color: 'E50009',
  },
};

const confOnlyMLabel = {
  M: {
    name: 'size/M',
    lines: 30,
    color: '7F7203',
  },
};

function initNock() {
  nock.disableNetConnect();
  const logRequest = (r: any) => console.log(`No match: ${r.path}, method: ${r.method}, host: ${r.options.host}`);
  nock.emitter.on('no match', (req: string) => {
    logRequest(req);
  });
}

function initProbot() {
  const result = new Probot({
    appId: 1, //
    githubToken: 'test', // Disable throttling & retrying requests for easier testing
    Octokit: ProbotOctokit.defaults({
      retry: {
        enabled: false,
      },
      throttle: {
        enabled: false,
      },
    }),
  });
  const app = result.load(myProbotApp);
  app.app = {
    getInstallationAccessToken: () => Promise.resolve('test'),
  };
  nock.cleanAll();
  jest.setTimeout(10000);
  // nockAccessToken();
  return result;
}

function nockAccessToken() {
  nock('https://api.github.com:443')
    .post('/app/installations/698235/access_tokens')
    .reply(200, { token: 'test' });
}

function nockListPullRequestFiles() {
  nock('https://api.github.com')
    .get(`${baseURL}/pulls/${pullNumber}/files?per_page=100`)
    .reply(200, mockListFiles);
}

function nockNolabelymlFoundInRepo() {
  nock('https://api.github.com')
    .get(`${baseURL}/contents/.github%2Flabels.yml`)
    .reply(404);
}

function nockNoLabelymlFoundInUsersGithubRepo() {
  nock('https://api.github.com')
    .get(`${baseUrlDotGitHub}/contents/.github%2Flabels.yml`)
    .reply(404);
}

function nockCustomLabelFoundInRepo() {
  nock('https://api.github.com')
    .get(`${baseURL}/contents/.github%2Flabels.yml`)
    .reply(200, JSON.stringify(confCustomNameSLabel));
}

function nockCustomLabelFoundInUserRepo() {
  nock('https://api.github.com')
    .get(`${baseUrlDotGitHub}/contents/.github%2Flabels.yml`)
    .reply(200, JSON.stringify(confOnlyMLabel));
}

function nockCustomLabelDoesntExist() {
  nock('https://api.github.com')
    .get(`${baseURL}/labels/${confCustomNameSLabel.S.name}`)
    .reply(404);
}

function nockGetCustomGeneratedFilesNotFound() {
  nock('https://api.github.com')
    .get(`${baseURL}/contents/.gitattributes`)
    .reply(404);
}

function nockCreateLabel() {
  nock('https://api.github.com')
    .post(`${baseURL}/labels`)
    .reply(201, mockLabel);
}

function nockGetLabelWithSizeNotFound(size: string) {
  nock('https://api.github.com')
    .get(`${baseURL}/labels/${label[size]}`)
    .reply(404);
}

function nockGetLabelWithSize(size: string) {
  nock('https://api.github.com')
    .get(`${baseURL}/labels/${label[size]}`)
    .reply(200, mockLabel);
}

function nockAddLabelToPullRequest() {
  nock('https://api.github.com')
    .post(`${baseURL}/issues/${pullNumber}/labels`)
    .reply(200, [label]);
}

function nockRemoveLabelWithSize(size: string) {
  nock('https://api.github.com')
    .delete(`${baseURL}/issues/${pullNumber}/labels/${label[size]}`)
    .reply(200);
}

function nockGetFileContent(fileName: string, ref: string) {
  nock('https://api.github.com')
    .get(`${baseURL}/contents/${fileName}?ref=${ref}`)
    .reply(200, mockFileContent);
}

function nockInstallation(installation: string) {
  nock('https://api.github.com')
    .persist()
    .get('/users/noqcks/installation')
    .reply(200, installation);
}

module.exports = {
  baseURL,
  baseUrlDotGitHub,
  pullNumber,
  initNock,
  initProbot,
  nockAccessToken,
  nockAddLabelToPullRequest,
  nockCreateLabel,
  nockGetFileContent,
  nockGetLabelWithSizeNotFound,
  nockCustomLabelDoesntExist,
  nockCustomLabelFoundInRepo,
  nockCustomLabelFoundInUserRepo,
  nockGetCustomGeneratedFilesNotFound,
  nockGetLabelWithSize,
  nockListPullRequestFiles,
  nockInstallation,
  nockNoLabelymlFoundInUsersGithubRepo,
  nockNolabelymlFoundInRepo,
  nockRemoveLabelWithSize,
};