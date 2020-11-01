// Constants for how the player should move TODO: Make these have a more reasonable range
let playerVelMax = 0.004;
let playerMinVel = 1e-8;
let playerAcceleration = 0.00005;
let playerVelDecay = 0.99; // This is a multiplier (lower values = faster decay)

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

// Store the player's velocity (currently as X and Y, maybe switch to vectors)
var playerVelXY = {x:0, y:0};

function doMovement(player, lastFrametime) {
	// Add/subtract velocity for key presses
	if (keyStates.up.pressed) {
		playerVelXY.y -= playerAcceleration * lastFrametime;
	}
	if (keyStates.down.pressed)
		playerVelXY.y += playerAcceleration * lastFrametime;
		
	if (keyStates.left.pressed)
		playerVelXY.x -= playerAcceleration * lastFrametime;
		
	if (keyStates.right.pressed)
		playerVelXY.x += playerAcceleration * lastFrametime;

	
	// Frametime can be NaN somehow
	lastFrametime = isNaN(lastFrametime) ? 0 : lastFrametime;

	// Make the velocity decay over time (only if no keys are pressed in that axis)
	if ((keyStates.up.pressed ^ keyStates.down.pressed) == 0)
		playerVelXY.y *= playerVelDecay ** lastFrametime;
	if ((keyStates.left.pressed ^ keyStates.right.pressed) == 0)
		playerVelXY.x *= playerVelDecay ** lastFrametime;

	// Limit the velocity
	var total = Math.sqrt(playerVelXY.x**2 + playerVelXY.y**2);
	if (total > playerVelMax) {
		var scale = playerVelMax / total;
		playerVelXY.x *= scale;
		playerVelXY.y *= scale;
	}

	// If the velocity is very small, set it to 0
	if (total < playerMinVel) {
		playerVelXY.x = 0;
		playerVelXY.y = 0;
	}

	//If player has wall directly above or below
	if(this.checkVerticalCollision) {
		//player can only move right and left
		player.pos[0] += playerVelXY.x * lastFrametime;
		player.pos[1] += 0;
	}
	
	//If player has wall directly to left or right
	else if(this.checkHorizontalCollision) {
		//player can only move up and down
		player.pos[0] += 0;
		player.pos[1] += playerVelXY.y * lastFrametime;
	}

	else {
		// Apply the velocity to the player's position
		player.pos[0] += playerVelXY.x * lastFrametime;
		player.pos[1] += playerVelXY.y * lastFrametime;
	}
}

function direction(player) {
	var playerAngle = Math.atan(playerVelXY.y/playerVelXY.x);
	var final = 0;
	if (playerVelXY.x == 0)
		final = playerAngle + Math.PI/2;
	else
		final = playerAngle + Math.sign(playerVelXY.x)*Math.PI/2;
	player.div.style.transform = `rotate(${final}rad)`;
}

//Functions for collision detection below
//Will need some more implementation to get pos of gameobjects
function checkVerticalCollision() {
	//Checks for collisions on top and bottom edges of player
	//check x coords
	//Check if player is on the left of object
	if(player.pos[0] < object.pos[0]) {
		if((player.pos[0] + 64) > object.pos[0]) {
			return true; //collision has occurred
		}
	}
	//Check if player is on the right of object
	else if(player.pos[0] > object.pos[0]) {
		if(player.pos[0] < (object.pos[0] + 64)) {
			return true; //collision has occurred
		}
	}
	else {
		return false; //no collision has occurred
	}
}

//Will need some more implementation to get pos of gameobjects
function checkHorizontalCollision() {
	//Checks for collisions on left and right edges of player
	//check y coords
	//Check if player is above object
	if(player.pos[1] < object.pos[1]) {
		if((player.pos[1] + 64) > object.pos[1]) {
			return true; //collision has occurred
		}
	}
	//Check if player is below object
	else if(player.pos[1] > object.pos[1]) {
		if(player.pos[1] < (object.pos[1] + 64)) {
			return true; //collision has occurred
		}
	}
	else {
		return false; //no collision has occurred
	}
}
