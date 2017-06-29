Helper = require 'hubot-test-helper'
sinon = require 'sinon'
chai = require 'chai'

expect = chai.expect

helper = new Helper('../src/cfpb-indexer.coffee')

describe 'cfpb-indexer', ->
  beforeEach ->
    @room = helper.createRoom()
    @room.user.isAdmin = true
    @room.robot.auth = isAdmin: =>
      return @room.user.isAdmin

  afterEach ->
    @room.destroy()

  it 'shows no index before indexing has occurred', ->
    @room.user.say('alice', '@hubot show indexing').then =>
      expect(@room.messages).to.eql [
        ['alice', '@hubot show indexing']
        ['hubot', '@alice Here you go: \"nothing indexed!\"']
      ]

  it 'starts indexing', ->
    @room.user.say('alice', '@hubot start indexing').then =>
      expect(@room.messages).to.eql [
        ['alice', '@hubot start indexing']
        ['hubot', '@alice Indexing initiated...']
        ['hubot', '@alice Indexing complete!']
      ]
