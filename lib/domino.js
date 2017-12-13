// https://strongloop.com/strongblog/loopback-connector-development-and-creating-your-own-connector/

var request = require('request');

exports.initialize = function initializeDataSource(dataSource, callback) {
    dataSource.connector = new DominoConnector(dataSource.settings);
    process.nextTick(function () {
        callback && callback();
    });
};

function DominoConnector(dataSourceProps) {
    this.serverURL = dataSourceProps.serverURL;
    this.userName = dataSourceProps.userName;
    this.password = dataSourceProps.password;
    this.database = dataSourceProps.database;
    this.view = dataSourceProps.view;

    this.baseUrl = this.serverURL + '/' + this.database + '/api/data';

    this._models = {};
}

DominoConnector.prototype.all = function (model, filter, callback) {

    var req = this._generateRequest();

    if (filter.where && filter.where.id) {
    	req.get('/documents/unid/' + filter.where.id, (e, r, body) => {
	        if (e) {
	            callback(e, null);
	            return;
	        }

	        var result = JSON.parse(body);
	        result.id = result['@unid'];

	        callback(null, [result]);
	    });
    } else {
    	req.get('/collections/name/' + this.view + '?systemcolumns=0x2&count=100', (e, r, body) => {
	        if (e) {
	            callback(e, null);
	            return;
	        }

	        var result = JSON.parse(body);

	        if (Array.isArray(result)) {
	            result.forEach((obj) => {
	                obj.id = obj['@unid'];
	            });
	        }

	        callback(null, result);
	    });
    }
};

DominoConnector.prototype.destroyAll = function (model, where, callback) {

    var req = this._generateRequest();

    req.delete('/collections/name/' + this.view + '/unid/' + where.id, (e, r, body) => {
        if (e) {
            callback(e, null);
            return;
        }

        callback(null, {count: 1});
    });
};

DominoConnector.prototype.create = function (model, data, callback) {

    var req = this._generateRequest();

    req.post({ "uri": "/documents", "json": data }, (e, r, body) => {

    	if (e) {
    		callback(e, null);
    	} else {
    		const loc = r.headers.location;

			var parts = loc.split('/');
			var lastSegment = parts.pop() || parts.pop();  // handle potential trailing slash

			callback(null, lastSegment);
    	}
    });
};

DominoConnector.prototype._generateRequest = function () {
    return request.defaults({
        'auth': {
            'user': this.userName,
            'pass': this.password
        },
        'baseUrl': this.baseUrl
    });
}

DominoConnector.prototype.updateAttributes = function (model, id, data, callback) {
    var req = this._generateRequest();

    req.patch({ "uri": "/documents/unid/" + id, "json": data }, (e, r, body) => {
        callback(null, body);
    });
}

/**
 * Replace attributes for a given model instance
 * @param {String} model The model name
 * @param {*} id The id value
 * @param {Object} data The model data instance containing all properties to
 * be replaced
 * @param {Object} options Options object
 * @param {Function} callback The callback function
 * @private
 */
DominoConnector.prototype.replaceById = function(model, id, data, options, callback) {
    var req = this._generateRequest();

    // TODO: The data may include an "id" property and the value may 
    // be the same as the document UNID.  Should we remove "id" before
    // sending the PUT request?
    
    req.put({ "uri": "/documents/unid/" + id, "json": data }, (e, r, body) => {
        callback(null, body);
    });
};


var Connector = require('loopback-connector').Connector;
require('util').inherits(DominoConnector, Connector);