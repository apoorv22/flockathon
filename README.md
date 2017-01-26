
## Running the code

Setup ngrok (if you do not have a public endpoint e.g. on your dev machine)

Create an app in the developer dashboard

Copy the app id and app secret from the developer dashboard, and put them in a file called config.js:

module.exports = {
    appId: '27ed9330-6710-4983-9380-9f0748ca6b41',
    appSecret: '0ef85922-849a-4397-9564-94247f95dd7c'
};

1.	install package stackexchange
	```npm install stackexchange```

2. Run the app using node index.js

3.  In the bot for the app,type command /ask followed by your query.

4.  Press enter and wait for your answer

5.  Additionally you can click on other answer links provided in the response to see other answers in browser
