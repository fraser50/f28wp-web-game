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
	lastPos.push(player.pos[0]);
	lastPos.push(player.pos[1]);

	// Frametime can be NaN somehow
	lastFrametime = isNaN(lastFrametime) ? 0 : lastFrametime;

	// Add/subtract velocity for key presses
	if (!player.disableMovement) {
		if (keyStates.up.pressed) {
			playerVelXY.y -= playerAcceleration * lastFrametime;
		}
		if (keyStates.down.pressed) {
			playerVelXY.y += playerAcceleration * lastFrametime;            
        }

			
		if (keyStates.left.pressed) {
			playerVelXY.x -= playerAcceleration * lastFrametime;            
        }

			
		if (keyStates.right.pressed) {
			playerVelXY.x += playerAcceleration * lastFrametime;            
        }


		// Make the velocity decay over time (only if no keys are pressed in that axis)
		if ((keyStates.up.pressed ^ keyStates.down.pressed) == 0) {
			playerVelXY.y *= playerVelDecay ** lastFrametime;            
        }

		if ((keyStates.left.pressed ^ keyStates.right.pressed) == 0) {
			playerVelXY.x *= playerVelDecay ** lastFrametime;            
        }

	} 
    
    //Normal player movement
    else {
		playerVelXY.y *= playerVelDecay ** lastFrametime;
		playerVelXY.x *= playerVelDecay ** lastFrametime;
	}
    
    
    // Check for collision against other player objects 
    for(var i = 0; i < currentLevel.gameobjects.length; i++) {
        let object = currentLevel.gameobjects[i];
        
        //Check player pos and object sides
        if(object instanceof Player) {

            //collision along x axis (player on left, object on right)
            if((player.rightEdge == object.leftEdge) && (between(player.rightEdge, object.topLeftCorner, object.bottomLeftCorner) || between(player.topRightCorner, object.topLeftCorner, object.bottomLeftCorner) || between(player.bottomRightCorner, object.topLeftCorner, object.bottomLeftCorner))) {
				//Some test print statements
				console.log("Player collision!");
				console.log("Collision along x axis");
				console.log("Player is on the left side of object!");

				//TODO: Add code to stop player moving to the right
			}
			
			//collision along x axis (player on right, object on left)
			else if((player.leftEdge == object.rightEdge) && (between(player.leftEdge, object.topRightCorner, object.bottomRightCorner) || between(player.topLeftCorner, object.topRightCorner, object.bottomRightCorner) || between(player.bottomLeftCorner, object.topRightCorner, object.bottomRightCorner))) {
				//Some test print statements
				console.log("Player collision!");
				console.log("Collision along x axis");
				console.log("Player is on the right side of object!");
				
				//TODO: Add code to stop player moving to the left
			}
			
			//collision along y axis (player on top, object at bottom)
            if((player.bottomEdge == object.topEdge) && (between(player.bottomEdge, object.topRightCorner, object.topLeftCorner) || between(player.bottomRightCorner, object.topRightCorner, object.topLeftCorner) || between(player.bottomLeftCorner, object.topRightCorner, object.topLeftCorner))) {
				//Some test print statements
				console.log("Player collision!");
				console.log("Collision along y axis");
				console.log("Player is on top of object!");

				//TODO: Add code to stop player moving down
			}
			
			//collision along y axis (player at bottom, object on top)
			else if((player.topEdge == object.bottomEdge) && (between(player.topEdge, object.bottomRightCorner, object.bottomLeftCorner) || between(player.topRightCorner, object.bottomRightCorner, object.bottomLeftCorner) || between(player.topLeftCorner, object.bottomRightCorner, object.bottomLeftCorner))) {
				//Some test print statements
				console.log("Player collision!");
				console.log("Collision along y axis");
				console.log("Player is at bottom of object!");
				
				//TODO: Add code to stop player moving up
            }
        }
        

        
        /* Old collision check code
        //Checks for collisions on top and bottom edges of player
        //check x coords
        //Check if player is on the left of object
        if(player.pos[0] < object.pos[0]) {
            if((player.pos[0] + 0.7) > object.pos[0]) {
                playerVelXY.x = 0;
                console.log("collision occurred!");
            }
        }
        //Check if player is on the right of object
        else if(player.pos[0] > object.pos[0]) {
            if(player.pos[0] < (object.pos[0] + 0.7)) {
                playerVelXY.x = 0;
                console.log("collision occurred!");
            }
        }
        
        //Checks for collisions on left and right edges of player
        //check y coords
        //Check if player is above object
        else if(player.pos[1] < object.pos[1]) {
            if((player.pos[1] + 0.7) > object.pos[1]) {
                playerVelXY.y = 0;
                console.log("collision occurred!");
            }
        }
        //Check if player is below object
        else if(player.pos[1] > object.pos[1]) {
            if(player.pos[1] < (object.pos[1] + 0.7)) {
                playerVelXY.y = 0;
                console.log("collision occurred!");
            }
        }
        */
        
    }
    
	var tile = getTileAt(currentLevel, Math.floor(player.pos[0] + playerVelXY.x * lastFrametime), Math.floor(player.pos[1]));
	// If there is a wall where the player would end up in the x axis, stop the player in that axis
	if (!tile || tile.isWall)
		playerVelXY.x = 0;

	tile = getTileAt(currentLevel, Math.floor(player.pos[0]), Math.floor(player.pos[1] + playerVelXY.y * lastFrametime));
	// If there is a wall where the player would end up in the y axis, stop the player in that axis
	if (!tile || tile.isWall)
		playerVelXY.y = 0;

	tile = getTileAt(currentLevel, Math.floor(player.pos[0] + playerVelXY.x * lastFrametime), Math.floor(player.pos[1] + playerVelXY.y * lastFrametime));
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
			socket.emit('playerChangeImg', {"playerId" : player.id, "image" : image})		// add a point to the player
			player.holdingBall = false;
			player.points++;
			currentLevel.redteamscore++; // Should try to send this value out to server after it is increased, otherwise all other clients view it as 0
		}
		if (tile.isBluebase && player.team == 'blue') {	//Change this back after testing 
			console.log("adding point for blue");
			var image = "player_up.png";		
			player.updatePlayerImg(image);	//Updates local player image
			socket.emit('playerChangeImg', {"playerId" : player.id, "image" : image}) //Sends info to server to tell other clients player has changed image
			player.holdingBall = false;	// Set holding ball to false as user has desposited ball in base
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


    // Apply the velocity to the player's position
    player.pos[0] += playerVelXY.x * lastFrametime;
    player.pos[1] += playerVelXY.y * lastFrametime;
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

//number between function used to check if number is between two numers. Returns boolean
function between(num, smallNum, bigNum) {
	return ((smallNum < num) || (num < bigNum));
}

/*
//Functions for collision detection below

//Compares position of all Player objects in the same level
//Use this function to determine how the player should move.
function currentLevelCollisionDetection(player, currentLevel) {
    // Check for collision against other game objects 
    for (o in currentLevel.gameobjects) {
        let object = currentLevel.gameobjects[o];
        
        //Checks for collisions on top and bottom edges of player
        //check x coords
        //Check if player is on the left of object
        if(player.pos[0] < object.pos[0]) {
            if((player.pos[0] + 64) > object.pos[0]) {
                player.pos[0] += 0;
                player.pos[1] += playerVelXY.y * lastFrametime;
            }
        }
        //Check if player is on the right of object
        else if(player.pos[0] > object.pos[0]) {
            if(player.pos[0] < (object.pos[0] + 64)) {
                player.pos[0] += 0;
                player.pos[1] += playerVelXY.y * lastFrametime;
            }
        }
        
        //Checks for collisions on left and right edges of player
        //check y coords
        //Check if player is above object
        else if(player.pos[1] < object.pos[1]) {
            if((player.pos[1] + 64) > object.pos[1]) {
                player.pos[0] += playerVelXY.x * lastFrametime;
                player.pos[1] += 0;
            }
        }
        //Check if player is below object
        else if(player.pos[1] > object.pos[1]) {
            if(player.pos[1] < (object.pos[1] + 64)) {
                player.pos[0] += playerVelXY.x * lastFrametime;
                player.pos[1] += 0;
            }
        }
        //No collision happened
        else {
        playerVelXY.y *= playerVelDecay ** lastFrametime;
		playerVelXY.x *= playerVelDecay ** lastFrametime;
        }

    }
}
*/
/*
//Will need some more implementation to get pos of gameobjects
function checkVerticalCollision(player, object) {
	//Checks for collisions on top and bottom edges of player
	//check x coords
	//Check if player is on the left of object
	if(player.pos[0] < object.pos[0]) {
		if((player.pos[0] + 64) > object.pos[0]) {
            player.pos[0] += 0;
            player.pos[1] += playerVelXY.y * lastFrametime;
		}
	}
	//Check if player is on the right of object
	else if(player.pos[0] > object.pos[0]) {
        if(player.pos[0] < (object.pos[0] + 64)) {
            player.pos[0] += 0;
            player.pos[1] += playerVelXY.y * lastFrametime;
		}
	}
	else {
		return false; //no collision has occurred
	}
}

//Will need some more implementation to get pos of gameobjects
function checkHorizontalCollision(player, object) {
	//Checks for collisions on left and right edges of player
	//check y coords
	//Check if player is above object
	if(player.pos[1] < object.pos[1]) {
		if((player.pos[1] + 64) > object.pos[1]) {
            player.pos[0] += playerVelXY.x * lastFrametime;
            player.pos[1] += 0;
		}
	}
	//Check if player is below object
	else if(player.pos[1] > object.pos[1]) {
		if(player.pos[1] < (object.pos[1] + 64)) {
            player.pos[0] += playerVelXY.x * lastFrametime;
            player.pos[1] += 0;
		}
	}
}

*/
/*
        if(this.checkVerticalCollision(tempobj) || this.checkHorizontalCollision(tempobj)) {

            if(tempobj instanceof Player) {
                //check that player is not moving against a wall
                if(this.checkVerticalCollision(player, tempobj)) {
                    //player can only move right and left
                    player.pos[0] += playerVelXY.x * lastFrametime;
                    player.pos[1] += 0;
                }

                if(this.checkHorizontalCollision(player, tempobj)) {
                    //player can only move up and down
                    player.pos[0] += 0;
                    player.pos[1] += playerVelXY.y * lastFrametime;
                }
            }
        }
*/