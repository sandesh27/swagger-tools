var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('request', { title: 'AWS Request' });
});

module.exports = router;
