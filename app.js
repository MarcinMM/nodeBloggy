
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
    cs.step = require('step');
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
          output: response.page,
          tags: response.tags
        });
      });
    });

    cs.app.get('/tags/:tag([0-9a-zA-Z]+)', function(req, res){
      cs.fetch('tag', req.params.tag, function(response) {
        res.render('index', {
          title: 'Code Squares by Tag',
          content: "Immature Technologies!",
          output: response.page,
          tags: response.tags
        });
      });
    });

    cs.app.get('/post/:post([0-9a-zA-Z-]+)', function(req, res){
      cs.fetch('post', req.params.post, function(response) {
        res.render('index', {
          title: 'Code Squares by Post',
          content: "Immature Technologies!",
          output: response.page,
          tags: response.tags
        });
      });
    });
    
    cs.app.get('/entry', function(req, res) {
      res.render('entry', {
        title: "Simplest Entry Form Ever"
      });
    });
    
    cs.app.post('/posts', function(req, res) {
      if (req.body.password == 'asdfaq1234') {
        cs.save(req.body);
        res.redirect('/');
      } else {
        res.redirect('/');
      }
    });
    
  },
  
  save: function(contents) {
    cs.server = new cs.mongodb.Server("127.0.0.1", 27017, {});

    new cs.mongodb.Db('codesquares', cs.server, {}).open(function (error, client) {  
      if (error) throw error;
      var collection = new cs.mongodb.Collection(client, 'posts');
      var timestamp = new Date().getTime();
      timestamp = Number(timestamp);
      var newEntry = {
        "header" : contents.header,
        "content" : contents.content,
        "time": timestamp
      };
      collection.insert(newEntry, function(err, docs) {
        client.close();
      });
    });
  },
  
  fetch: function(mode, queryString, theCallback) {
    var pageContent = [];
    new cs.mongodb.Db('codesquares', cs.server, {}).open(function (error, client) {  
      if (error) throw error;

      var tags = '';
      var params;
      if (mode == 'tag') {
        params = { tags: queryString };
      } else if (mode == 'post') {
        params = { hashURL: queryString };
      } else {
        params = {};
      }

      var collection = new cs.mongodb.Collection(client, 'posts');

      cs.step(
        function getPageInfo() {
          var callback = this.parallel();
          var callback2 = this.parallel();
          // collect page contents such as headers and contents, by params
          collection.find(params, {limit:10, sort:['time', 'desc']}).toArray(function(err, docs) {
            var posts = [];
            for (var i in docs) {
                tags = '';
                for (var j in docs[i].tags) {
                  tags += docs[i].tags[j] + ' ';
                }
                outputHolder = { header : docs[i].header, content: docs[i].content, tags: tags };
                posts.push(outputHolder);
            }
            callback(null, posts.reverse());
          });
          // now tags
          collection.find({ tags: {$exists: true}}, { tags: 1, _id: 0 } , {limit:10}).toArray(function(err, docs) {
            var tags = [];
            for (var i in docs) {
                for (var j in docs[i].tags) {
                  if (tags.indexOf(docs[i].tags[j]) == -1) {
                    tags.push(docs[i].tags[j]); 
                  } 
                }
            }
            callback2(null, tags);
          });
          // more?
        },
        function render(err, data1, data2) {
          if (err) throw err;
          // now I want everything from above
          var output = { page: data1, 'tags': data2 };
          theCallback(output);
        }
      );
    });
  }
}

var cs = codesquares;
cs.init();