
//identify player and position from html doc
var player = document.getElementById("player");



// Position object to store player position
let playerPos = new Position(0, 0);

// Vector object to store player velocity and direction
let playerVel = new Vector(0, 0);

// Constants for how the player should move
let playerVelMax = 0.01;
let playerAcceleration = 0.00005;
let playerVelDecay = 0.99;

//this update function should run within main gameloop update function
function update(lastFrametime) {
	doMovement(lastFrametime);
}

// JSON object to store the key bindings and their states (pressed == undefined assumed to be false)
let keyStates = {
	up: {codes: [38, 87]},   // Up arrow or W
	down: {codes: [40, 83]}, // Down arrow or S
	left: {codes: [37, 65]}, // Left arrow or A
	right: {codes: [39, 68]} // Roght arrow or D
}

// Set the pressed attribute of the key based on the type of event (down = true, up = false)
function keyEvent(code, isDown) {
	for (const [key, value] of Object.entries(keyStates)) {
		for (var ci in value.codes) {
			if (value.codes[ci] == code) {
				value.pressed = isDown;
				// console.debug(keyStates, isDown, ci, value.codes[ci] == code, value.pressed);
			}
		}
	}
}

// Event listeners for detecting key presses
window.addEventListener("keydown", function(e) { keyEvent(e.keyCode, 1) });
window.addEventListener("keyup", function(e) { keyEvent(e.keyCode, 0) });

var playerVelXY = {x:0, y:0};

// TODO: NOT WORKING YET
function doMovement(player, lastFrametime) {

	// Add/subtract velocity for key presses
	if (keyStates.up.pressed)
		playerVelXY.y -= playerAcceleration * lastFrametime;
	if (keyStates.down.pressed)
		playerVelXY.y += playerAcceleration * lastFrametime;

	if (keyStates.left.pressed)
		playerVelXY.x -= playerAcceleration * lastFrametime;
	if (keyStates.right.pressed)
		playerVelXY.x += playerAcceleration * lastFrametime;

	// Frametime can be NaN somehow
	lastFrametime = isNaN(lastFrametime) ? 0 : lastFrametime;

	// Make the velocity decay over time
	playerVelXY.x *= playerVelDecay ** lastFrametime;
	playerVelXY.y *= playerVelDecay ** lastFrametime;
	

	// Limit the velocity
	var total = Math.sqrt(playerVelXY.x**2 + playerVelXY.y**2);
	var scale = playerVelMax / total;
	if (scale < 1) {
		playerVelXY.x *= scale
		playerVelXY.y *= scale
	}

	socket.player.pos[0] += playerVelXY.x * lastFrametime;
	socket.player.pos[1] += playerVelXY.y * lastFrametime;
}
