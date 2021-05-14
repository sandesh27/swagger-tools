var express = require('express');
var path = require('path');
var requestLib = require('request');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var request = require('./routes/request');
var swagger = require('./routes/swagger');
var post = require('./routes/post');
var swaggerUtils = require('./utils/swagger');
var multer = require('multer');
var _ = require('lodash');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/request', request);
app.use('/swagger', swagger);
app.use('/post', post);
var upload = multer({ dest: 'uploads/' })

app.post('/processswagger', upload.single('file'), function(req, res, next){
	var reqFile = req.file;		
	var fs = require('fs');	
	var path = require('path');
    var mime = require('mime');

    var contents = null;
    contents = fs.readFileSync(reqFile.destination + '/' + reqFile.filename, 'utf8');	
    fs.unlink(reqFile.destination + '/' + reqFile.filename);
	//console.log("ee", contents);
    if (contents != null) {

        var httpStatuses = req.body.http_statuses;
        var statuses = httpStatuses.split(',');
        statuses = _.compact(statuses);
        statuses = statuses.sort();
        //console.log("statuses :: ", JSON.stringify(statuses));

        var reqQueryParams = req.body.req_query_params;
        var queryParams = reqQueryParams.split(',');        
        queryParams = _.compact(queryParams);
        queryParams = queryParams.sort();
        //console.log("queryParams :: ", JSON.stringify(queryParams));

        var reqQueryParamPaths = req.body.req_qs_paths;
        var queryParamPaths = reqQueryParamPaths.split(',');        
        queryParamPaths = _.compact(queryParamPaths);
        queryParamPaths = queryParamPaths.sort();
        //console.log("queryParamPaths :: ", JSON.stringify(queryParamPaths));

        var reqQueryParamMethodss = req.body.req_qs_methods;
        var queryParamMethods = reqQueryParamMethodss.split(',');
        queryParamMethods = _.compact(queryParamMethods);
        queryParamMethods = queryParamMethods.sort();
        //console.log("queryParamMethods :: ", JSON.stringify(queryParamMethods));

        var reqHeaders = req.body.req_headers;
        var rqHeaders = reqHeaders.split(',');
        rqHeaders = _.compact(rqHeaders);
        rqHeaders = rqHeaders.sort();
        //console.log("req headers :: ", JSON.stringify(rqHeaders));

        var resHeaders = req.body.res_headers;
        var rsHeaders = resHeaders.split(',');
        rsHeaders = _.compact(rsHeaders);
        rsHeaders = rsHeaders.sort();
        //console.log("res headers :: ", JSON.stringify(rsHeaders));

        var response = null;

      
        if (rqHeaders.length > 0) {
            response = swaggerUtils.addrequestheaders(contents, rqHeaders);
            //console.log("res 1 :: ");
        }      


        if (queryParamPaths.length > 0 && queryParams.length > 0 && queryParamMethods.length > 0 && queryParamPaths.length == queryParamMethods.length ) {
            if (response != null) {
                response = swaggerUtils.addqueryparams(response, queryParams, queryParamPaths, queryParamMethods);
                //console.log("res 2 :: ");
            }
            else {
                response = swaggerUtils.addqueryparams(contents, queryParams, queryParamPaths, queryParamMethods);
                //console.log("res 3 :: ");
            }
        }


        if (response != null) {
            response = swaggerUtils.addstatus(response, statuses);
            //console.log("res 4 :: ");
        }
        else {
            response = swaggerUtils.addstatus(contents, statuses);
            //console.log("res 5 :: ");
        }

        if (response != null) {
            response = swaggerUtils.addcors(response, statuses, rsHeaders);
            //console.log("res 6 :: ");
        }
        else {
            response = swaggerUtils.addcors(contents, statuses, rsHeaders);
            //console.log("res 7 :: ");
        }

        /*
        var stream = fs.createWriteStream(__dirname + '/uploads/swagger.json');
        stream.once('open', function(fd) {
          stream.write(corsAddedContent+"\n");
          stream.end();
        });	
    	
        var file = __dirname + '/uploads/swagger.json';
        var filename = path.basename(file);
        var mimetype = mime.lookup(file);
    
        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', mimetype);
    
        var filestream = fs.createReadStream(file);
        filestream.pipe(res);	
        */
        var slim = require('json-slim');
        var jsonminify = require("jsonminify");
        res.json(slim(response));
    }
    else {
        res.json({ message: 'Empty File' });
    }
});

app.post('/processpost', function(req, res, next){
	var reqUrl = req.body.req_url;
	var method = req.body.req_method;
	var reqHeaders = JSON.parse(req.body.req_headers);
	var body = JSON.parse(req.body.req_body);
	
	var option = {
		uri: reqUrl,
		method: method,
		headers: reqHeaders,
		json: body
	};
	
	requestLib(
		option,
		function (error, response, body) {
			if (response != undefined) {
				res.json(body);
			} else {
				res.json(error);
			}
		}
	);	
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
	  message: err.message,
	  error: err
	});
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
	message: err.message,
	error: {}
  });
});


module.exports = app;
