// TODO: Write server
// Might need to install node js
// Install express, socket.io, colors through npm

const colors = require('colors');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const path = require('path');
const fs = require('fs');
const io = require('socket.io')(server);
const sqlite3 = require('sqlite3').verbose();
const dbfilePath = './users.db';


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

// Store all the logged in users to use for security
var loggedInUsers = {};

// Store all currently used guest IDs
var guests = {};

app.get('/',function(req, res) {
    res.sendFile(path.join(__dirname, '../client/WebDevGame.html'));
});
app.use('/client',express.static(path.join(__dirname, '/../client')));
app.use('/common',express.static(path.join(__dirname, '/../common')));

// Stuff for handling socket connections
io.on('connection', (socket) => {
	printLog(`Connection opened (id: ${socket.id})`);

	socket.on('getchunk', (dataStr) => {
		var data = JSON.parse(dataStr);

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
	
	socket.on('addUser', (data) => {			//Listens for addUser requests
		var returnPack = {			//Create a package to return the users id and a message
			userId : "",
			message : "",
			success: false
		};
		addUser(data.user, data.pass, returnPack);		//Call the addUser method
		setTimeout(() => {socket.emit('addUser', returnPack); printLog("User Created Id: "+returnPack.userId);}, 50);		//Give addUser time to complete, emit 'addUser' pack with the returnPack as the data
	});
	
	socket.on('login', (data) => {				//Listens for login requests
		var returnPack = {			//Create a package to return the users id and a message
			userId : "",
			message : "",
			success: false
		};
		login(data.user, data.pass, returnPack);
		setTimeout(() => {
			socket.emit('login', returnPack);
			loggedInUsers[socket.id] = data.user;
			socket.broadcast.emit('chatmessage', {user:"Server", message:`Player logged in: ${data.user}`});
			printLog("login Id: "+returnPack.userId+", "+returnPack.success);
		}, 50);
	});
	
	socket.on('guest', () => {				//Listens for guest login requests
		var returnPack = {			//Create a package to return the users id and a message
			userId : "",
			message : "",
			success : false
		};
		guest(returnPack, socket);
		setTimeout(() => {
			socket.emit('guest', returnPack);
			loggedInUsers[socket.id] = genGuestName(returnPack.userId);
			printLog("guest Id: "+returnPack.userId);
		}, 50);	
	});


	socket.on('chatmessage', (data) => {
		if (loggedInUsers[socket.id] == undefined) {
			socket.emit('chatmessagefail', "Failed to send message: Invalid session ID");
			printLog(`chatmessage: from non logged in user: <${data.user}> ${data.message}`, "warning");
			return;
		}
		printLog(`chatmessage: <${data.user}> ${data.message}`);
		socket.broadcast.emit('chatmessage', data);
	});

	socket.on('disconnect', () => {
		console.info(loggedInUsers, guests);
		if (socket.isGuest)
			delete guests[socket.guestId];
		if (loggedInUsers[socket.id] != undefined) {
			printLog(`Logged out user ${loggedInUsers[socket.id]}`);
		}
		delete loggedInUsers[socket.id];

		console.info(loggedInUsers, guests);

		printLog(`Connection closed (id: ${socket.id})`);
	});
});

//To run this, navigate to server folder in the command line. Enter "node server.js"
//Go to browser enter localhost:2000 as url 

server.listen(2000);              //Connect with port 2000y
printLog("Server started".green); //Send a log to console to confirm connection

//game loop for server
const FPS = 60;
var gameObjectsList = {};

function urGameObjects() {
	for (let i in gameObjectsList) {
		var tempObject = gameObjectsList[i];
		tempObject.update();
		tempObject.render();
	}
}

setInterval(urGameObjects, 1000/FPS);

//Create db to store player info

var dbExists = fs.existsSync(dbfilePath);

if (!dbExists) {
	fs.openSync(dbfilePath, 'w');
}

var db = new sqlite3.Database(dbfilePath, function(err) {
	if(err) {
		return printLog(err);
	}
	printLog('Connected to DB');
});

//Initialize user database if not created already
createDatabase();

function createDatabase() {
	db.run('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT UNIQUE, pass TEXT, wins INTEGER, kills INTEGER, totalPoints INTEGER);', function(err){
		if (err)
			return printLog(err.message);
		printLog('Table created');
	});
}

function addUser(user, pass, returnPack) {		//Might want to return user id on success
	var found = findMatch(user);		//Store true or undefined in the found variable for whether there is a match with the given username and an account already stored in the db
	setTimeout(() => {addToDb(user, pass, returnPack, found)}, 10);		//Give the findMatch some time to complete, call the addToDb method to manipulate the returnPack based on conditions
	function addToDb(user, pass, returnPack, found) {
		if (!(found)) {			//If there isnt a match for the entered username in the database
			db.run('INSERT INTO users(user, pass) VALUES(?, ?)', [user, pass], (err) => {		// add username and password to the database
				if (err) {		//Error handling
					printLog(err.message, returnPack);
					returnPack.message = "Sorry, there was an error in creating your account, please try again.";
					returnPack.userId = "";
				} else {
					printLog("Added " + user + " to database");	
					returnPack.message = "Welcome, " + user + " your account has been created.";
					returnPack.userId = db.run('SELECT id FROM users WHERE user = ?', (user));		//Modify the returnPack to tell user the account has been created
					returnPack.success = true;
				}
			});
		} else {
			printLog("found match", "warning")		//If there is already an account in the db with the given username
			returnPack.message = "Account name " + user + " is already taken, please choose another.";	//Modify the returnPack to tell the user so
			returnPack.userId = "";
		}
	}
	
	function findMatch(user) {
		db.each('SELECT user FROM users',(err, row) => {		// Loops through each entry in the table, looking for an account that already has the entered name
			if (err)
				printLog(err.message);
			if (row.user == user)		// If one is found, set found to true
				found = true;
		});
	}
}

function login(user, pass, returnPack) {
	returnPack.message = "The details you have entered were incorrect, please try again.";
	returnPack.userId = "null";

	db.each('SELECT id, user FROM users WHERE user=? AND pass=?', [user, pass], (err, row) => {
		if (err) {
			printLog(err.message);
			return;
		} else {
			for (var u in loggedInUsers) {
				if (row.user == loggedInUsers[u]) {
					returnPack.message = "That account is already logged in";
					return;
				}
			}

			returnPack.message = "Welcome, " + row.user + ".";
			returnPack.userId = row.id;
			returnPack.success = true;
		}
	});
	
}

// TODO When guest disconnects, remove record from db
function guest(returnPack, socket) {
	//Creates a random id in the range 1000-10000
	var createId = () => {return Math.floor(Math.random() * (10000 - 1000) + 1000)};
	var rand = createId();
	while (guests[rand] != undefined)
		rand = createId();

	db.run('INSERT INTO users(id) VALUES(?)', [rand], function(err) {
		if (err)
			printLog(err.message, "error");
		returnPack.message = "Welcome, " + genGuestName(rand);
		returnPack.userId = rand;
		returnPack.success = true;

		guests[rand] = {sid:socket.id};

		socket.isGuest = true;
		socket.guestId = rand;
	});
}

function isLoggedIn() {

}


// Write to the console in a standard format with different levels (valid levels: warning, error, info (default))
function printLog(text, level) {
	var getTimeString = () => {
		var makeLength = (input, l) => {
			var inputStr = input.toString();
			while (inputStr.length < l)
				inputStr = '0' + inputStr;
			while (inputStr.length > l)
				inputStr = Math.round(parseInt(inputStr)/10).toString();
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
			out += "!ERR".red + "] ".gray + text.red;
			break;
		case "warning":
			out += "WARN".yellow + "] ".gray + text.yellow;
			break;
		case "info":
		default:
			out += "INFO".white + "] ".gray + text;
			break;
	}
	console.log(out);
}

// Only put other util stuff here
