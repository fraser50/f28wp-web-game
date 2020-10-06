
//identify player and position from html doc
var player = document.getElementById("player");



// Position object to store player position
let playerPos = new Position(0, 0);

// Vector object to store player velocity and direction
let playerVel = new Vector(0, 0);

// Constants for how the player should move
let playerVelMax = 2;
let playerAcceleration = 0.1;
let playerVelDecay = 0.1;

//this update function should run within main gameloop update function
function update(lastFrametime) {
	doMovement(lastFrametime);
}

// JSON object to store the key bindings and their states (pressed == undefined assumed to be false)
let keyStates = {
	up: {code: 38},
	down: {code: 40},
	left: {code: 37},
	right: {code: 39}
}

// Set the pressed attribute of the key based on the type of event (down = true, up = false)
function keyEvent(code, isDown) {
	for (const [key, value] of Object.entries(keyStates))
		if (value.code == code)
			value.pressed = isDown;
}

// Event listeners for detecting key presses
window.addEventListener("keydown", function(e) { keyEvent(e.keyCode, true) });
window.addEventListener("keyup", function(e) { keyEvent(e.keyCode, false) });


// TODO: NOT WORKING YET
function doMovement(lastFrametime) {
	if ((keyStates.up.pressed && keyStates.down.pressed) || (!keyStates.up.pressed && !keyStates.down.pressed)) {
		if (playerVel.magnitude > 0)
			playerVel.magnitude -= playerVelDecay * (lastFrametime/1000);
		else if (playerVel.magnitude < 0)
			playerVel.magnitude += playerVelDecay * (lastFrametime/1000);
	} else {
		var tempVelX = keyStates.left.pressed ? -playerAcceleration*(lastFrametime/1000) : (keyStates.right.pressed ? playerAcceleration*(lastFrametime/1000) : 0);
		var tempVelY = keyStates.up.pressed ? -playerAcceleration*(lastFrametime/1000) : (keyStates.down.pressed ? playerAcceleration*(lastFrametime/1000) : 0);

		// var scale = Math.sqrt(tempVelX**2 + tempVelY**2) / playerVelMax;
		// tempVelX *= scale;
		// tempVelY *= scale;

		var tempVec = Vector.fromXY(tempVelX, tempVelY);
		var scale = playerVelMax / tempVec.magnitude;
		if (scale < 1)
			tempVec.magnitude *= scale;

		playerVel.averageAngle(tempVec)
		playerVel.magnitude = Math.min(playerVelMax, playerVel.magnitude + tempVec.magnitude);
	}

	playerVel.add(playerPos);
}
