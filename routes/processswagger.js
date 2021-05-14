var express = require('express');
var router = express.Router();

router.post('/processswagger', function(req, res, next){
	var jsonFileContent = req.body.file_content;
	console.log("ee", JSON.stringify(jsonFileContent));
	var jsonminify = require("jsonminify");
	//console.log("ff", JSON.stringify(jsonminify(jsonFileContent)));
	//var st = req.body.http_statuses;
	//console.log("ff", st);
	res.json(jsonminify(jsonFileContent));
});

module.exports = router;
