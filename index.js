var flock = require('flockos');
var config = require('./config.js');
// var widget = require('./flock.js');
var express = require('express');
var fs = require('fs');
var request = require('request');


var stackexchange = require('stackexchange');
 
var options = { version: 2.2 };
var context = new stackexchange(options);
 

 
// Get all the questions (http://api.stackexchange.com/docs/questions) 
//TODO : Add comments
// 

flock.setAppId(config.appId);
flock.setAppSecret(config.appSecret);

var app = express();

// Listen for events on /events, and verify event tokens using the token verifier.
app.use(flock.events.tokenVerifier);
app.post('/events', flock.events.listener);

// Read tokens from a local file, if possible.
var tokens;
try {
    tokens = require('./tokens.json');
} catch (e) {
    tokens = {};
}

function createList(results,key)  {
	var list = [];
	for(var i=0;i<results.items.length;i++){
		 list.push(results.items[i][key]) 
	}
	return list;
}
// save tokens on app.install
flock.events.on('app.install', function (event) {
    tokens[event.userId] = event.token;
});

//splits
flock.events.on('client.slashCommand', function (event) {
	    var filter = {
	  pagesize:1,
	  q:event.text,
	  site:'stackoverflow',
	  key:'RAJDTo7jE4C8wZIkRrsetQ((',
	  sort: 'relevance',
	  order: 'desc'
	};
	context.search.advanced(filter, function(err, results){
		var ids = createList(results,"question_id");
		  if (err) throw err;

		  var filter2 = {
		  pagesize:3,
		  site:'stackoverflow',
		  key:'RAJDTo7jE4C8wZIkRrsetQ((',
		  sort: 'votes',
		  order: 'desc',
		};

		context.questions.answers(filter2,function(err, answersIds){
		  if (err) throw err;
		var ans_ids = createList(answersIds,"answer_id");
		  var filter3 = {
		  pagesize:3,
		  site:'stackoverflow',
		  key:'RAJDTo7jE4C8wZIkRrsetQ((',
		  sort: 'votes',
		  order: 'desc',
		  filter:'!b0OfNenVW9PiUa'
		};

		context.answers.answers(filter3,function(err,ans){
			 if (err) throw err;
			var codifiedAnswer = ans.items[0].body.replace(/<pre>/g,"<pre><i>");
			codifiedAnswer = codifiedAnswer.replace(/<\/pre>/g,"</i></pre>");
			var replacedString = event.text.replace(/ /g , "-");
			var link1 = "http://stackoverflow.com/questions/" + ids[0] + "/" +  replacedString + "/" + ans_ids[1] + "#" + ans_ids[1]
			var link2 = "http://stackoverflow.com/questions/" + ids[0] + "/" +  replacedString + "/" + ans_ids[2] + "#" + ans_ids[2]
			 var json = {"to":event.chat,"text":ans.items[0].title,"token":tokens[event.userId],
			 "attachments":[
						{
					    "title": ans.items[0].title,
					    "description": "(Answer powered by StackExchange)",
					    "views": {"flockml": codifiedAnswer}
						}
					]
				};
		    flock.callMethod('chat.sendMessage',tokens[event.userId],json);
		},ans_ids);

	},ids);

});
    
    

});

// delete tokens on app.uninstall
flock.events.on('app.uninstall', function (event) {
    delete tokens[event.userId];
});

// Start the listener after reading the port from config
var port = config.port || 8080;
app.listen(port, function () {
    console.log('Listening on port: ' + port);
});

// exit handling -- save tokens in token.js before leaving
process.on('SIGINT', process.exit);
process.on('SIGTERM', process.exit);
process.on('exit', function () {
    fs.writeFileSync('./tokens.json', JSON.stringify(tokens));
});
