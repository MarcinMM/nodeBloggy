
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
      cs.app.use(cs.express.logger());
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
          title: 'Code [][]',
          content: "Immature Technologies!",
          output: response.page,
          tags: response.tags,
          mode: 'index'
        });
      });
    });

    cs.app.get('/:page([0-9]+)', function(req, res) {
      cs.fetch('page',req.params.page, function(response) {
        res.render('index', {
          title: 'Code [][] - Page '+req.params.page,
          content: "Immature Technologies!",
          output: response.page,
          tags: response.tags,
          mode: 'index'
        });
      });
    });

    cs.app.get('/tags/:tag([0-9a-zA-Z]+)', function(req, res){
      cs.fetch('tag', req.params.tag, function(response) {
        res.render('index', {
          title: 'Tag[][]: ' + req.params.tag,
          content: "Immature Technologies!",
          output: response.page,
          tags: response.tags,
          mode: 'index'
        });
      });
    });

    cs.app.get('/post/:post([0-9a-zA-Z-_]+)', function(req, res){
      cs.fetch('post', req.params.post, function(response) {
        var title = 'Code[][] by Post';
        // pull the first header from the response stack
        if (response.page.length > 0) {
          title = response.page[0].header;
        }
        res.render('index', {
          title: title,
          content: "Immature Technologies!",
          output: response.page,
          tags: response.tags,
          mode: 'post'
        });
      });
    });
    
    cs.app.get('/entry', function(req, res) {
      res.render('entry', {
        title: "Simplest Entry Form Ever"
      });
    });

    cs.app.get('/game', function(req, res) {
      res.render('game', {
        title: "A dweller appears!"
      });
    });

    cs.app.get('/xml', function(req, res) {
      cs.fetch(0,0, function(response) {
        for (var i in response.page) {
          var str = response.page[i].content.replace(/<br>/gi, "\n");
          str=str.replace(/<br>/gi, "\n");
          str=str.replace(/<p.*>/gi, "\n");
          str=str.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 (Link->$1) ");
          str=str.replace(/<(?:.|\s)*?>/g, "");
          str=str.replace(/\n/gi, "<br>");
          response.page[i].content = str;
        }
        res.render('xml', {
          title: 'Code [][] XML',
          output: response.page,
          layout: false
        });
      });
    });
    
    cs.app.post('/posts', function(req, res) {
      if (req.body.password == 'asdfaqasdfaq4321') {
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
      var content = cs.cleanup(contents.content);
      var timestamp = new Date().getTime();
      timestamp = Number(timestamp);
      var newEntry = {
        "header" : contents.header,
        "content" : content,
        "time": timestamp.toString(),
        "tags": contents.tags.split(" "),
        "hashURL": cs.textToUrl(contents.header)
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
      var params = {};
      var limit = 10;
      var limitAndSkipAndSort = { limit: limit, skip: 0, sort: [['time', 'desc']] };
      if (mode == 'tag') {
        params = { tags: queryString };
      } else if (mode == 'post') {
        params = { hashURL: queryString };
      } else if (mode == 'page') {
        limitAndSkipAndSort = { limit: limit, skip: (queryString * limit), sort: [['time', 'desc']] };
      } 

      var collection = new cs.mongodb.Collection(client, 'posts');

      cs.step(
        function getPageInfo() {
          var callback = this.parallel();
          var callback2 = this.parallel();
          // collect page contents such as headers and contents, by params
          collection.find(params, limitAndSkipAndSort).toArray(function(err, docs) {
            var posts = [];
            for (var i in docs) {
                tags = '';
                for (var j in docs[i].tags) {
                  tags += docs[i].tags[j] + ' ';
                }
                var postTime = new Date(parseInt(docs[i].time));
                outputHolder = { header : docs[i].header, content: docs[i].content, tags: tags, time: postTime.toUTCString(), hashURL: docs[i].hashURL };
                posts.push(outputHolder);
            }
            callback(null, posts);
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
  },
  
  cleanup: function(text) {
    var exp = /(\b(http(s?):\/\/)(www\.)?)([\w\.-]+)([\.{2,4}\/?])([\S]*)/ig;
    //text = text.replace("<", "&lt;");
    //text = text.replace(">", "&gt;");
    text = text.replace("<script", "&lt;script")
    text = text.replace(/(\r\n|\n|\r)/gm,"<br>");
    return text.replace(exp,"<b>[</b><a href='http$3://$4$5$6$7'>$5</a><b>]</b>");
  },
  
  textToUrl: function(text) {
    console.log(text);
    var exp = /[^A-Za-z0-9-_]/ig;
    text = text.toLowerCase();
    text = text.replace(/ /g, "_");
    text = text.replace(exp, "");
    console.log(text);
    return text;
  }
}

var cs = codesquares;
cs.init();
