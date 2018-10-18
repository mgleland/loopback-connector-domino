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

    // TODO: A single database can contain multiple models (e.g. Person, Group, etc.).
    // Each model most likely corresponds to a different view and form.  We should
    // eventually allow configuration of a model map where each entry points to a view
    // and a form.  For now, just allow one model per datasource.

    if (dataSourceProps.view) this.view = dataSourceProps.view;
    this.form = dataSourceProps.form;
    this.disableFormCompute = dataSourceProps.disableFormCompute;

    this.baseUrl = this.serverURL + '/' + this.database + '/api/data';

    this._models = {};
}

DominoConnector.prototype.all = function (model, filter, callback) {

    let req = this._generateRequest();

    if (filter.where && filter.where.id) {
    	req.get('/documents/unid/' + filter.where.id, (e, r, body) => {
	        if (e) {
	            callback(e, null);
	            return;
	        }

	        let result = JSON.parse(body);
	        result.id = result['@unid'];

	        callback(null, [result]);
	    });
    } else {

      // Set the count parameter
      let params = 'count=';
      if (filter.limit) {
        params += filter.limit;
      }
      else {
        params += 100;
      }

      // Set the start parameter
      if (filter.skip) {
        params += '&start=' + filter.skip;
      }

      const collectionName = this.view ? this.view : model.definition.name;

    	req.get('/collections/name/' + collectionName + '?systemcolumns=0x2&' + params, (e, r, body) => {
	        if (e) {
	            callback(e, null);
	            return;
	        }

	        let result = JSON.parse(body);

	        if (Array.isArray(result)) {
	            result.forEach((obj) => {
	                obj.id = obj['@unid'];
	            });
	        }

	        callback(null, result);
	    });
    }
};

DominoConnector.prototype.count = function count(model, where, options, callback) {
  let req = this._generateRequest();
  let ourCount = 0;
  const collectionName = this.view ? this.view : model.definition.name;

  req.get('collections/name/' + collectionName + '?entrycount=true', (e, r, body) => {
    if (r.headers && r.headers['content-range']) {
      const parts = r.headers['content-range'].split('/');
      ourCount = parts.pop() || parts.pop();  // handle potential trailing slash
    }
    callback(null, ourCount);
  });
};

DominoConnector.prototype.destroyAll = function (model, where, callback) {

    let req = this._generateRequest();

    const collectionName = this.view ? this.view : model.definition.name;
    req.delete('/collections/name/' + collectionName + '/unid/' + where.id, (e, r, body) => {
        if (e) {
            callback(e, null);
            return;
        }

        callback(null, {count: 1});
    });
};

DominoConnector.prototype.create = function (model, data, callback) {

    let req = this._generateRequest();
    let uri = '/documents';

    if ( this.form ) {
      uri += '?form=' + this.form;

      // The connector uses computewithform by default.  Add the parameter
      // unless it is disabled by configuration.
      if ( !this.disableFormCompute ) {
        uri += '&computewithform=true';
      }
    }

    req.post({ "uri": uri, "json": data }, (e, r, body) => {

      if (e) {
        callback(e, null);
      }
      else {
        const loc = r.headers.location;

        let parts = loc.split('/');
        let lastSegment = parts.pop() || parts.pop();  // handle potential trailing slash

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
    let req = this._generateRequest();

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
    let req = this._generateRequest();

    // TODO: The data may include an "id" property and the value may
    // be the same as the document UNID.  Should we remove "id" before
    // sending the PUT request?

    req.put({ "uri": "/documents/unid/" + id, "json": data }, (e, r, body) => {
        callback(null, body);
    });
};


var Connector = require('loopback-connector').Connector;
require('util').inherits(DominoConnector, Connector);
