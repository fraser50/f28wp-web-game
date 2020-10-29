var loopShouldRun = true;

var frametime = 0;
var fps = 0;

var thisLoop;
var lastLoop;

function loop(level) {
	thisLoop = new Date();
	frametime = thisLoop - lastLoop;
	fps = 1000/ frametime;

	frametimeLabel.updateValue(frametime);
	fpsLabel.updateValue(fps);
	frametimeGraph.addBar(frametime/100);

	doMovement(socket.player, frametime);

	level.update();
	render(level);
	currentLevel.render(socket.player);

	// Add other stuff here

	lastLoop = thisLoop;
	if (loopShouldRun)
		window.requestAnimationFrame(() => {loop(level)});
}

function startLoop(level) {
	loopShouldRun = true;
	window.requestAnimationFrame(() => {loop(level)});
}

function stopLoop() {
	loopShouldRun = false;
}
