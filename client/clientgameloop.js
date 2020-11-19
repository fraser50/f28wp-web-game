var loopShouldRun = true;

// Frametime and fps variables
var frametime = 0;
var fps = 0;
var thisLoop;
var lastLoop;

function loop(level) {
	// Calculate frametime and fps
	thisLoop = new Date();
	frametime = thisLoop - lastLoop;
	fps = 1000/ frametime;

	// Update UI
	frametimeLabel.updateValue(`frametime: ${frametime}ms`);
	fpsLabel.updateValue("fps: " + roundNumber(fps, 2));
	frametimeGraph.addBar(frametime/100);
	posLabel.updateValue(`Pos: X: ${roundNumber(socket.player.pos.x, 4)}, Y: ${roundNumber(socket.player.pos.y, 4)}, CX: ${Math.floor(socket.player.pos.x/chunkSize)}, CY: ${Math.floor(socket.player.pos.y/chunkSize)}`);
	velLabel.updateValue(`Vel: H: ${roundNumber(playerVelXY.x, 4)}, V: ${roundNumber(playerVelXY.y, 4)}, Total: ${roundNumber(Math.sqrt(playerVelXY.x**2 + playerVelXY.y**2), 4)}`);
	pingLabel.updateValue(`ping: ${ping}ms`);

	checkLeaderboard();
	
	// Do player movement calcuations (maybe change this)
	doMovement(socket.player, frametime);
	direction(socket.player);
	

	
	// Update and render the current level
	level.update();
	render(level, socket.player);
	currentLevel.render(socket.player);
	socket.player.update();

	// Add other stuff here

	// Some more frametime stuff
	lastLoop = thisLoop;
	if (loopShouldRun)
		window.requestAnimationFrame(() => {loop(level)}); // Make it kind of recursive
}

function startLoop(level) {
	loopShouldRun = true;
	window.requestAnimationFrame(() => {loop(level)});
}

function stopLoop() {
	loopShouldRun = false;
}

// Loop for handling server communications

function serverLoop(level) {
	//socket.emit('playerstate', socket.player.toJSON());
	socket.emit('playerposupdate', {'id' : socket.player.id, 'x' : socket.player.pos.x, 'y' : socket.player.pos.y, 'rotation' : socket.player.rotation, "isGuest" : socket.player.isGuest, "team" : socket.player.team, "levelId" : level.id, "holdingBall" : socket.player.holdingBall, "holdingBallChanged" : socket.player.holdingBallChanged});
}

var serverLoopf = () => {serverLoop(currentLevel)};

function startServerLoop(level) {
	setInterval(serverLoopf, 1000/60);
}

function stopServerLoop(level) {
	clearInterval(serverLoopf);
}

function assignTeam(level) {	//This takes in level and sends the player of for team assign
	if (socket.player.team == undefined) {	//Makes sure player doesn't already have a team
		socket.emit('assignTeam', {"player" : JSON.stringify(socket.player), "level" : level.id});	//Send player and level id to be assigned by server
		socket.on('assignedTeam', (data) => {	//Look for server response
			socket.player.team = data.team;	// Set local client instance to the returned team value
			console.log(socket.player)
			if (socket.player.team == 'red') {
				socket.player.updatePlayerImg("player_red.png");
			} else {
				socket.player.updatePlayerImg("player_up.png");
			}
			socket.player.pos.x = data.pos[0];	// This updates the players position with assigned spawn point
			socket.player.pos.y = data.pos[1];
			socket.removeListener('assignedTeam');	// This is just for security (did work earlier, might be redundant now)
		});
	};
	level.addObject(socket.player);
	console.log(level.gameobjects)		//Shows all users have correct teams
};



window.addEventListener("load", () => {
	socket.on('removeplayer', (data) => {
		var removeplayer = currentLevel.findObject(data.id);
		if (removeplayer != null) {
			console.log(removeplayer);
			currentLevel.removeObject(removeplayer);
			console.log(currentLevel.gameobjects);
		}
	});
	
	socket.on('posupdate_old', (data) => { //TODO: Remove this later, see TODOS in server.js for more info
		//if (isGuest) data.id = "guest_"+data.id;
		var obj = currentLevel.findObject(data.id);
		
		if (data.isGuest && obj == null) {
			obj = currentLevel.findObject('guest_'+data.id);
		}
		
		var x = data.x;
		var y = data.y;
		var rot = data.rot;
		var isGuest = data.isGuest;
		var team = data.team;
		
		
		if (obj == null) {
			//data.id = "guest_"+data.id;
			console.log(data.id);
			obj = new Player(new Position(x, y), rot, currentLevel, new Vector(0, 0), data.id, isGuest, team);
			currentLevel.addObject(obj);
		} else {
			obj.pos.x = x;
			obj.pos.y = y;
			if (rot != null)		// This fixed rotation reset
				obj.rotation = rot;
		}

	});

	socket.on('posupdate', (data) => {
		//if (isGuest) data.id = "guest_"+data.id;
		var obj = currentLevel.findObject(data.id);
		
		var x = data.x;
		var y = data.y;
		var rot = data.rot;
		
		if (obj != null) {
			obj.pos.x = x;
			obj.pos.y = y;
			if (rot != null)		// This fixed rotation reset
				obj.rotation = rot;
		}
	});

	socket.on('newobject', (data) => {
		console.log('newobject handled');
		var objid = data.id;

		if (currentLevel.findObject(objid) != null) { // If an object with this ID already exists, don't add it again
			console.log('WARNING: Object that already exists was sent!');

		} else {
			var obj = objFromJSON(data);
			obj.level = currentLevel;
			currentLevel.addObject(obj);
		}
	});
	
	socket.on('playerChangeImg', (data) => {		// This is for updating player images when another player has their image changed
		var obj = currentLevel.findObject(data.playerId);	// Get your instance of this player
		if (obj != null) 
			currentLevel.updatePlayerImg(obj, data.image);		//update this client for the changed player's image
	});

	socket.on('ballstatechange', (data) => {
		/*
		This code works by sending a playerChangeImg message to the server which changes the current players image according to every client
		There are problems with this mainly for security as a client might choose not to tell other players they have picked up a ball, or they may pretend to be on a
		different team.
		TODO: Look into this.
		*/
		var holding = data.holding;
		var player = socket.player;
		var teamwithoutball = {'red' : "player_red.png", 'blue' : "player_up.png"};
		var teamwithball = {'red' : "player_red_with_ball.png", 'blue' : "player_with_ball.png"};

		if (holding) {
			socket.emit('playerChangeImg', {"playerId" : player.id, "image" : teamwithball[player.team], "levelId" : player.level});
			player.updatePlayerImg(teamwithball[player.team]);

		} else {
			socket.emit('playerChangeImg', {"playerId" : player.id, "image" : teamwithoutball[player.team], "levelId" : player.level});
			player.updatePlayerImg(teamwithoutball[player.team]);
		}
	});

});

