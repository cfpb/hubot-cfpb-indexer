# Description
#   A Hubot script to index some useful cf.gov things
#
# Configuration:
#   HUBOT_CFPB_INDEXER_SECRET_KEY - Secret key that must be provided to start indexing
#
# Commands:
#   hubot start indexing - start indexing consumerfinance.gov
#   hubot show index - show consumerfinance.gov index
#
# Author:
#   CFPB

crawler = require './crawler'

class CfpbIndexerRobot
  # Ensure the brain (redis) has loaded before we try and read from it
  constructor: (@robot) ->
    initialized = false
    @robot.brain.on 'loaded', =>
      if not initialized
        initialized = true
        cfpbIndex = @robot.brain.get 'cfpbIndex'
        @robot.brain.set 'cfpbIndex', cfpbIndex
  getIndex: () ->
    @robot.brain.get 'cfpbIndex'
  setIndex: (index) ->
    @robot.brain.set 'cfpbIndex', index

module.exports = (robot) ->
  cfpbIndexerRobot = new CfpbIndexerRobot robot

  robot.respond /start index(ing)?/, (res) ->
    res.reply "Indexing initiated..."
    crawler.createSiteIndex (err, index) ->
      cfpbIndexerRobot.setIndex(index)
      res.reply "Indexing complete!"

  # https://your-bot.com/cfpb-indexer?key=foobar
  robot.router.get '/cfpb-indexer', (req, res) ->
    return res.send 403 unless req.query.key is process.env.HUBOT_CFPB_INDEXER_SECRET_KEY
    index = cfpbIndexerRobot.getIndex() or { error: 'nothing indexed!' }
    res.json(index)

  robot.respond /show index(ing)?/, (res) ->
    index = cfpbIndexerRobot.getIndex() or 'nothing indexed!'
    res.reply "Here you go: #{JSON.stringify(index)}"
