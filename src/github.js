'use strict';

const GitHubApi = require( 'github' );
const github = new GitHubApi( {
  debug: false
} );
const AUTH_TOKEN = process.env.HUBOT_GITHUB_CF_TOKEN;
const OWNER = process.env.HUBOT_GITHUB_ORG_NAME
const SITE_INDEX_REPO = 'site-index';
const SITE_INDEX_PATH = 'site-index.json';

class GitHub {
  static createGist( options ) {
    return github.gists.create( options )
         .catch( err => console.log( err ) );
  }
  static async getBlobSha( ) {
    const commits = await github.repos.getCommits( {
      owner: OWNER,
      repo: SITE_INDEX_REPO,
      path: SITE_INDEX_PATH
    } );

    const commitSha = commits.data.shift().sha;

    const gitTree = await github.gitdata.getTree( {
      sha: commitSha,
      owner: OWNER,
      repo: SITE_INDEX_REPO,
      path: SITE_INDEX_PATH,
      recursive: false
    } );

    const blobSha = gitTree.data.tree.find( tree =>
      tree.path === SITE_INDEX_PATH
    ).sha;

    return blobSha;
  }
  static async updateFile( data ) {
    GitHub.authenticate();
    const sha = await GitHub.getBlobSha();

    return github.repos.updateFile( {
      sha,
      owner: OWNER,
      repo: SITE_INDEX_REPO,
          path: SITE_INDEX_PATH,
          message: 'Updating Index',
          content: Buffer.from( data ).toString( 'base64' )
    } )
    .catch( err => console.log( err ) );
  }
  static authenticate( ) {
    github.authenticate( {
      type: 'oauth',
      token: AUTH_TOKEN
    } );
  }
}

module.exports = { createGist: GitHub.createGist,
                   updateFile: GitHub.updateFile
                 };
