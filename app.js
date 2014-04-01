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
    cs.server = new cs.mongodb.Server(
      "mongodb://heroku_app23641824:v7pcjchbjub6m8qor1ip335fn2@ds035897.mongolab.com", 
      35897, 
      {}
    );
    cs.db = new cs.mongodb.Db('heroku_app23641824', cs.server, {});
    cs.db.open(function (error, client) {
      if (error) throw error;
      cs.collection = new cs.mongodb.Collection(client, 'posts');
      cs.loggery = new cs.mongodb.Collection(client, 'logs');
    });

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

    cs.app.listen(80);
    console.log("Express server listening on port 80 in %s mode", cs.app.settings.env);

    cs.app.get('/', function(req, res) {
      cs.fetch(0,0, function(response) {
        res.render('index', {
          title: 'Code [][]',
          content: "Immature Technologies!",
          output: response.page,
          tags: response.tags,
          mode: 'index',
          page: 0
        });
      });
      cs.logSave(req);
    });

    cs.app.get('/:page([0-9]+)', function(req, res) {
      cs.fetch('page',req.params.page, function(response) {
	if (response.page.length > 0) {
        res.render('index', {
          title: 'Code [][] - Page '+req.params.page,
          content: "Immature Technologies!",
          output: response.page,
          tags: response.tags,
          mode: 'index',
          page: req.params.page
        });
	} else {
		cs.fetch('page', 0, function(response) {
        		res.render('index', {
        		  title: 'Code [][]',
        		  content: "Immature Technologies!",
        		  output: response.page,
        		  tags: response.tags,
        		  mode: 'index',
        		  page: 0
        		});
		});

	}

      });
      cs.logSave(req);
    });

    cs.app.get('/tags/:tag([0-9a-zA-Z]+)', function(req, res){
      cs.fetch('tag', req.params.tag, function(response) {
        res.render('index', {
          title: 'Tag[][]: ' + req.params.tag,
          content: "Immature Technologies!",
          output: response.page,
          tags: response.tags,
          mode: 'index',
          page: 0
        });
      });
      cs.logSave(req);
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
          mode: 'post',
          page: 0
        });
      });
      cs.logSave(req);
    });
    
    cs.app.get('/entry', function(req, res) {
      res.render('entry', {
        title: "Simplest Entry Form Ever"
      });
      cs.logSave(req);
    });

    cs.app.get('/game', function(req, res) {
      res.render('game', {
        title: "A dweller appears!"
      });
      cs.logSave(req);
    });

    cs.app.get('/about', function(req, res) {
      res.render('about', {
        title: "The imaginatively titled About Page"
      });
      cs.logSave(req);
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
      cs.logSave(req);
    });
    
    cs.app.get('/logs', function(req, res) {
      cs.loggery.find({}, { sort: [['time', 'desc']] }).toArray(function(err, logs) {
        var posts = [];
        for (var i in logs) {
          var postTime = new Date(parseInt(logs[i].time));
          outputHolder = { ip : logs[i].ip, path: logs[i].path, time: postTime.toUTCString(), query: logs[i].query };
          posts.push(outputHolder);
        }
        res.render('logs', {
          title: 'Loggery',
          output: posts
        })
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
    cs.collection.insert(newEntry, function(err, docs) {
      // save is complete, redirect to front page
      res.redirect('/');
    });
  },
  
  logSave: function(contents) {
    var timestamp = new Date().getTime();
    timestamp = Number(timestamp);
    var ip = contents.headers['x-forwarded-for'] || contents.connection.remoteAddress;
    var newEntry = {
      "ip": ip,
      "path": contents.url,
      "referer": contents.headers.referer,
      "time": timestamp.toString()
    };
    cs.loggery.insert(newEntry);
  },

  fetch: function(mode, queryString, theCallback) {
    var pageContent = [];

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

    cs.step(
      function getPageInfo() {
        var callback = this.parallel();
        var callback2 = this.parallel();
        // collect page contents such as headers and contents, by params
        cs.collection.find(params, limitAndSkipAndSort).toArray(function(err, docs) {
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
        cs.collection.find({ tags: {$exists: true}}, { tags: 1, _id: 0 } , {limit:20}).toArray(function(err, docs) {
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
  },
  
  cleanup: function(text) {
	text = text.replace("<", "&lt;");
	text = text.replace(">", "&gt;");
    	//text = text.replace("<script", "&lt;script")
	text = text.replace(/(\r\n|\n|\r)/gm,"<br>");
	var imageRegex = /\.(png|jpg|jpeg|gif)$/;
	text= text.replace(/(\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|])/gim,
    	function(str) {
        	if (str.match(imageRegex)) {
            		return('<img src="' + str + '">');
        	} else {
			return('<b>[</b><a href="' + str + '" class="autolink" target="_blank">' + str.replace('http://','') + '</a><b>]</b>');
        	}
    });

    //var exp = /(\b(http(s?):\/\/)(www\.)?)([\w\.-]+)([\.{2,4}\/?])([\S]*)/ig;
    //text = text.replace("<", "&lt;");
    //text = text.replace(">", "&gt;");
    //text = text.replace("<script", "&lt;script")
    //text = text.replace(/(\r\n|\n|\r)/gm,"<br>");
    return text;
	//.replace(exp,"<b>[</b><a href='http$3://$4$5$6$7'>$5</a><b>]</b>");
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
