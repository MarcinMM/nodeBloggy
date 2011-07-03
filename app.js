
/**
 * Module dependencies.
 */


// DB Setup (mongo)

// var db = require('mongodb');
// db('codesquares.posts').save({foo: 'bar'});

var output = new Array();
var outputHolder;

codesquares = {

  output: [],
  mongodb: '',
  server: '',
  app: '',
  express: '',
  
  init: function() {
    cs = codesquares;
    cs.express = require('express');
    cs.app = cs.express.createServer();
    cs.mongodb = require('mongodb');
    cs.server = new cs.mongodb.Server("127.0.0.1", 27017, {});

    cs.app.configure(function(){
      cs.app.set('views', __dirname + '/views');
      cs.app.set('view engine', 'jade');
      cs.app.use(cs.express.bodyParser());
      cs.app.use(cs.express.methodOverride());
      cs.app.use(cs.app.router);
      cs.app.use(cs.express.static(__dirname + '/public'));
    });
  
    cs.app.configure('development', function(){
      cs.app.use(cs.express.errorHandler({ dumpExceptions: true, showStack: true })); 
    });
    
    cs.app.configure('production', function(){
      cs.app.use(cs.express.errorHandler()); 
    });

  },
  
  fetch: function() {
    var cs = codesquares;
    new cs.mongodb.Db('codesquares', cs.server, {}).open(function (error, client) {
      if (error) throw error;
      var collection = new cs.mongodb.Collection(client, 'posts');
      collection.find({}, {limit:10, header: !undefined}).toArray(function(err, docs) {
        for (var i in docs) {
            outputHolder = { header : docs[i].header, content: docs[i].content };
            cs.output.push(outputHolder);
        }
        console.log('inside');
        console.log(cs.output);
      });
    });
  },
  
  postList: function() {
    var cs = codesquares;
    cs.app.get('/', function(req, res){
      res.render('index', {
        title: 'Code Squares',
        content: "Immature Technologies!",
        output: cs.output
      });
    });

    cs.app.listen(3000);
    console.log("Express server listening on port %d in %s mode", cs.app.address().port, cs.app.settings.env);
  },
  
}

codesquares.init();
codesquares.fetch();
codesquares.postList();

/*
var client = new Db('posts', new Server("127.0.0.1", 27017, {})),
    test = function (err, collection) {
      collection.insert({a:2}, function(err, docs) {
        // Locate all the entries using find
        collection.find().toArray(function(err, results) {
          console.log(results);
          // Let's close the db
          client.close();
        });
      });
    };
*/
/*
client.open(function(err, p_client) {
  client.collection('test_insert', test);
});
*/

/*
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
*/

