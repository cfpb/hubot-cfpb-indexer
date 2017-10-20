/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
'use strict';

const fs = require( 'fs' );
const SimpleCrawler = require( 'simplecrawler' );
const queue = SimpleCrawler.queue;

/**
 * Find atomic components.
 * @param {string} url
 * @param {string} bufferResponse
 */
function _findAtomicComponents( url, responseBuffer ) {
  const SEARCH = /(?:(?:class=")|\s)((?:o|m|a)-[^_"__\s]*)/g;
  const pageHMTL = responseBuffer.toString();
  const prefixLookup = [
    'a-',
    'm-',
    'o-'
  ];
  let matchType = undefined;
  const components = [];
  let match = undefined;
  while ( ( match = SEARCH.exec( pageHMTL ) ) !== null) {
    match.forEach( function( match, groupIndex ) {
      matchType = match.substr( 0, 2 );
      if ( ( prefixLookup.indexOf( matchType ) > -1)
          && ( components.indexOf( match ) === -1 ) ) {
        components.push( match );
      }
    } );
  }

  return components;
};

/**
 * Add site index.
 * @param {string} siteCrawler
 */
function _addSiteIndexEvents( crawler ) {
  crawler.on('fetchcomplete', function( queueItem, responseBuffer ) {
    let components = [];
    components = _findAtomicComponents( queueItem, responseBuffer );
    _addToQueueItem( queueItem, components );
    console.log( `Fetching: ${queueItem.url}` );
  } );

  crawler.on( 'complete', function() {
    console.log( 'Index successfully completed.' );
  } );

  return crawler;
};

/**
 * Add to the queueItem.
 * @param {string} queueItem
 * @param {string} components
 */
function _addToQueueItem( queueItem, components ) {
  const arrayMethod = 'push';
  if ( Array.isArray( queueItem.components ) === false ) {
    queueItem.components = [];
  }
  queueItem.components = queueItem.components.concat( components );

  return queueItem;
};

/**
 * Import the queue from a frozen JSON file on disk.
 * Code copied from
 * https://github.com/simplecrawler/simplecrawler/blob/
 * 5f14fa4950cf9cd52bf77566e02df604fc1207d0/lib/queue.js#L451
 * @param {String} filename Filename passed directly to
 * [fs.readFile]{@link https://nodejs.org/api/fs.html#fs_fs_readfile_file_options_callback}
 * @param {FetchQueue~defrostCallback} callback
 */
queue.prototype.defrost = function defrost( fileData, callback ) {
  var queue = this;
  var defrostedQueue = [];

  if ( !fileData.toString( 'utf8' ).length ) {
    return callback( new Error( 'Failed to defrost queue from zero-length JSON.' ) );
  }

  try {
    defrostedQueue = JSON.parse( fileData.toString( 'utf8' ) );
  } catch ( error ) {
    console.log( error )
    return callback( error );
  }

  queue._oldestUnfetchedIndex = defrostedQueue.length - 1;
  queue._scanIndex = {};


  for ( var i = 0; i < defrostedQueue.length; i++ ) {
    var queueItem = defrostedQueue[i];
    queue.push( queueItem );

    if ( queueItem.status === 'queued' )  {
      queue._oldestUnfetchedIndex = Math.min( queue._oldestUnfetchedIndex, i );
    }

    queue._scanIndex[queueItem.url] = true;
  }

  console.log( defrostedQueue.length )
  callback( null, queue );
};

/**
 * Create site crawler.
 * @param {object} siteLocation
 */
function create ( options={} ) {
  const crawler = SimpleCrawler( options.URL );

  const crawlerDefaults = {
    interval: 200,
    maxConcurrency: 30,
    parseHTMLComments: false,
    parseScriptTags: false,
    stripQuerystring: true,
  };

  Object.assign( crawler, crawlerDefaults, options );

  _addSiteIndexEvents( crawler );

  return crawler
};

module.exports = { create: create };
