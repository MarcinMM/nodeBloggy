
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// DB Setup (mongo)


var mongoose = require('mongoose');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var BlogPost = new Schema({
    header    : String
  , content   : String
  , date      : Date
});

var bloggy = mongoose.model('bloggy', BlogPost);
var output = '';

var db = mongoose.connect('mongodb://localhost/codesquares');

bloggy.find({}, function (err, docs) {
  output += docs.content;
});


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Code Squares',
    content: "Immature Technologies!",
    output: output
  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
