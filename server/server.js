// TODO: Write server
// Might need to install node js
// Install express, socket.io, colors through npm

var colors = require('colors');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');
var fs = require('fs');
var io = require('socket.io')(server);

// Use eval to import files from common
var GameLevel = eval('(' + fs.readFileSync('../common/level.js') + ')');
eval(fs.readFileSync('../common/util.js') + '');
eval(fs.readFileSync('../common/gameobjects.js') + ''); // Probably broken

var tilesFolder = "client/assets/images/tiles/";
var blockTypes = {
	0: {'src':tilesFolder+"dev_grey.png"},
	1: {'src':tilesFolder+"dev_orange.png"}
}

// Create level for testing
var level0 = new GameLevel(0);

// Add an empty chunk to the level
level0.addChunk(genChunkId(0, 0), new Array(16*16).fill({id:0,layer:0,isTransition:false}));
level0.addChunk(genChunkId(1, 0), new Array(16*16).fill({id:1,layer:0,isTransition:false}));
level0.update();

app.get('/',function(req, res) {
    res.sendFile(path.join(__dirname, '../client/WebDevGame.html'));
});
app.use('/client',express.static(path.join(__dirname, '/../client')));
app.use('/common',express.static(path.join(__dirname, '/../common')));

// Stuff for handling socket connections
io.on('connection', (socket) => {
	printLog("connection opened");

	socket.on('getchunk', (dataStr) => {
		var data = JSON.parse(dataStr);

		//var tempTiles = new Array(16*16).fill({id:0,layer:0,isTransition:false})

		//socket.emit('getchunk', JSON.stringify({'x':data.x,'y':data.y,'level':data.level,'tiles':tempTiles}));

		var tiles = level0.chunks[genChunkId(data.x, data.y)];

		if (tiles != undefined) {
			socket.emit('getchunk', JSON.stringify({'x':data.x,'y':data.y,'level':data.level,'tiles':tiles}));
			printLog("getchunk: " + dataStr);
		} else {
			printLog("getchunk: " + dataStr + ` chunk ${data.x},${data.y} is undefined`, "warning");
		}
	});

	socket.on('getblocktypes', () => {
		socket.emit('getblocktypes', JSON.stringify(blockTypes));
		printLog("getblocktypes");
	});

	socket.on('disconnect', () => {
		printLog("connection closed");
	});
});

//To run this, navigate to server folder in the command line. Enter "node server.js"
//Go to browser enter localhost:2000 as url 

server.listen(2000);              //Connect with port 2000y
printLog("Server started".green); //Send a log to console to confirm connection

// Write to the console in a standard format with different levels (valid levels: warning, error, info (default))
function printLog(text, level) {
	var getTimeString = () => {
		var makeLength = (input, l) => {
			var inputStr = input.toString();
			while (inputStr.length < l)
				inputStr = '0' + inputStr;
			return inputStr;
		};

		var date = new Date();

		var yyyy = date.getFullYear();
		var mm = makeLength(date.getMonth(), 2);
		var dd = makeLength(date.getDate(), 2);

		var hours = makeLength(date.getHours(), 2);
		var mins = makeLength(date.getMinutes(), 2);
		var secs = makeLength(date.getSeconds(), 2);
		var millis = makeLength(Math.round(date.getMilliseconds()/10), 2);

		return `${yyyy}-${mm}-${dd} ${hours}:${mins}:${secs}.${millis}`;
	};

	//var out = (new Date().toISOString()).magenta + " [".grey;
	//var out = ((new Date(new Date() + new Date().getTimezoneOffset())).toISOString()).magenta + " [".grey;
	var out = getTimeString().magenta + " [".grey;
	switch(level) {
		case "error":
			out += "ERROR".red + "] ".gray + text.red;
			break;
		case "warning":
			out += "WARN".yellow + "] ".gray + text.yellow;
			break;
		case "info":
		default:
			out += "INFO".white + "] ".gray + text.white;
			break;
	}
	console.log(out);
}
