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

	// Do player movement calcuations (maybe change this)
	doMovement(socket.player, frametime);

	// Update and render the current level
	level.update();
	render(level);
	currentLevel.render(socket.player);

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
