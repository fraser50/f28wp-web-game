// TODO: Write server
// Might need to install node js
// Install express, socket.io, colors through npm

const colors = require('colors');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const path = require('path');
const fs = require('fs');
const io = require('socket.io')(server, {pingInterval: 1000});
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const dbfilePath = './users.db';

// Constants for shared files to know if they are running on the client or the server
const SERVER = true;
const CLIENT = !SERVER;

const BCRYPT_ROUNDS = 10; // Changing this will INVALIDATE everyone's passwords


// Use eval to import files from common
//var GameLevel = eval('(' + fs.readFileSync('../common/level.js') + ')');
//eval(fs.readFileSync('../common/util.js') + '');


//eval(fs.readFileSync('../common/gameobjects.js') + ''); // Probably broken

var util = require('../common/util.js');
var gameobjects = require('../common/gameobjects.js');
var level = require('./server_level.js');

// Import the block types from JSON file
var blockTypes = JSON.parse(util.removeCommentsFromJSON(fs.readFileSync("blocktypes.json")));

// Remove all unnecessary data from blockTypes (only keeping src)
for (var t in blockTypes) {
	for (var p in blockTypes[t]) {
		if (p != "src") {
			delete blockTypes[t][p];
		}
	}
}

// Store all levels in here
var levels = {};

// Create level for testing
levels[0] = new level.GameLevel(0);

// Load a test world
levels[0].loadFromFile("testworld.json");
levels[0].update();

// Store all the logged in users to use for security
var loggedInUsers = {};

// Store all currently used guest IDs
var guests = {};

var clientlist = [];
var sockettoclient = {};

app.get('/',function(req, res) {
    res.sendFile(path.join(__dirname, '../client/WebDevGame.html'));
});
app.use('/client',express.static(path.join(__dirname, '/../client')));
app.use('/common',express.static(path.join(__dirname, '/../common')));

class Client { // This class along with the password/username validation code (located in util.js) should be put in a server-specific util class
	constructor(sock, loggedin) {
		this.socket = sock;
		this.name = null;
		this.id = null; // The user is a guest if id is null and this.loggedin is true
		this.loggedin = false; // When a client first connects to the server, it isn't logged in
		this.controlledobject = null;

	}

	get guest() {
		return (this.id == null && this.loggedin);
	}

	login(name, id) {
		this.name = name;
		this.id = null;
	}

	// This utility function will sign the client out
	signout() {
		this.name = null;
		this.id = null;
		this.loggedin = false;
		
	}
}

// Stuff for handling socket connections
io.on('connection', (socket) => {
	printLog(`Connection opened (id: ${socket.id})`);

	var c = new Client(socket, false);
	clientlist.push(c);
	socket.cli = c;
	//socket.cli = c;

	socket.on('getleveldata', (data) => {
		// var data = JSON.parse(dataStr);
		var ret = null;

		if (levels[data.id])
			ret = {
				"id": data.id,
				"spawnpos": levels[data.id].spawnpos
			}

		socket.emit('getleveldata', ret);
		printLog("getleveldata");
	});

	socket.on('getchunk', (dataStr) => {
		var data = JSON.parse(dataStr);

		if (!levels[data.level]) {
			socket.emit('getchunkundef', {'id':util.util.genChunkId(data.x, data.y), 'level':data.level});
			printLog(("getchunk: " + dataStr + ` chunk ${data.x},${data.y} is undefined`).yellow, "debug");
			return;
		}

		var tiles = levels[data.level].chunks[util.genChunkId(data.x, data.y)];

		if (tiles != undefined) {
			socket.emit('getchunk', JSON.stringify({'x':data.x,'y':data.y,'level':data.level,'tiles':tiles}));
			printLog("getchunk: " + dataStr);
		} else {
			socket.emit('getchunkundef', {'id':util.genChunkId(data.x, data.y), 'level':data.level});
			printLog(("getchunk: " + dataStr + ` chunk ${data.x},${data.y} is undefined`).yellow, "debug");
		}
	});

	socket.on('getblocktypes', () => {
		socket.emit('getblocktypes', JSON.stringify(blockTypes));
		printLog("getblocktypes");
	});
	
	socket.on('addUser', (data) => {			//Listens for addUser requests
		var returnPack = {			//Create a package to return the users id and a message
			userId : "",
			username : "",
			message : "",
			success: false
		};
		addUser(data, returnPack, socket.cli);		//Call the addUser method
	});
	
	socket.on('login', (data) => {				//Listens for login requests
		var returnPack = {			//Create a package to return the users id and a message
			userId : "",
			username : "",
			message : "",
			success: false
		};
		login(data, returnPack, socket.cli);
	});
	
	socket.on('guest', () => {				//Listens for guest login requests
		var returnPack = {			//Create a package to return the users id and a message
			userId : "",
			message : "",
			success : false,
			isGuest : "true"
		};
		guest(returnPack, socket.cli);
	});
	
	socket.on('sign out', () => {
		signOut(socket.cli);
	})
	
	socket.on('getStats', (stats) => {
		//getUserStats(stats, socket.cli);
	});

	socket.on('chatmessage', (data) => {
		var c = socket.cli;
		if (!c.loggedin) {
			socket.emit('chatmessagefail', "Failed to send message: Invalid session ID");
			printLog(`chatmessage: from non logged in user: <${c.name}> ${data.message}`, "warning");
			return;
		}
		printLog(`chatmessage: <${c.name}> ${data.message}`);
		c.socket.broadcast.emit('chatmessage', data);
	});

	/*socket.on('playerstate', (data) => {
		var c = socket.cli;

		if (c.loggedin) {
			c.pos = data.pos;
			c.rot = data.rot;

		}
	});*/

	socket.on('assignTeam', (data) => {	//This takes in a player and assigns them to a team
		var level = levels[data.level];		//Takes in level id as sending full level is unnecessarily large 
		var player = JSON.parse(data.player);	//Transform player back into JSON
		if (level.gameobjects.length < 7) {		//Checks if  level is full
			if (level.blue.length <= level.red.length) {	//Check which team has the least players and assigns client to that team
				level.blue.push(player);	//Adds client to the team (might want to change this to just id)
				player.team = 'blue';	//Updates team value of client
			} else {
				level.red.push(player);
				player.team = 'red';
			}	
		} else {
			console.log(level.gameobjects)
			console.log('level ' + level.id + " is full");	//Temp error message for when room is full, this should be changed once we have rooms working properly
		}
		
//		for (var i in level.gameobjects) {
//			console.log(level.gameobjects[i].id + "  -  " + level.gameobjects[i].team)	//This doesn't work for the current obj, displays all ones before it though. Shouldn't matter too much
//		}
		
		printLog(player.id + ' joined ' + player.team);
		
		socket.emit('assignedTeam', {"team" : player.team});	//Return the newly assigned player team so the local client can assign it to its player instance
	})
		
	socket.on('playerposupdate', (data) => {
		var c = socket.cli;
		if (c.loggedin && c.controlledobject != null) {
			var obj = c.controlledobject;
			obj.id = data.id
;			obj.pos.x = data.x;
			obj.pos.y = data.y;
			obj.rotation = data.rotation;
			obj.isGuest = data.isGuest;
			obj.team = data.team;
		}
	});

	socket.on('disconnect', () => {
		var c = socket.cli;
		c.present = false;
		
		for (k in clientlist) {
			rClient = clientlist[k];
			if (rClient.name == c.name && rClient.name) {
				c.present = true;
			}
			rClient.socket.emit('removeplayer', {'id' : c.name});
		}
		
		if (c.controlledobject != undefined && c.present == true) {	//This checks that the user is not refreshing from the login screen, it also accounts for instances where the user might have logged out then closed the window
			if (c.controlledobject.team == 'blue') {			//Need to get levels sorted so there is not only one, this doesn't allow for scalability atm
				levels[0].blue.pop(c.controlledobject.name);
				printLog('removed ' + c.name + ' from team 1')
				printLog(levels[0].blue)
			} else if (c.controlledobject.team == 'red' && c.present == true){
				levels[0].red.pop(c.controlledobject.name);
				printLog('removed ' + c.name + ' from team 2')
				printLog(levels[0].red)
			}	
		}

		delete socket.cli;
		clientlist.splice(clientlist.indexOf(c), 1);

		socket.disconnect(0); // Close the socket

		printLog(`Connection closed (id: ${socket.id})`);
	});
});

//To run this, navigate to server folder in the command line. Enter "node server.js"
//Go to browser enter localhost:2000 as url 

server.listen(2000);              //Connect with port 2000y
printLog("Server started".green); //Send a log to console to confirm connection

//game loop for server
const FPS = 60;

function loop() {
	for (var i in levels)
		levels[i].update();

		for (j in levels[i].gameobjects) {
			var obj = levels[i].gameobjects[j];
			//printLog(obj.id);
			if (obj.pos.changed) {
				obj.pos.changed = false;
				//console.log('pos change!');
	
				for (k in clientlist) {
					var c = clientlist[k];
					if (!c.loggedin) continue;
					//console.log(c.controlledobject.id + ' | ' + obj.id + ' -> ' + c.controlledobject);
					if (c.controlledobject.id != obj.id) {
						//console.log('sending pos update message!');
						c.socket.emit('posupdate', {'id' : obj.id, 'x' : obj.pos.x, 'y' : obj.pos.y, 'rot' : obj.rotation, 'isGuest' : obj.isGuest, 'team' : obj.team});
					}
				}
			}
		}

	//var playerStates = getPlayerStates();

	//printLog(JSON.stringify(playerStates), "debug");

	//for (var cindex in clientlist) {
	//	clientlist[cindex].socket.emit('playerstate', playerStates);
	//}

}

setInterval(loop, 1000/FPS);

function getPlayerStates() {
	var out = {};
	for (var sId in clientlist) {
		if (!clientlist[sId].pos) continue;
		out[sId] = {};
		out[sId].pos = clientlist[sId].pos;
		out[sId].rot = clientlist[sId].rot;
	}

	return out;
}

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
	db.run('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT UNIQUE, passhash TEXT, wins INTEGER, kills INTEGER, totalPoints INTEGER);', function(err){
		if (err)
			return printLog(err.message);
		printLog('Table created');
	});
}

function addUser(data, returnPack, client) {
	if (!util.isValidUsername(data.user)) {
		returnPack.message = "Invalid username";
		client.socket.emit('addUser', returnPack);
		return;
	}
	if (!util.isValidPassword(data.pass)) {
		returnPack.message = "Invalid password";
		client.socket.emit('addUser', returnPack);
		return;
	}
	db.all('SELECT user FROM users WHERE user=?', [data.user], (err, rows) => {		// Loops through each entry in the table, looking for an account that already has the entered name
		if (err)
			printLog(err.message);

		var found = false;
		rows.forEach((row) => {
			if (row.user == data.user) found = true; // If one is found, set found to true
		});

		// Where function addToDb started
		if (!(found)) {		//If there isnt a match for the entered username in the database
			var hashedPassword = bcrypt.hashSync(data.pass, BCRYPT_ROUNDS);

		db.run('INSERT INTO users(user, passhash) VALUES(?, ?)', [data.user, hashedPassword], (err) => {		// add username and password to the database
			if (err) {		//Error handling
				printLog(err.message, returnPack);
				returnPack.message = "Sorry, there was an error in creating your account, please try again.";
				returnPack.userId = "";			//This and username might not be necessary
				returnPack.username = "";
				client.socket.emit('addUser', returnPack);
			} else {
				printLog("Added " + data.user + " to database");	
				returnPack.message = "Welcome, " + data.user + " your account has been created.";
				returnPack.userId = db.all('SELECT id, user FROM users WHERE user = ?', (data.user), (err, rows) => {
					if (err)
						printLog(err.message, "error");
					else {
						returnPack.userId = rows[0].id;
						returnPack.username = rows[0].user;
						returnPack.success = true;

						client.id = rows[0].id;
						client.name = rows[0].user;
						client.loggedin = true;
						
						initUser(client, levels[0]);

						client.socket.emit('addUser', returnPack);
						printLog("User Created Id: "+returnPack.userId);
					}
				});
			}
		});
		} else {
			printLog("found match", "warning")		//If there is already an account in the db with the given username
			returnPack.message = "Account name " + data.user + " is already taken, please choose another.";	//Modify the returnPack to tell the user so
			returnPack.userId = "";			//This and username might not be necessary
			returnPack.username = "";

			client.socket.emit('addUser', returnPack);
		}
	});
}

function login(data, returnPack, client) {
	returnPack.message = "The details you have entered were incorrect, please try again.";
	returnPack.userId = "null";
	returnPack.username = "null";

	db.all('SELECT id, user, passhash FROM users WHERE user=?', [data.user], (err, rows) => {
		if (err) {
			printLog(err.message);
			return;
		}

		var done = false;
		rows.forEach((row) => {

			var provided_password = data.pass;
			if (!bcrypt.compareSync(provided_password, row.passhash)) {
				return; // If the password is incorrect, return
			}


			for (var u in clientlist) {
				if (row.user == clientlist[u].name) {
					returnPack.message = "That account is already logged in";
					return;
				}
			}

			returnPack.message = "Welcome, " + row.user + ".";
			returnPack.userId = row.id;
			returnPack.username = row.user;
			returnPack.success = true;

			client.socket.emit('login', returnPack);

			client.id = row.id;
			client.name = row.user;
			client.loggedin = true;

			initUser(client, levels[0]);

			client.socket.broadcast.emit('chatmessage', {user:"Server", message:`Player logged in: ${data.user}`});
			printLog("login Id: "+returnPack.userId+", "+returnPack.success);

			done = true;
			return;
		});

		if (!done)
			client.socket.emit('login', returnPack);
	});
	
}

function initUser(client, level) {
	var p = new gameobjects.Player(new util.Position(0, 0), 0, level, new util.Vector(0, 0));
	level.addObject(p);
	client.controlledobject = p;
}

// TODO When guest disconnects, remove record from db
function guest(returnPack, client) {
	//Creates a random id in the range 1000-10000
	/*var createId = () => {return Math.floor(Math.random() * (10000 - 1000) + 1000)};
	var rand = createId();
	while (guests[rand] != undefined)
<<<<<<< HEAD
		rand = createId();*/

	initUser(client, levels[0]);

	returnPack.userId = client.controlledobject.id;
	returnPack.message = "Welcome, Guest " + returnPack.userId;
	returnPack.success = true;

	//guests[rand] = {sid:socket.id};

	client.loggedin = true;
	client.name = "guest_" + returnPack.userId; // Change to use random id again

	

	client.socket.emit('guest', returnPack);

	printLog("guest Id: "+returnPack.userId);
}

function isLoggedIn() {

}


// Queries db for this sockets users statistics
function getUserStats(stats, socket) {
	db.all('SELECT wins, kills, totalPoints FROM users WHERE user=?', [stats.user], (err, rows) => {
		if (err) {
			printLog(err.message);
			return;
		}
		var done = false;
		rows.forEach((row) => {
			if (row.user = stats.user) {
				stats.wins = row.wins;
				stats.kills = row.kills;
				stats.totalPoints = row.totalPoints;
				socket.emit('getStats', stats);
				done = true;
				return;
			}
		});
		if (!done) {
			socket.emit('getStats', stats);
		}
	})
}

function signOut(client) {	//This removes client from their team, sends out emit package to tell all other clients that they have signed out and should remove the player from the screen
	printLog("sign out " + client.name);
	
	if (client.controlledobject.team == 'blue') {			//Need to get levels sorted so there is not only one, this doesn't allow for scalability atm
		levels[0].blue.pop(client.controlledobject.name);
		printLog('removed ' + client.name + ' from team 1')
	} else {
		levels[0].red.pop(client.controlledobject.name);
		printLog('removed ' + client.name + ' from team 2')
	}
	
	for (k in clientlist) {
		rClient = clientlist[k];
		rClient.socket.emit('removeplayer', {'id' : client.name});
	}
	client.signout();
}

var sec = 60;

setInterval(() => {
	sec--;

	for (k in clientlist) {
		rClient = clientlist[k];
		rClient.socket.emit('updateTimer', sec);
	}

	if(sec==50) { //Currently set to spawn at 50secs for testing
		printLog("Adding balls to level");
		addBallsToLevelFixed;
	}

	if (sec==0) {
		setTimeout(() => {sec = 60}, 5000);
		printLog("Timer Done");
	}
}, 1000);

/* Possible code for random ball spawns.
//creates random position in main room of level
//Could be improved in future by using width and height if different sized levels are going to be created.
function createRandomPosition() {
	randX = (Math.random() * (-13)) -1;
	randY = (Math.random() * (-13)) -1;
	return new Position(randX, randY);
}

//Add balls to level at random position.
//Uses createRandomPosition function.
function addBallsToLevelRandom() {
	let randpos1 = new Position()
	ball1 = new Point(createRandomPosition, 0, currentLevel);
	ball2 = new Point(createRandomPosition, 0, currentLevel);
	ball3 = new Point(createRandomPosition, 0, currentLevel);
	currentLevel.addObject(ball1);
	currentLevel.addObject(ball2);
	currentLevel.addObject(ball3);
}
*/

//Add balls to level at fixed position.
function addBallsToLevelFixed() {
	for(i = 0; i < level.gameobjects.length; i++) {
		if (level.gameobjects[i] instanceof BallSpawnPoint) {
			let spawnPosition = level.gameobjects[i].getPos;
			let b = new gameobjects.Point(spawnPosition, 0, level);
			level.addObject(b);
		}
	}
}
//Testcode: Add ball spawn points to level (Currently fails: "addObject is not defined")
//addObject(new gameobjects.BallSpawnPoint(new util.Position(-12, -12), level));

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
		case "debug":
			out += "DEBG".cyan + "] ".gray + text;
			break;
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
