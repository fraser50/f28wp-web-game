var loopShouldRun = true;

function loop(level) {
    level.update();
    render(level);

    // Add other stuff here

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
