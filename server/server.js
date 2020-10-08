// TODO: Write server
// Might need to install node js
// Install express, socket.io through npm

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
	console.log("connection opened");

	socket.on('getchunk', (dataStr) => {
		var data = JSON.parse(dataStr);
		console.log("getchunk: " + dataStr);

		//var tempTiles = new Array(16*16).fill({id:0,layer:0,isTransition:false})

		//socket.emit('getchunk', JSON.stringify({'x':data.x,'y':data.y,'level':data.level,'tiles':tempTiles}));

		socket.emit('getchunk', JSON.stringify({'x':data.x,'y':data.y,'level':data.level,'tiles':level0.chunks[genChunkId(data.x, data.y)]}));
	});

	socket.on('getblocktypes', () => {
		socket.emit('getblocktypes', JSON.stringify(blockTypes));
	});

	socket.on('disconnect', () => {
		console.log("connection closed");
	});
});

//To run this, navigate to server folder in the command line. Enter "node server.js"
//Go to browser enter localhost:2000 as url 

server.listen(2000);      //Connect with port 2000
console.log("Server started.");     //Send a log to console to confirm connection
