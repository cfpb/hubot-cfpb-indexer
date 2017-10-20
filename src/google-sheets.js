

var google = require( 'googleapis' );
var googleAuth = require( 'google-auth-library' );;
var authConfig = require( __dirname + '/sheets-config.json' );
var scopes = ['https://www.googleapis.com/auth/spreadsheets',
              'https://www.googleapis.com/auth/drive'];
var sheets = google.sheets( 'v4' );
var drive = google.drive( 'v3' );


function createSpreadSheet( authClient, tokens ) {
  var request = {
    resource: {},
    auth: authClient,
  };

  sheets.spreadsheets.create( request, ( err, response ) => {
    var permission = {
      'type':  'anyone',
      'role':  'reader'
    };

    drive.permissions.create( {
      auth: authClient,
      resource: permission,
      fileId: response.spreadsheetId,
      fields: 'id',
    }, function (err, res) {
      if ( err ) {
        // Handle error...
        console.error( err );
      } else {
        console.log( 'Permission ID: ', res.id )
      }
    } );

    if ( err ) {
      console.error( err );
      return;
    }
  } );
}

function authorizeAPI( authConfig, callback ) {
  const jwtClient = new google.auth.JWT(
    authConfig.client_email,
    null,
    authConfig.private_key,
    scopes
  );

  jwtClient.authorize( function ( err, tokens ) {
    if ( err ) {
      console.log( err );
      return;
    }

    callback( jwtClient, tokens );
  } );
}

authorizeAPI( authConfig, createSpreadSheet );
