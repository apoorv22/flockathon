var flock = require('flockos');
var config = require('./config.js');
var express = require('express');
var fs = require('fs');
var request = require('request');


var  stackexchange  =  require('stackexchange'); 
var  options  =   { 
    version:  2.2 
};
var  context  =  new  stackexchange(options); 

 
// Get all the questions (http://api.stackexchange.com/docs/questions) 
//TODO : Add comments
// 

flock.setAppId(config.appId);
flock.setAppSecret(config.appSecret);

var app = express();
var botToken = "500cd660-2032-4a4a-9514-a7c138093336";

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

function createList(results, key) {
    var list = [];
    for (var i = 0; i < results.items.length; i++) {
        list.push(results.items[i][key])
    }
    return list;
}
// save tokens on app.install
flock.events.on('app.install', function(event) {
    console.log("installing application");
    tokens[event.userId] = event.token;
});


//receives user's slash command
flock.events.on('client.slashCommand', function(event) {
    var  filter  =   {
        pagesize: 1,        //getting th top answer based on relevance
        q: event.text,
        site: 'stackoverflow',
        key: 'RAJDTo7jE4C8wZIkRrsetQ((',
        sort:   'relevance',
        order:   'desc',
        filter: '!9YdnSIN18'
    };
    context.search.advanced(filter,  function(err,  results) {
        var question_ids = createList(results, "question_id");  
        if  (err)  throw  err;

          
        var  filter2  =   {
            pagesize: 3,        //getting top 3 answers
            site: 'stackoverflow',
            key: 'RAJDTo7jE4C8wZIkRrsetQ((',
            sort:   'votes',
            order:   'desc',
        };

        context.questions.answers(filter2, function(err,  answersIds) {  
            if  (err)  throw  err;
            var ans_ids = createList(answersIds, "answer_id");
            var  filter3  =   {
                pagesize: 3,    //getting top 3 answers
                site: 'stackoverflow',
                key: 'RAJDTo7jE4C8wZIkRrsetQ((',
                sort:   'votes',
                order:   'desc',
                filter: '!b0OfNenVW9PiUa'
            };

            context.answers.answers(filter3, function(err, ans) {
                if  (err)  throw  err;
                var codifiedQuestion = "<i>" + results.items[0].body.replace(/<pre>/g, "<pre><i>")
                codifiedQuestion = codifiedQuestion.replace(/<\/pre>/g, "</i></pre>").concat("</i>".concat("\n<u><strong>Top rated answer :(" + ans.items[0].score + " votes)</strong></u>\n"));
                var codifiedAnswer = ans.items[0].body.replace(/<pre>/g, "<pre><i>");   //parsing to stylize code part in response
                codifiedAnswer = codifiedAnswer.replace(/<\/pre>/g, "</i></pre>");
                var replacedQuery = event.text.replace(/ /g, "-");

                //adding other answers link in response
                if (ans_ids.length > 1) {
                    codifiedAnswer = codifiedAnswer.concat("<p><strong>Other answers : </strong></p>\n");
                }
                if (ans_ids[1]) {
                    var link1 = "http://stackoverflow.com/questions/" + question_ids[0] + "/" + replacedQuery + "/" + ans_ids[1] + "#" + ans_ids[1];
                    codifiedAnswer = codifiedAnswer.concat("<p><a href='" + link1 + "'>" + link1 + "</a>(" + ans.items[1].score + " votes)</p>\n");
                }
                if (ans_ids[2]) {
                    var link2 = "http://stackoverflow.com/questions/" + question_ids[0] + "/" + replacedQuery + "/" + ans_ids[2] + "#" + ans_ids[2];
                    codifiedAnswer = codifiedAnswer.concat("<p><a href='" + link2 + "'>" + link2 + "</a>(" + ans.items[2].score + " votes)</p>\n");
                }
                var finalResult = codifiedQuestion.concat(codifiedAnswer);
                console.log(finalResult);
                var json = {
                    "to": event.userId,
                    "text": "Most relevant question for your query:\n" + ans.items[0].title,
                    "token": botToken,
                    "attachments": [{
                        "title": "Most relevant question:\n" + ans.items[0].title,
                        "description": "(Answers powered by StackOverflow)",
                        "views": {"flockml": finalResult}
                    }]
                };
                flock.callMethod('chat.sendMessage', botToken, json);
            }, ans_ids);
        }, question_ids);
    });
});

// delete tokens on app.uninstall
flock.events.on('app.uninstall', function(event) {
    delete tokens[event.userId];
});

// Start the listener after reading the port from config
var port = config.port || 8080;
app.listen(port, function() {
    console.log('Listening on port: ' + port);
});

// exit handling -- save tokens in token.js before leaving
process.on('SIGINT', process.exit);
process.on('SIGTERM', process.exit);
process.on('exit', function() {
    fs.writeFileSync('./tokens.json', JSON.stringify(tokens));
});