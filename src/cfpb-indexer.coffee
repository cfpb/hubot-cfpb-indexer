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

createCrawler = require( './crawler' ).create
CronJob = require( 'cron' ).CronJob
isURL = require( 'is-url' )


class CfpbIndexerRobot
  # Ensure the brain (redis) has loaded
  # before we try and read from it
  constructor: ( @robot ) ->
    @crawlerOptions =
      URL: 'http://localhost:8000'
    Object.freeze @crawlerOptions
    @robot.brain.once 'loaded', =>
      @initCrawlerProperty()
      @scheduleCrawler()
      if @getBrain()
        @setCrawlerQueue JSON.stringify @getBrain()
      else
        @setBrain
  cancelCrawler: () =>
    if @cron
      @cron.stop()
    @crawler = null
    @setBrain null
  scheduleCrawler: ( time='00 58 17 * * 1-5' ) =>
    @crawler.on 'complete', () =>
        @setBrain @crawler.queue
    @cron = new CronJob time, =>
      @crawler.start()
    , null, true, 'America/New_York'
  getBrain: ( index ) =>
    @robot.brain.get 'cfpbIndex', index
  setBrain: ( index ) =>
    @robot.brain.set 'cfpbIndex', index
  crawlPage: ( res ) =>
    url = res.match.length > 0 && res.match[1].trim()
    index = @getBrain()
    if index[url]
        return index[url]
    if isURL url
      options =
        filterByDomain: false
        interval: 1000
        maxConcurrency: 2
        maxDepth: 2
        URL: url
      crawler = createCrawler options
      crawler.on 'fetchcomplete', ( queueItem ) ->
        index[url] = queueItem
      res.reply 'Indexing initiated for URL #{url}'
    else
      res.reply 'Invalid URL'
  setCrawlerQueue: ( data ) =>
    @crawler.queue.defrost data, ( error, queue ) =>
      if error
        console.log error
  initCrawlerProperty: ( value ) =>
    _crawler = null
    Object.defineProperty( this, 'crawler',
      get: () =>
        if not _crawler
          _crawler = createCrawler @crawlerOptions
        _crawler
      set: ( value ) =>
        _crawler = value
    )
  getCrawlerData: ( filter ) =>
    @crawler.queue.filterItems( filter, ( error, items ) =>
      console.log( 'These items returned 404 or 410 HTTP statuses', items )
    )

module.exports = ( robot ) ->
  cfpbIndexerRobot = new CfpbIndexerRobot robot

  robot.respond /index page(?:ing)?(.*)?/, ( res ) ->
    cfpbIndexerRobot.crawlPage( res )

  # https://your-bot.com/cfpb-indexer?key=foobar
  robot.router.get '/cfpb-indexer', ( req, res ) ->
    return res.send 403 unless req.query.key is process.env.HUBOT_CFPB_INDEXER_SECRET_KEY
    index = cfpbIndexerRobot.getIndex() or { error: 'nothing indexed!' }
    res.json(index)

  robot.respond /load index from file (.*)/, ( res ) ->
    fileName = res.match[1]
    cfpbIndexerRobot.loadcrawler fileName

  robot.respond /cancel index/, ( res ) ->
    cfpbIndexerRobot.cancelCrawler()
    res.reply 'The index has been cancelled'

  robot.respond /show index/, ( res ) ->
    index = cfpbIndexerRobot.getIndex()
    res.reply 'Here you go: #{JSON.stringify(index)}'

  robot.respond /which pages are in WordPress/, ( res ) ->
    index = cfpbIndexerRobot.getIndex()
    res.reply 'Here you go: #{JSON.stringify(index)}'

  robot.respond /which pages are 404ing?/, ( res ) ->
    cfpbIndexerRobot.getCrawlerData( { status: 'notfound' } )
    res.reply 'Here you go: #{JSON.getWordPressPages(index)}'

  robot.respond /which links are dead/, ( res ) ->
    index = cfpbIndexerRobot.getIndex()
    res.reply 'Here you go: #{JSON.stringify(index)}'
