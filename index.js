var through     = require('through2');
var gutil       = require('gulp-util');
var PluginError = gutil.PluginError;
var fs          = require('fs');
var crypto      = require('crypto');

const PLUGIN_NAME = 'gulp-rev-qs';

function getFileHash(fileName) {

    if ( fs.existsSync(fileName) ) {
        var data = fs.readFileSync( fileName, 'utf-8' );
        var hash = crypto.createHash('md5').update( data ).digest('hex');
        return hash.slice( 0, 10 );
    }

    return false;

}

// Plugin function
function gulpRevQueryStrings(opts) {

    // Matches
    var matches = [];
    if ( opts.match ) {
        matches = opts.match;
    } else if ( 'string' === typeof opts ) {
        matches = [opts];
    } else if ( Array.isArray(opts) ) {
        matches = opts;
    } else {
        throw new PluginError(PLUGIN_NAME, 'No matches found');
    }

    var param = opts.param || 'rev';
    var replace = opts.replace || 'md5';

    // Creating a stream through which each file will pass
    return through.obj(function(file, enc, cb) {

        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
            return cb();
        }

        if (file.isBuffer()) {
            var oldContents = file.contents.toString('utf-8');
            var newContents = oldContents;
            for ( var i in matches ) {
                var queryStringPattern = 'time' === replace ? '\\d+' : '[a-f\\d]{10}';
                var queryStringReplacement = 'time' === replace ? (new Date).getTime() : getFileHash(matches[i]);

                // Fall back to timestamp if no hash could be generated
                if ( false === queryStringReplacement ) {
                    queryStringReplacement = (new Date).getTime();
                    queryStringPattern = '\\d+';
                }

                var re = new RegExp( matches[i] + '(\\?' + param + '=' + queryStringPattern + ')?', 'g' );
                newContents = newContents.replace( re, matches[i] + '?' + param + '=' + queryStringReplacement );
            }

            if ( newContents !== oldContents ) {
                gutil.log('Query strings updated');
            } else {
                gutil.log('Query strings NOT updated');
            }

            file.contents = new Buffer(newContents);
        }

        this.push(file);
        cb();

    });

}

// Exporting the plugin main function
module.exports = gulpRevQueryStrings;
