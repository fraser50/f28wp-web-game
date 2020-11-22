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
var level = require('../common/level.js');
var objectparsers = require('../common/objectparsers.js');

// Import the block types from JSON file
var blockTypes = JSON.parse(util.removeCommentsFromJSON(fs.readFileSync("blocktypes.json")));

// Remove all unnecessary data from blockTypes
for (var t in blockTypes)
	for (var p in blockTypes[t])
		if (blockTypes.editorproperties.includes(p))
			delete blockTypes[t][p];
delete blockTypes.editorproperties;

// Store all levels in here
var levels = {};

// Create level for testing
levels[0] = new level.GameLevel(0);

// Load a test world
levels[0].loadFromFile("small_world_ball_spawn.json", fs);
levels[0].update();
var levelCount = 1;

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
		this.levelId = null; //This stores the id of client, should be given when client is assigned a team

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
			socket.emit('getchunkundef', {'id':util.genChunkId(data.x, data.y), 'level':data.level});
			// printLog(("getchunk: " + dataStr + ` chunk ${data.x},${data.y} is undefined`).yellow, "debug");
			return;
		}

		var tiles = levels[data.level].chunks[util.genChunkId(data.x, data.y)];

		if (tiles != undefined) {
			socket.emit('getchunk', JSON.stringify({'x':data.x,'y':data.y,'level':data.level,'tiles':tiles}));
			// printLog("getchunk: " + dataStr);
		} else {
			socket.emit('getchunkundef', {'id':util.genChunkId(data.x, data.y), 'level':data.level});
			// printLog(("getchunk: " + dataStr + ` chunk ${data.x},${data.y} is undefined`).yellow, "debug");
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
		//checkLevelStart(socket.cli.levelId);
	});
	
	socket.on('login', (data) => {				//Listens for login requests
		var returnPack = {			//Create a package to return the users id and a message
			userId : "",
			username : "",
			message : "",
			success: false
		};
		login(data, returnPack, socket.cli);
		//checkLevelStart(socket.cli.levelId);
	});
	
	socket.on('guest', () => {				//Listens for guest login requests
		var returnPack = {			//Create a package to return the users id and a message
			userId : "",
			message : "",
			success : false,
			isGuest : "true"
		};
		guest(returnPack, socket.cli);
		//checkLevelStart(socket.cli.levelId);
	});
	
	socket.on('sign out', () => {
		signOut(socket.cli);
	})
	
	socket.on('getStats', (stats) => {
		getUserStats(stats, socket.cli);
	});
	
	socket.on('joinMatch', (data) => {
		checkLevelStart(data.levelId);
		console.log(levels[data.levelId].playercount);
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
		//levels[c.levelId].addObject(new gameobjects.Point(new util.Position(13, -13), 0, levels[c.levelId])); // Testing
	});

	/*socket.on('playerstate', (data) => {
		var c = socket.cli;

		if (c.loggedin) {
			c.pos = data.pos;
			c.rot = data.rot;

		}
	});*/
	
	socket.on('getLevelId', () => {
		//console.log(levels.length)	//This doesn't seem to actually get the length of the levels array
		var level = levels[levelCount-1];
		console.log("playercount: " + level.playercount);
		console.log("levelCount: " + levelCount);
		if (level.playercount < 6) {
			var id = level.id
			c.levelId = id;
		} else {
			var id = levelCount
			levelCount++;
			console.log("levelCountRedux: " + levelCount);
			var tempLevelCount = levelCount-1;
			setNewLevel(tempLevelCount);
			c.levelId = id;
		}
		levels[id].clientlist.push(c);
		socket.emit('returnLevelId', {"id" : id});
	});
	
	function setNewLevel(levelId) {
		console.log("new level:  " + levelId)
		levels[levelId] = new level.GameLevel(levelId);
		
		levels[levelId].loadFromFile("small_world.json", fs);
		levels[levelId].update();
	};

	socket.on('assignTeam', (data) => {	//This takes in a player and assigns them to a team
		var level = levels[data.level];		//Takes in level id as sending full level is unnecessarily large 
		socket.cli.levelId = data.level;

		console.log("OBJECTS         " + level.gameobjects);
		
		sendObjects(level.gameobjects, [socket.cli.socket]);

		var player = JSON.parse(data.player);	//Transform player back into JSON

		if (level.playercount < 6) {		//Checks if  level is full
			if (level.blue.length <= level.red.length) {	//Check which team has the least players and assigns client to that team
				level.blue.push(player);	//Adds client to the team (might want to change this to just id)
				player.team = 'blue';	//Updates team value of client
				player.pos = level.bluespawnpos[level.bluespawn];	// Gives the client a spawn point
				level.bluespawn++;
			} else {
				level.red.push(player);
				player.team = 'red';
				player.pos = level.redspawnpos[level.redspawn]	// Gives the client a spawn point
				level.redspawn++;
			}	
			level.playercount++; // Increase the player count by 1.
		} else {
			console.log('level ' + level.id + " is full");	//Temp error message for when room is full, this should be changed once we have rooms working properly
		}
		
		printLog(player.id + ' joined ' + player.team);
		
		socket.emit('assignedTeam', {"team" : player.team, "pos" : player.pos});	//Return the newly assigned player team so the local client can assign it to its player instance
	});
	
	socket.on('playerChangeImg', (data) => {	// Listens for when a client changes their image and send emit with details to all other clients. Might need to adapt this for multiple levels as it sends it to ALL clients. Probably an emit change to fix this
		var level = levels[data.levelId];
		for (k in level.clientlist) {
			rClient = clientlist[k];
			rClient.socket.emit('playerChangeImg', {"playerId": data.playerId, "image" : data.image}); 
		}
		socket.emit()
	});
		
	socket.on('playerposupdate', (data) => {
		var c = socket.cli;
		if (!socket.cli) return;
		if (c.loggedin && c.controlledobject != null) {
			var obj = c.controlledobject;
			obj.id = data.id;
			obj.pos.x = data.x;
			obj.pos.y = data.y;
			obj.rotation = data.rotation;
			obj.isGuest = data.isGuest;
			obj.team = data.team;
			obj.holdingBallChanged = data.holdingBallChanged;
			obj.holdingBall = data.holdingBall;
		}
	});
	
	socket.on('playerScored', (data) => {
//		var level = levels[data.levelId];			// I think this doubled up the points
//		for (i in level.clientlist) {
//			if (level.clientlist[i].name == data.playerId){
//				level.clientlist[i].controlledobject.points++;
//			}
//		}
		playerScoring(data.playerId, data.playerTeam, data.levelId);
	});

	socket.on('disconnect', () => {
		var c = socket.cli;
		c.present = false;
		var level = levels[c.levelId];	// This makes sure the things done below are to this clients level
		
		if (level) {
			for (k in level.clientlist) {
				rClient = level.clientlist[k];
				if (rClient.name == c.name && rClient.name) {
					c.present = true;
				}
				rClient.socket.emit('removeplayer', {'id' : c.name});
			}
			
			if (c.controlledobject != undefined && c.present == true) {	//This checks that the user is not refreshing from the login screen, it also accounts for instances where the user might have logged out then closed the window
				if (c.controlledobject.team == 'blue') {
					level.blue.pop(c.controlledobject.name); // Remove player from team on disconnect
					level.bluespawn--;	// Decrement the counter for team spawns
					printLog('removed ' + c.name + ' from team 1')
				} else if (c.controlledobject.team == 'red' && c.present == true){
					level.red.pop(c.controlledobject.name);
					level.redspawn--;
					printLog('removed ' + c.name + ' from team 2')
				}
				level.playercount--; // Decrease the player count by 1
				printLog("There are now " + level.playercount + " players in the game.");
				//checkLevelPlayerCount(level.id);	//Something broken atm, will need to think more on implementation
			}
			if (c.controlledobject != null) {
				level.removeObject(c.controlledobject)
			}
			level.clientlist.splice(level.clientlist.indexOf(c), 1);		//This one is for the levels client list
		}
		
		delete socket.cli;
		clientlist.splice(clientlist.indexOf(c), 1);			// This one is for the overall client list

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

function sendObjects(objlist, clients) {
	for (j in objlist) {
		var obj = objlist[j];

		var jobj = objectparsers.objToJSON(obj);

		for (var p in clients) {
			var pl = clientlist[p];		// might need a level. in there but should be getting sent the level clientlist from the function below

			if (pl.controlledobject === obj || (obj instanceof gameobjects.Player)) {
				continue;
			}

			pl.socket.emit('newobject', jobj);
		}
	}
}

function loop() {
	for (var i in levels) {

		var lvl = levels[i];
				
		lvl.update();
		
		sendObjects(lvl.newobjects, lvl.clientlist);

		lvl.newobjects.splice(0, lvl.newobjects.length); // Clear lvl.newobjects

		for (j in lvl.gameobjects) { // TODO: Remove this soon, just for dealing with players, should be merged with posupdate
			var obj = lvl.gameobjects[j];

			if (!(obj instanceof gameobjects.Player)) {
				continue; // Ignore object that are not players, this code is only designed for dealing with players
			}

			if (obj.holdingBallChanged) { // Send message to player if their ball holding state has changed
				obj.holdingBallChanged = false;
				for (k in lvl.clientlist) {
					var cli = lvl.clientlist[k];

					if (cli.controlledobject == obj) {
						cli.socket.emit("ballstatechange", {'holding':obj.holdingBall}); // TODO: Probably don't need to send a JSON object
						break; // No two players will control the same object, so can break out when we find them
					}
				}
			}

			if (obj.pos.changed) {
				obj.pos.changed = false;
	
				for (k in lvl.clientlist) {
					var c = lvl.clientlist[k];
					if (!c.loggedin) continue;
					if (c.controlledobject.id != obj.id) {
						c.socket.emit('posupdate_old', {'id' : obj.id, 'x' : obj.pos.x, 'y' : obj.pos.y, 'rot' : obj.rotation, 'isGuest' : obj.isGuest, 'team' : obj.team});
					}
				}
			}
		}

		for (j in lvl.gameobjects) {
			var obj = lvl.gameobjects[j];
			if (obj.pos.changed) {
				obj.pos.changed = false;
	
				for (k in lvl.clientlist) {
					var c = lvl.clientlist[k];
					if (!c.loggedin) continue;
					if (c.controlledobject.id != obj.id) {
						c.socket.emit('posupdate', {'id' : obj.id, 'x' : obj.pos.x, 'y' : obj.pos.y, 'rot' : obj.rotation});
					}
				}
			}
		}

		for (j in lvl.removedobjects) {
			var obj = lvl.removedobjects[j];

			var index = lvl.gameobjects.indexOf(obj);
			if (index > -1) {
				lvl.gameobjects.splice(index);
			}

			for (k in lvl.clientlist) {
				var c = lvl.clientlist[k];
				if (!c.loggedin) continue;

				c.socket.emit('removeplayer', {'id' : obj.id});
			}
		}

		lvl.removedobjects.splice(0, lvl.removedobjects.length);
	}

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
	var level = levels[client.levelId];
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

		db.run('INSERT INTO users(user, passhash, wins, kills, totalPoints) VALUES(?, ?, ?, ?, ?)', [data.user, hashedPassword, 0, 0, 0], (err) => {		// add username and password to the database
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
						
						initUser(client, level);

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
	var level = levels[client.levelId];

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


			for (var u in level.clientlist) {
				if (row.user == level.clientlist[u].name) {
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

			initUser(client, level);

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

function guest(returnPack, client) {
	var level = levels[client.levelId];

	initUser(client, level);

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
				stats.points = row.totalPoints;
				socket.socket.emit('getStats', stats);		//Needs socket.socket for some reason. Works though so may aswell keep it
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
	var level = levels[client.levelId];
	
	if (client.controlledobject.team == 'blue') {			//Need to get levels sorted so there is not only one, this doesn't allow for scalability atm
		level.blue.pop(client.controlledobject.name);	// Remove player from team on sign out
		level.bluespawn--;	// Decrement the team spawn counter
		printLog('removed ' + client.name + ' from team 1')
	} else {
		level.red.pop(client.controlledobject.name);
		level.redspawn--;
		printLog('removed ' + client.name + ' from team 2')
	}
	
	for (k in level.clientlist) {
		rClient = level.clientlist[k];
		rClient.socket.emit('removeplayer', {'id' : client.name});
	}
	level.playercount--;	// Decrement level playercount when player signs out
	//checkLevelPlayerCount(client.levelId);	//Need to think a bit more on this implementation
	client.signout();
}

function checkLevelPlayerCount(id) {		// This removes the level if empty, although something breaks atm. Will fix later
	var level = levels[id];
	if (level.playercount == 0) {
		delete levels[id];
	}
}


function checkLevelStart(level) {	//This checks to see if at least 2 players have entered the game
	var level = levels[level];		// Maybe add in a boolean to the level class to see if it is started
	if (level.playercount > 1 && !level.started) {	// This would allow for a > 2 and !hasStarted check // The +1 is there as for some reason playercount is 1 less that what it should be
		startTimer(level.id);
	}
}

function updateUserStats(levelId) {
	var level = levels[levelId];
	for (i in level.clientlist) {
		if (!(level.clientlist[i].controlledobject.isGuest)) {
			var player = level.clientlist[i].controlledobject;
			printLog("wins: " + player.wins + "  kills: " + player.kills + "  points: " + player.points + "    id: " + player.id);
			let sql = 'UPDATE users SET wins = wins + ?, kills = kills + ?, totalPoints = totalPoints + ? WHERE user = ?';
				let values = [player.wins, player.kills, player.points, player.id];
			db.run(sql, values, function(err) {
				if (err) {
					return printLog("Failure in updating user: " + player.id + " stats");
				};
				
				printLog(player.id + " stats have been updated");
			});
		}
 	}
};

function startTimer(level, sec=61) {
	var level = levels[level];
	level.started = true;
	var timerInterval = setInterval(() => {		// This means it is synced across all levels, change this
		sec--;

		for (k in level.clientlist) {
			rClient = level.clientlist[k];
			rClient.socket.emit('updateTimer', sec);
		}

		if(sec==60) { // Reset player position and spawn balls
			for (i in level.clientlist) {
				rClient = level.clientlist[i];
				rClient.socket.emit('resetPos');
			} 
			
			printLog("Adding balls to level");
			spawnBalls(level.id)
		}

		if (sec==0) {
			clearInterval(timerInterval);
			for (i in level.gameobjects) {
				if (level.gameobjects[i] instanceof gameobjects.Point) {
					console.log(Object.keys(level.gameobjects[i]));
					for (c in level.clientlist) {
						level.clientlist[c].socket.emit('removeplayer', {id: level.gameobjects[i]})		//This removes the balls from the players level.gameobjects
					}
					level.gameobjects[i].remove();
				}
			} 
			sec = 61;
			if (level.redteamscore > level.blueteamscore) {
				winner = "red";
				winnerMessage = "Red Team Wins";
			} else if (level.blueteamscore > level.redteamscore) {
				winner = "blue";
				winnerMessage = "Blue Team Wins";
			} else if ( level.blueteamscore == level.redteamscore) {
				winner = "draw";
				winnerMessage = "Draw";
			}
			
			level.redteamscore = 0;		// Reset team scores at the end of the match
			level.blueteamscore = 0;
			
			
			for (k in level.clientlist) {
				rClient = level.clientlist[k];
				player = rClient.controlledobject;
				if (player.team == winner) {
					player.wins++;
				}
								
				rClient.socket.emit('updateTimer', winnerMessage);
				rClient.socket.emit('winningTeam', {"winningTeam" : winner});
				rClient.socket.emit('teamScoreReset');		// This informs the client's level that the team scores are to be reset
			}
			updateUserStats(level.id);
			
			for (c in level.clientlist) {		// This resets the values of the server side instances of logged in users
				player = level.clientlist[c].controlledobject
				if (!(player.isGuest)) {		//NEED TO CREATE VARIABLES TO STORE SESSION STATS FOR GUESTS, FROM THERE WE CAN JUST RESET VALUES ACROSS THE BOARD
					player.points = 0;
					player.wins = 0;
					player.kills = 0;
					level.clientlist[c].socket.emit('resetPlayerStats');
				}
			}
			setTimeout(() => {startTimer(level.id)}, 5000);
			printLog("Timer Done");
		}
	}, 1000);
}




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
function addBallsToLevelFixed(lvl) {
	for(i = 0; i < lvl.gameobjects.length; i++) {
		if (lvl.gameobjects[i] instanceof gameobjects.BallSpawnPoint) {
			var spawnPosition = lvl.gameobjects[i].pos;
			var b = new gameobjects.Point(lvl.gameobjects[i].pos, 0, lvl);
			lvl.addObject(b);
		}
	}
}


// This takes in the level where the balls have to spawn and loops through all instances of the pointspawnpos and adds a ball in each instance
function spawnBalls(levelId) {
	var level = levels[levelId]
	for (var i in level.pointspawnpos) {
		var newBall = new gameobjects.Point(new util.Position(level.pointspawnpos[i][0], level.pointspawnpos[i][1]), 0, level)
		level.addObject(newBall);
	}

}

function playerScoring(playerId, playerTeam, levelId) {
	var level = levels[levelId];
	if (playerTeam == "blue") {
		level.blueteamscore++;
	} else if (playerTeam = "red") {
		level.redteamscore++;
	}
	
	for (i in level.gameobjects) {
		if (level.gameobjects[i].id == playerId) {
			level.gameobjects[i].points++;
		}
	}
	
	for (c in level.clientlist) {
		level.clientlist[c].socket.emit('playerScored', {"playerId" : playerId, "redteamscore" : level.redteamscore, "blueteamscore" : level.blueteamscore})
	}
	
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
