var swaggerUtils = require('./utils/swagger');

var fData = 'your minified swagger file content here in json format';

var fDataStr = JSON.stringify(fData);
var fDataObject = JSON.parse(fDataStr);
var httpStatuses = '200,201,400,401,403,412,418,500,501';
var reqHdrs = 'Content-Type,x-api-key,x-access-token,x-user-agent';
var resHeaders = 'x-access-token';
var qsParams = 'page,limit,query';
var qsPaths = '/v1/users,/v1/groups';
var qsMethods = 'get,get';

var httpStss = httpStatuses.split(",");
var rqHdrs = reqHdrs.split(",");
var qsPrms = qsParams.split(",");
var qsPths = qsPaths.split(",");
var qsMthds = qsMethods.split(",");
var rsHdrs = resHeaders.split(",");

var rh = swaggerUtils.addrequestheaders(fDataStr, rqHdrs);
var rp = swaggerUtils.addqueryparams(rh, qsPrms, qsPths, qsMthds);
var st = swaggerUtils.addstatus(rp,httpStss);
var cr = swaggerUtils.addcors(st, httpStss, rsHdrs);

console.log(cr);