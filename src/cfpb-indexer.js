'use strict';

// Description
//   A Hubot script to index some useful cf.gov things
//
// Configuration:
//   HUBOT_CFPB_INDEXER_SECRET_KEY - Secret key that must be provided to start indexing
//
// Commands:
//   hubot start indexing - start indexing consumerfinance.gov
//   hubot show index - show consumerfinance.gov index
//
// Author:
//   CFPB

const createCrawler = require( './crawler' ).create;
const { CronJob } = require( 'cron' );
const createGoogleSheets = require( './google-sheets' ).create;
const GitHub = require( './github' );
const isURL = require( 'is-url' );
var beautify = require( 'json-beautify' );

const CFPB_INDEX = 'cfpb-index';
const CFPB_INDEX_REPORT_URL = 'cfpb-index-report-url';

class CfpbIndexerRobot {
  constructor( robot, URL ) {
    this.robot = robot;
    this.crawlerOptions = { URL: URL };
    this.SHEETS.forEach(
      sheet => sheet.getData = sheet.getData.bind( this )
    );
    this.robot.brain.once( 'loaded', () => {
      this.initCrawlerProperty();
      this.scheduleCrawler();
      if ( this.getBrain() ) {
        this.setCrawlerQueue(
          JSON.stringify( this.getBrain() )
        );
      } else {
        this.setBrain();
      }
    } );
  }
  cancelCrawler() {
    if ( this.cron ) {
      this.cron.stop();
    }
    this.robot.brain.remove( CFPB_INDEX_REPORT_URL );
    this.robot.brain.remove( CFPB_INDEX );
    return this.crawler = null;
  }
  async createSpreadSheet( sheetData ) {
    const spreadSheetURL = await createGoogleSheets( sheetData );
    this.robot.brain.set( CFPB_INDEX_REPORT_URL, spreadSheetURL );
    this.robot.messageRoom( null,
      `Index report was created at ${spreadSheetURL}`
    );
  }
  getBrain( ) {
    return this.robot.brain.get( CFPB_INDEX );
  }
  getCrawlerData( filter ) {
    let data;
    this.crawler.queue.filterItems( filter, ( error, items ) => {
      if ( error ) {
        console.log( error );
      }
      data = items;
    } );

    return data;
  }
  getSpreadSheetURL() {
    return this.robot.brain.get( CFPB_INDEX_REPORT_URL );
  }
  loadIndex( fileOrURL ) {
    if ( isURL( fileOrURL ) ) {
      this.robot.http( fileOrURL )
      .get()( ( err, response, body ) => {
        this.setCrawlerQueue( body );
        this.robot.messageRoom( null, 'Crawler loaded...' );
      } );
    } else {
      this.robot.messageRoom( null, 'Invalid URL' );
    }
    return;
  }
  initCrawlerProperty( value ) {
    let _crawler = null;
    return Object.defineProperty( this, 'crawler', {
      get: () => {
        if ( !_crawler ) {
          _crawler = createCrawler( this.crawlerOptions );
        }
        return _crawler;
      },
      set: value => {
        return _crawler = value;
      }
    } );
  }
  setBrain( index ) {
    return this.robot.brain.set( CFPB_INDEX, index );
  }
  scheduleCrawler( time = '00 00 02 * * 0-6' ) {
    if ( this.cron ) {
      this.cron.stop();
    }
    this.crawler.on( 'complete', () => {
      this.setBrain( this.crawler.queue );
      this.createSpreadSheet( this.SHEETS );
      return GitHub.updateFile( beautify( this.crawler.queue, null, 2, 80 ) );
    } );

    return this.cron = new CronJob( time, () => {
      this.crawler.resetQueue();
      return this.crawler.start();
    }
    , null, true, 'America/New_York' );
  }
  setCrawlerQueue( data ) {
    return this.crawler.queue.defrost( data, ( error, queue ) => {
      if ( error ) {
        return console.log( error );
      }
    } );
  }
  async findAtomicComponents( componentList ) {
    const results = this.crawler.queue.filter( queueItem => {
      if ( queueItem.components &&  queueItem.components.length ) {
        return componentList.every( component =>
          queueItem.components.includes( component )
        );
      }
    } )
    .map( queueItem =>
      `[${queueItem.url}](${queueItem.url})<br/>`
    );

    if ( results.length === 0 ) {
      return this.robot.messageRoom( null, 'No results found' );
    }

    let gistResponse = await GitHub.createGist( {
      description: 'search-criteria: ' + componentList.join( ', ' )
                   + ' -- count: ' + results.length,
      public: true,
      files: {
        'atomic-index-search.md': { content: results.join( '' )  }
      }
    } );

    let msg;
    if ( !gistResponse.data ) {
      msg = 'There was an error generating the results.';
    } else {
      msg = 'View results at ' + gistResponse.data.html_url;
    }

    return this.robot.messageRoom( null, msg );
  }
}

CfpbIndexerRobot.prototype.SHEETS = [ {
  columns: ['Url', 'Referrer'],
  columnSize: [300, 300],
  getData: function getData() {
    return this.getCrawlerData( { stateData: { code: 404 } } )
           .map( function( index ) {
             return [index.url, index.referrer];
           } );
  },
  title: '404 Links'
}, {
  columns: ['URL', 'Referrer'],
  columnSize: [300, 300],
  getData: function getData() {
    return this.getCrawlerData( { stateData: { code: 500 } } )
           .map( function( index ) {
              return [index.url, index.referrer];
           } );
  },
  title: '500 Error Pages'
}, {
  columns: ['URL', 'Referrer'],
  columnSize: [300, 300],
  getData: function getData() {
    return this.crawler.queue.filter( queueItem => {
             return queueItem.url.slice( -1 ) === '/';
           } )
           .map( function( index ) {
             return [index.url, index.referrer];
           } );
  },
  title: 'Links ending with a slash'
}, {
  columns: ['URL'],
  columnSize: [500],
  getData: function getData() {
    return this.getCrawlerData( { hasWordPressContent: true } )
           .map( function( index ) {
            return [index.url];
           } );
  },
  title: 'Wordpress Pages'
} ];

module.exports = function( robot ) {
  const cfpbIndexerRobot = new CfpbIndexerRobot(
    robot,
    process.env.HUBOT_CFPB_INDEXER_DEFAULT_SITE
  );

  robot.router.get( '/cfpb-indexer', function( req, res ) {
    if ( req.query.key !== process.env.HUBOT_CFPB_INDEXER_SECRET_KEY ) {
      return res.send( 403 );
    }
    const index = cfpbIndexerRobot.getBrain() ||
                  { error: 'nothing indexed!' };
    return res.json( index );
  } );

  robot.respond( /cancel index/, function( res ) {
    cfpbIndexerRobot.cancelCrawler();
    return res.reply( 'The index has been cancelled' );
  } );

  robot.respond( /show pages with (?:the )?(.*) atomic component(s?)/,
    function( res ) {
      const componentList = res.match[1].split( ' ' );
      return cfpbIndexerRobot.findAtomicComponents( componentList );
    }
  );

  robot.respond( /schedule index at (.*)/, function( res ) {
    const indexTime = res.match[1];
    cfpbIndexerRobot.scheduleCrawler( indexTime );
    return res.reply( `The indexer is set to run at:${indexTime}` )
  } );

  robot.respond( /load index from (?:file|url) (.*)/, function( res ) {
    const fileName = res.match[1];
    return cfpbIndexerRobot.loadIndex( fileName );
  } );

  robot.respond( /show index$/, function( res ) {
    const indexURL = process.env.HUBOT_CFPB_INDEXER_GITHUB_URL;
    return res.reply( `Here you go: ${JSON.stringify(indexURL)}` );
  } );

  robot.respond( /show index report/, function( res ) {
    const spreadSheetURL = cfpbIndexerRobot.getSpreadSheetURL();
    return res.reply( `Here you go: ${spreadSheetURL}` );
  } );
};
