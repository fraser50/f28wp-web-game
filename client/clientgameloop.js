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
	posLabel.updateValue(`Pos: X: ${roundNumber(socket.player.pos[0], 4)}, Y: ${roundNumber(socket.player.pos[1], 4)}, CX: ${Math.floor(socket.player.pos[0]/chunkSize)}, CY: ${Math.floor(socket.player.pos[1]/chunkSize)}`);
	velLabel.updateValue(`Vel: H: ${roundNumber(playerVelXY.x, 4)}, V: ${roundNumber(playerVelXY.y, 4)}, Total: ${roundNumber(Math.sqrt(playerVelXY.x**2 + playerVelXY.y**2), 4)}`);
	pingLabel.updateValue(`ping: ${ping}ms`);

	// Do player movement calcuations (maybe change this)
	doMovement(socket.player, frametime);
	direction(socket.player);
	
	// Update and render the current level
	level.update();
	render(level);
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
	socket.emit('playerstate', socket.player.toJSON());
}

var serverLoopf = () => {serverLoop(currentLevel)};

function startServerLoop(level) {
	setInterval(serverLoopf, 1000/60);
}

function stopServerLoop(level) {
	clearInterval(serverLoopf);
}

var otherPlayers = {};

window.addEventListener("load", () => {
	socket.on('playerstate', (data) => {
		for (p in data) {
			otherPlayers[p] = otherPlayers[p] ? otherPlayers[p] : {};
			otherPlayers[p].pos = data[p].pos;
			otherPlayers[p].rot = data[p].rot;
		}

		//console.debug(otherPlayers);

		updateOtherPlayers();
	});
});

function updateOtherPlayers() {
	// if (!currentLevel.objects && !currentLevel.newObjects) {
	// 	currentLevel.addObject(new player())
	// }
	for (var sId in otherPlayers) {
		if (sId == socket.id) continue;
		var playerObj = new Player(otherPlayers[sId].pos, otherPlayers[sId].rot, currentLevel, sId);

		// var exists = false;
		// for (var i in currentLevel.newobjects) {
		// 	//console.log(currentLevel.newobjects[i].id);
		// 	if (currentLevel.newobjects[i].id == sId)
		// 		exists = true;
		// }
		// for (var i in currentLevel.gameobjects) {
		// 	//console.log(currentLevel.gameobjects[i].id);
		// 	if (currentLevel.gameobjects[i].id == sId)
		// 		exists = true;
		// }

		if (!otherPlayers[sId].exists) {
			currentLevel.addObject(playerObj);
			otherPlayers[sId].obj = playerObj;
			otherPlayers[sId].exists = true;
		} else {
			playerObj = otherPlayers[sId].obj;
			playerObj.pos = otherPlayers[sId].pos;
			playerObj.rotation = otherPlayers[sId].rot;
		}
	}
}

