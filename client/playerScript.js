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
	right: {codes: [39, 68]}, // Right arrow or D
	shift: {codes: [16]}
}

function checkLeaderboard() {		//Would've used tab, but would change focus to other objs. Might want to change how this works for better performance.
//Need to add in blocks like if user is focused on chat or there is login/stats window up
	if (keyStates.shift.pressed) {
		document.getElementById("leaderboardWindow").style.display = "block";
	} else {
		document.getElementById("leaderboardWindow").style.display = "none";
	}
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
	var lastPos = [];
	lastPos.push(player.pos.x);
	lastPos.push(player.pos.y);

	// Frametime can be NaN somehow
	lastFrametime = isNaN(lastFrametime) ? 0 : lastFrametime;

	// Add/subtract velocity for key presses
	if (!player.disableMovement) {
		if (keyStates.up.pressed) {
			playerVelXY.y -= playerAcceleration * lastFrametime;
		}
		if (keyStates.down.pressed)
			playerVelXY.y += playerAcceleration * lastFrametime;
			
		if (keyStates.left.pressed)
			playerVelXY.x -= playerAcceleration * lastFrametime;
			
		if (keyStates.right.pressed)
			playerVelXY.x += playerAcceleration * lastFrametime;

		// Make the velocity decay over time (only if no keys are pressed in that axis)
		if ((keyStates.up.pressed ^ keyStates.down.pressed) == 0)
			playerVelXY.y *= playerVelDecay ** lastFrametime;
		if ((keyStates.left.pressed ^ keyStates.right.pressed) == 0)
			playerVelXY.x *= playerVelDecay ** lastFrametime;
	} else {
		playerVelXY.y *= playerVelDecay ** lastFrametime;
		playerVelXY.x *= playerVelDecay ** lastFrametime;
	}

	var tile = getTileAt(currentLevel, Math.floor(player.pos.x + playerVelXY.x * lastFrametime), Math.floor(player.pos.y));
	// If there is a wall where the player would end up in the x axis, stop the player in that axis
	if (!tile || tile.isWall)
		playerVelXY.x = 0;

	tile = getTileAt(currentLevel, Math.floor(player.pos.x), Math.floor(player.pos.y + playerVelXY.y * lastFrametime));
	// If there is a wall where the player would end up in the y axis, stop the player in that axis
	if (!tile || tile.isWall)
		playerVelXY.y = 0;

	tile = getTileAt(currentLevel, Math.floor(player.pos.x + playerVelXY.x * lastFrametime), Math.floor(player.pos.y + playerVelXY.y * lastFrametime));
	// If there is a wall directly in front of the player, stop them completely (fixes the rare occurence of getting stuck on the corner of a wall)
	if (!tile || tile.isWall) {
		playerVelXY.x = 0;
		playerVelXY.y = 0;
	}
	if (tile != undefined && player.holdingBall) {		// This makes sure an error doesn't throw as there hasn't been a frame before this
		if (tile.isRedbase && player.team == 'red') { // Checks to see if a player from redteam is standing on redbase
			console.log("adding point for red");	// Change player image back to default red
			var image = "player_red.png";
			player.updatePlayerImg(image);
			socket.emit('playerChangeImg', {"playerId" : player.id, "image" : image, "levelId" : player.level})		// add a point to the player
			player.holdingBall = false;
			socket.emit('playerScored', {"playerId" : player.id, "playerTeam" : player.team, "levelId" : player.level})
			player.points++;
			currentLevel.redteamscore++; // Should try to send this value out to server after it is increased, otherwise all other clients view it as 0
		}
		if (tile.isBluebase && player.team == 'blue') {	//Change this back after testing 
			console.log("adding point for blue");
			var image = "player_up.png";		
			player.updatePlayerImg(image);	//Updates local player image
			socket.emit('playerChangeImg', {"playerId" : player.id, "image" : image, "levelId" : player.level}) //Sends info to server to tell other clients player has changed image
			player.holdingBall = false;	// Set holding ball to false as user has desposited ball in base
			socket.emit('playerScored', {"playerId" : player.id, "playerTeam" : player.team, "levelId" : player.level})
			player.points++;	// Increment player points
			currentLevel.blueteamscore++; // Should try to send this value out to server after it is increased, otherwise all other clients view it as 0. Use similar format as playerChangeImg
		}
	}

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

	//if there is a collision
	if(this.checkVerticalCollision || this.checkHorizontalCollision) {
		//check that player is not moving against a wall
		if(this.checkVerticalCollision) {
			//player can only move right and left
			player.pos.x += playerVelXY.x * lastFrametime;
			player.pos.y += 0;
		}

		if(this.checkHorizontalCollision) {
			//player can only move up and down
			player.pos.x += 0;
			player.pos.y += playerVelXY.y * lastFrametime;
		}
	}

	else {
		// Apply the velocity to the player's position
		player.pos.x += playerVelXY.x * lastFrametime;
		player.pos.y += playerVelXY.y * lastFrametime;
	}
}

function direction(player) {
	var playerAngle = Math.atan(playerVelXY.y/playerVelXY.x);
	var final = 0;
	if (playerVelXY.x == 0)
		final = playerAngle + Math.PI/2;
	else
		final = playerAngle + Math.sign(playerVelXY.x)*Math.PI/2;
	//player.elem.style.transform = `rotate(${final}rad)`;
	player.rotation = final;
}

//Functions for collision detection below
//Will need some more implementation to get pos of gameobjects
function checkVerticalCollision() {
	//Checks for collisions on top and bottom edges of player
	//check x coords
	//Check if player is on the left of object
	if(player.pos.x < object.pos.x) {
		if((player.pos.x + 64) > object.pos.x) {
			return true; //collision has occurred
		}
	}
	//Check if player is on the right of object
	else if(player.pos.x > object.pos.x) {
		if(player.pos.x < (object.pos.x + 64)) {
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
	if(player.pos.y < object.pos.y) {
		if((player.pos.y + 64) > object.pos.y) {
			return true; //collision has occurred
		}
	}
	//Check if player is below object
	else if(player.pos.y > object.pos.y) {
		if(player.pos.y < (object.pos.y + 64)) {
			return true; //collision has occurred
		}
	}
	else {
		return false; //no collision has occurred
	}
}
