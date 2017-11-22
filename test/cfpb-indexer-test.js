'use strict';

const Helper = require('hubot-test-helper');
const sinon = require('sinon');
const chai = require('chai');
const expect = chai;

const helper = new Helper('../src/cfpb-indexer.js');

describe('cfpb-indexer', function() {
  beforeEach( function() {
    this.room = helper.createRoom();
    this.room.user.isAdmin = true;

    return this.room.robot.auth = {
      isAdmin: () => {
            return this.room.user.isAdmin;
      }
    };
  } );

  afterEach(() => {
    return this.room.destroy();
  } );

  xit('shows no index before indexing has occurred', () => {

    return this.room.user.say('alice', '@hubot show indexing')
    .then( () => {
        return expect(this.room.messages).to.eql([
            ['alice', '@hubot show indexing'],
            ['hubot', '@alice Here you go: \"nothing indexed!\"']
        ] );
    } );
  } );

  xit('starts indexing', function() {

    return this.room.user.say('alice', '@hubot start indexing')
    .then( () => {
        return expect(this.room.messages).to.eql([
            ['alice', '@hubot start indexing'],
            ['hubot', '@alice Indexing initiated...'],
            ['hubot', '@alice Indexing complete!']
        ]);
    } );
  } );

} );
