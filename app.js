
/**
 * Module dependencies.
 */


// DB Setup (mongo)

// var db = require('mongodb');
// db('codesquares.posts').save({foo: 'bar'});

var output = new Array();
var outputHolder;

codesquares = {

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
      //cs.app.use(cs.express.compiler({ src: __dirname + '/views', enable: ['sass']}));
      cs.app.use(cs.app.router);
      cs.app.use(cs.express.static(__dirname + '/public'));
    });
  
    cs.app.configure('development', function(){
      cs.app.use(cs.express.errorHandler({ dumpExceptions: true, showStack: true })); 
    });
    
    cs.app.configure('production', function(){
      cs.app.use(cs.express.errorHandler()); 
    });

    cs.app.listen(3000);
    console.log("Express server listening on port %d in %s mode", cs.app.address().port, cs.app.settings.env);

    cs.app.get('/', function(req, res) {
      cs.fetch(0,0, function(response) {
        res.render('index', {
          title: 'Code Squares',
          content: "Immature Technologies!",
          output: response
        });
      });
    });

    cs.app.get('/tags/:tag([0-9a-zA-Z]+)', function(req, res){
      cs.fetch('tag', req.params.tag, function(response) {
        res.render('index', {
          title: 'Code Squares by Tag',
          content: "Immature Technologies!",
          output: response
        });
      });
    });

    cs.app.get('/post/:post([0-9a-zA-Z-]+)', function(req, res){
      cs.fetch('post', req.params.post, function(response) {
        res.render('index', {
          title: 'Code Squares by Post',
          content: "Immature Technologies!",
          output: response
        });
      });
    });
  },
  
  fetch: function(mode, queryString, callback) {
    var cs = codesquares;
    new cs.mongodb.Db('codesquares', cs.server, {}).open(function (error, client) {
      var cs = codesquares;
      var tags = '';
      var output = [];
      if (error) throw error;
      var collection = new cs.mongodb.Collection(client, 'posts');
      if (mode == 'tag') {
        collection.find({tags: queryString}, {limit:10}).toArray(function(err, docs) {
          for (var i in docs) {
              tags = '';
              for (var j in docs[i].tags) {
                tags += docs[i].tags[j] + ' ';
              }
              outputHolder = { header : docs[i].header, content: docs[i].content, tags: tags };
              output.push(outputHolder);
          }
          callback(output);
        });
      } else if (mode == 'post') {
        collection.find({hashURL: queryString}, {limit:10}).toArray(function(err, docs) {
          for (var i in docs) {
              tags = '';
              for (var j in docs[i].tags) {
                tags += docs[i].tags[j] + ' ';
              }
              outputHolder = { header : docs[i].header, content: docs[i].content, tags: tags };
              output.push(outputHolder);
          }
          callback(output);
        });        
      } else {
        collection.find({}, {limit:10}).toArray(function(err, docs) {
          for (var i in docs) {
              tags = '';
              for (var j in docs[i].tags) {
                tags += docs[i].tags[j] + ' ';
              }
              outputHolder = { header : docs[i].header, content: docs[i].content, tags: tags };
              output.push(outputHolder);
          }
          console.log(output);
          callback(output);
        }); 
      }
    });
  },
    
  sendPost: function() {
    cs.app.post('/posts', function(req, res) {
      console.log(req.body);
    });
  }
}


var cs = codesquares;
cs.init();

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

