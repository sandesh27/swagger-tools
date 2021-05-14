var _ = require("lodash");

exports.addstatus = function (fileContent, statuses) {
    var fDataObject = JSON.parse(fileContent);
    var responseStatusesObject = {};
    var awsApiGatewayStatusesObject = {};

    statuses.map(function (st) {
        responseStatusesObject[st] = {
            "description": st + " response",
            "schema": {
                "$ref": "#/definitions/Empty"
            }
        };
        awsApiGatewayStatusesObject[st] = { statusCode: st };
    });

    //Iterating over all the URL paths to add prepared statuses
    var pathKeys = Object.keys(fDataObject.paths);

    var pathMap = pathKeys.map(function (path) {

        var currentPath = path;
        var currentPathObject = fDataObject["paths"][currentPath];
        var currentPathObjectKeys = Object.keys(currentPathObject);

        var currentPathObjectKeysMap = currentPathObjectKeys.map(function (method) {

            if (fDataObject["paths"][currentPath][method] != undefined) {
                var responseStatusesKeys = Object.keys(responseStatusesObject);
                responseStatusesKeys.map(function (status) {
                    if (!fDataObject["paths"][currentPath][method]['responses'][status]) {
                        fDataObject["paths"][currentPath][method]['responses'][status] = responseStatusesObject[status];
                    }
                });

                //console.log("fDataObject1", JSON.stringify(fDataObject));
                if (fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['responses']['default']) {
                    delete fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['responses']['default'];
                    fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['responses']['200'] = { "statusCode": "200" };
                }

                var awsApiGatewayStatusesKeys = Object.keys(awsApiGatewayStatusesObject);

                awsApiGatewayStatusesKeys.map(function (apiStatus) {
                    //console.log("apiStatus",apiStatus);
                    if (!fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['responses'][apiStatus]) {
                        fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['responses'][apiStatus] = awsApiGatewayStatusesObject[apiStatus];
                    }
                });
            }
        });
    });
    //console.log("res addstatus :: ");
    return JSON.stringify(fDataObject);
};

exports.addcors = function (fileContent, statuses, resHeaders) {
    var fDataObject = JSON.parse(fileContent);
    //console.log("fDataObject", JSON.stringify(fDataObject));
    var responseRaw = {};
    var awsApiIntResStRaw = {};
    var rsHdrs = "";
    if (resHeaders.length > 0) {
        rsHdrs = "," + resHeaders.join(",");
        //rsHdrs = rsHdrs.slice(0, -1);
    }

    var rsMethodsAdded = "'GET,POST,PUT,DELETE,OPTIONS'";
    var resHeadersAllowed = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token" + rsHdrs + "'";

    //console.log("resHeadersAllowed :: ", resHeadersAllowed);

    statuses.map(function (st) {
        responseRaw[st] = {
            "description": st + " response",
            "schema": {
                "$ref": "#/definitions/Empty"
            },
            "headers": {
                "Access-Control-Allow-Headers": {
                    "type": "string"
                },
                "Access-Control-Allow-Methods": {
                    "type": "string"
                },
                "Access-Control-Allow-Origin": {
                    "type": "string"
                },
                "X-XSS-Protection": {
                    "type": "string"
                }
            }
        };

        awsApiIntResStRaw[st] = {
            "statusCode": "" + st,
            "responseParameters": {
                "method.response.header.Access-Control-Allow-Methods": rsMethodsAdded,
                "method.response.header.Access-Control-Allow-Headers": resHeadersAllowed,
                "method.response.header.Access-Control-Allow-Origin": "'*'",
                "method.response.header.X-XSS-Protection": "'1; mode=block'"
            }
        };
    });

    //Preparing section for adding data to Method -> options
    var optionsRaw = {
        "consumes": [
            "application/json"
        ],
        "produces": [
            "application/json"
        ],
        "responses": responseRaw,
        "x-amazon-apigateway-integration": {
            "responses": awsApiIntResStRaw,
            "requestTemplates": {
                "application/json": "{\"statusCode\": 200}"
            },
            "passthroughBehavior": "when_no_match",
            "type": "mock"
        }
    };

    //Preparing section for adding data to Method -> responses -> 200 -> headers
    var responseHeadersRaw = {
        "Access-Control-Allow-Origin": {
            "type": "string"
        },
        "Access-Control-Allow-Methods": {
            "type": "string"
        },
        "Access-Control-Allow-Headers": {
            "type": "string"
        },
        "X-XSS-Protection": {
            "type": "string"
        }
    };
    var responseHeadersStr = JSON.stringify(responseHeadersRaw);
    var responseHeadersObject = JSON.parse(responseHeadersStr);

    //Preparing section for adding data to Method -> x-amazon-apigateway-integration -> responses -> 200 -> responseParameters
    var awsApiGatewayIntegrationRaw = {
        "method.response.header.Access-Control-Allow-Origin": "'*'",
        "method.response.header.Access-Control-Allow-Methods": rsMethodsAdded,
        "method.response.header.Access-Control-Allow-Headers": resHeadersAllowed,
        "method.response.header.X-XSS-Protection": "'1; mode=block'"
    };
    var awsApiGatewayIntegrationStr = JSON.stringify(awsApiGatewayIntegrationRaw);
    var awsApiGatewayIntegrationObject = JSON.parse(awsApiGatewayIntegrationStr);

    //Iterating over all the URL paths to add prepared CORS headers
    var pathKeys = Object.keys(fDataObject.paths);

    var pathMap = pathKeys.map(function (path) {
        var currentPath = path;
        var currentPathObject = fDataObject["paths"][currentPath];
        var currentPathObjectKeys = Object.keys(currentPathObject);
        var optionMockMethodIndex = currentPathObjectKeys.indexOf("options");

        var currentPathObjectKeysMap = currentPathObjectKeys.map(function (method) {

            if (fDataObject["paths"][currentPath][method] != undefined) {

                statuses.map(function (st) {
                    if (fDataObject["paths"][currentPath][method]['responses'][st] != undefined) {
                        if (!_.has(fDataObject["paths"][currentPath][method]['responses'][st], 'requestParameters')) {
                            fDataObject["paths"][currentPath][method]['responses'][st]['headers'] = responseHeadersObject;
                        }
                        else {
							/*
							if(!_.has(fDataObject["paths"][currentPath][method]['responses'][st]['requestParameters'], 'Access-Control-Allow-Origin')){
								fDataObject["paths"][currentPath][method]['responses'][st]['requestParameters']['Access-Control-Allow-Origin'] = {
									"type": "string"
								}
							}
							*/
                        }
                    }

                    if (fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['responses'][st] != undefined) {

                        if (!_.has(fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['responses'][st], 'requestParameters')) {
                            fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['responses'][st]['responseParameters'] = awsApiGatewayIntegrationObject;
                        }
                        else {
							/*
							if(!_.has(fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['responses'][st]['requestParameters'], 'method.response.header.Access-Control-Allow-Origin')){
								fDataObject["paths"][currentPath][method]['responses'][st]['requestParameters']['Access-Control-Allow-Origin'] = "'*'";
							}				
							*/
                        }
                    }
                });
            }
        });

        if (!_.has(fDataObject["paths"][currentPath], 'options')) {
            var optionsStr = JSON.stringify(optionsRaw);
            //Adding OPTIONS mock object methods
            var optionsObject = JSON.parse(optionsStr);
            fDataObject["paths"][currentPath]['options'] = optionsObject;
        }
        else {
			/*
			if(!_.has(fDataObject["paths"][currentPath][method]['options']['responses']['headers'], 'Access-Control-Allow-Origin'){
				fDataObject["paths"][currentPath][method]['options']['responses']['headers']['Access-Control-Allow-Origin'] = {
					"type": "string"
				}
			}
			if(!_.has(fDataObject["paths"][currentPath][method]['options']['responses']['headers'], 'Access-Control-Allow-Methods'){
				fDataObject["paths"][currentPath][method]['options']['responses']['headers']['Access-Control-Allow-Methods'] = {
					"type": "string"
				}
			}	
			if(!_.has(fDataObject["paths"][currentPath][method]['options']['responses']['headers'], 'Access-Control-Allow-Headers'){
				fDataObject["paths"][currentPath][method]['options']['responses']['headers']['Access-Control-Allow-Headers'] = {
					"type": "string"
				}
			}
			*/
        }

    });
    //console.log("res addcors :: ");
    return JSON.stringify(fDataObject);
};

exports.addrequestheaders = function (fileContent, reqHeaders) {
    var fDataObject = JSON.parse(fileContent);
    var parametersArray = [];

    //Iterating over all the URL paths to add prepared request headers
    var pathKeys = Object.keys(fDataObject.paths);

    var pathMap = pathKeys.map(function (path) {

        var currentPath = path;
        var currentPathObject = fDataObject["paths"][currentPath];
        var currentPathObjectKeys = Object.keys(currentPathObject);

        var currentPathObjectKeysMap = currentPathObjectKeys.map(function (method) {

            if (fDataObject["paths"][currentPath][method] != undefined) {
                var currentCount = 0;
                var parametersObjectArray = [];
                var reqParamObject = [];
                var isEmptyParam = false;
                var isEmptyReqParam = false;
                reqHeaders.map(function (rqHdr) {
                    if (!_.has(fDataObject["paths"][currentPath][method], 'parameters') && method != 'options') {
                        isEmptyParam = true;
                        parametersObjectArray.push({
                            "name": rqHdr,
                            "in": "header",
                            "required": false,
                            "type": "string"
                        });
                    }
                    else if (!_.find(fDataObject["paths"][currentPath][method]['parameters'], { "name": "" + rqHdr }) && method != 'options') {
                        fDataObject["paths"][currentPath][method]['parameters'].push({
                            "name": rqHdr,
                            "in": "header",
                            "required": false,
                            "type": "string"
                        });
                    }

                    if (!_.has(fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration'], 'requestParameters') && method != 'options') {
                        isEmptyReqParam = true;
                        reqParamObject['integration.request.header.' + rqHdr] = 'method.request.header.' + rqHdr;
                    }
                    else if (!_.has(fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['requestParameters'], ['integration.request.header.' + rqHdr]) && method != 'options') {
                        fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['requestParameters']['integration.request.header.' + rqHdr] = 'method.request.header.' + rqHdr;
                    }
                    currentCount++;
                });
                if (isEmptyParam == true) {
                    fDataObject["paths"][currentPath][method]['parameters'] = parametersObjectArray;
                }
                if (isEmptyReqParam == true) {
                    fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['requestParameters'] = reqParamObject;
                }
            }
        });
    });

    //console.log("res addrequestheaders :: ");

    return JSON.stringify(fDataObject);
};


exports.addqueryparams = function (fileContent, reqParams, reqPaths, reqMethods) {
    var fDataObject = JSON.parse(fileContent);
    var parametersArray = [];

    //Iterating over all the URL paths to add prepared query parameters
    var pathKeys = Object.keys(fDataObject.paths);

    var pathMap = pathKeys.map(function (path) {

        var currentPath = path;
        var currentPathObject = fDataObject["paths"][currentPath];
        var currentPathObjectKeys = Object.keys(currentPathObject);

        var currentPathObjectKeysMap = currentPathObjectKeys.map(function (method) {

            if (fDataObject["paths"][currentPath][method] != undefined && reqPaths.indexOf(currentPath) != -1 && method == reqMethods[reqPaths.indexOf(currentPath)] ) {
                var currentCount = 0;
                var parametersObjectArray = [];
                var reqParamObject = [];
                var isEmptyParam = false;
                var isEmptyReqParam = false;
                reqParams.map(function (rqPrm) {
                    if (!_.has(fDataObject["paths"][currentPath][method], 'parameters') && method != 'options') {
                        isEmptyParam = true;
                        parametersObjectArray.push({
                            "name": rqPrm,
                            "in": "query",
                            "required": false,
                            "type": "string"
                        });
                    }
                    else if (!_.find(fDataObject["paths"][currentPath][method]['parameters'], { "name": "" + rqPrm }) && method != 'options') {
                        fDataObject["paths"][currentPath][method]['parameters'].push({
                            "name": rqPrm,
                            "in": "query",
                            "required": false,
                            "type": "string"
                        });
                    }

                    if (!_.has(fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration'], 'requestParameters') && method != 'options') {
                        isEmptyReqParam = true;
                        reqParamObject['integration.request.querystring.' + rqPrm] = 'method.request.querystring.' + rqPrm;
                    }
                    else if (!_.has(fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['requestParameters'], ['integration.request.querystring.' + rqPrm]) && method != 'options') {
                        fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['requestParameters']['integration.request.querystring.' + rqPrm] = 'method.request.querystring.' + rqPrm;
                    }
                    currentCount++;
                });
                if (isEmptyParam == true) {
                    fDataObject["paths"][currentPath][method]['parameters'] = parametersObjectArray;
                }
                if (isEmptyReqParam == true) {
                    fDataObject["paths"][currentPath][method]['x-amazon-apigateway-integration']['requestParameters'] = reqParamObject;
                }
            }
        });
    });

    //console.log("res addqueryparams :: ");

    return JSON.stringify(fDataObject);
};