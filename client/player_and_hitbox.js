/*
Copyright (c) 2020 fraser50, mta2k00, blast1113, dr62, frg2
This work is licensed under the MIT license which can be found in the LICENSE file in the root of the project.
*/

class Player {
	//constructor
	constructor(playerName, playerColor, playerXPos, playerYPos) {
		this.playerName = playerName;
		this.playerColor = playerColor;
		this.playerXPos = playerXPos;
		this.playerYPos = playerYPos;

		this.playerXVel = 0;
		this.playerYVel = 0;
		this.playerMaxVel = 10; //NOTE: playerMaxVel will be used if we are planning to implement acceleration

		this.state = "down";
		this.holdingBall = false;


		//create the player div
		const playerDiv = document.createElement("div");
		playerDiv.setAttribute("id", "playerdiv");

		//get player spritesheet
		const playerImg = document.createElement("img");
		playerImg.setAttribute("id", "playerimg");
		playerImg.setAttribute("src", "\\multiGame\\images\\player_spritesheet.png");

		//set player position
		playerDiv.style.position = "absolute";
		playerDiv.style.top = playerYPos + "px";
		playerDiv.style.left = playerXPos + "px";

		//set player size
		playerDiv.style.width = "32px";
		playerDiv.style.height = "32px";

		playerDiv.appendChild(playerImg);


		//set player colour and outline
		//playerDiv.style.backgroundColor = this.playerColor; //This code is only used if spritesheet is not being used
		playerDiv.style.outline = "1px solid black";


		//set player image
		//playerDiv.style.backgroundImage = "url('C:\Users\Mitchell\Documents\Programming\Javascript\multiGame\images\player_spritesheet.png')";

		document.body.insertBefore(playerDiv, document.getElementById("javascriptcode"));
		document.addEventListener("keydown", this.readKey);
		document.addEventListener("keyup", this.stopMovement);
	}

	//methods
	attack() {
		if(this.state == "right") {
			let hitbox = new Hitbox((this.getPlayerXPos + 32), this.getPlayerYPos);
		}
	}


	readKey(key) {
		//check for left arrow key press
		if(key.keyCode == 37) {
			this.state = "left";
			this.playerXVel = -2;
			console.log("left was pressed"); //Test code
		}

		//check for right arrow key press
		if(key.keyCode == 39) {
			this.state = "right";
			this.playerXVel = 2;
			console.log("right was pressed"); //Test code
		}

		//check for up arrow key press
		if(key.keyCode == 38) {
			this.state = "up";
			this.playerYVel = -2;
			console.log("up was pressed"); //Test code
		}

		//check for down arrow key press
		if(key.keyCode == 40) {
			this.state = "down";
			this.playerYVel = 2;
			console.log("down was pressed"); //Test code
		}

		//check for spacebar pressed (attack button)
		if(key.keyCode == 32) {
			if(this.holdingBall){
				//code to drop ball
				this.holdingBall = false;
			}
			console.log("Attack!"); //Test code
		}
	}

	stopMovement() {
		this.playerXVel = 0;
		this.playerYVel = 0;
	}

	updatePosition() {
		this.playerXPos += playerXVel;
		this.playerYPos += playerYVel;
		playerDiv.style.left = playerXPos + "px";
		playerDiv.style.top = playerYPos + "px";
	}



	getPlayerName() {
		return this.playerName;
	}

	getPlayerState() {
		return this.state;
	}

	getPlayerXPos() {
		return this.playerXPos;
	}

	getPlayerYPos() {
		return this.playerYPos;
	}


	//End of Player class
}

//Hitbox class might need some work
class Hitbox {
	//constructor
	constructor(xPos, yPos) {
		this.xPos = xPos;
		this.yPos = yPos;

		//create the hitbox div
		var hitboxDiv = document.createElement("div");
		hitboxDiv.setAttribute("id", "hitboxdiv");

		//set htibox position
		hitboxDiv.style.position = "absolute";
		hitboxDiv.style.top = yPos + "px";
		hitboxDiv.style.left = xPos + "px";

		//set hitbox size
		hitboxDiv.style.width = "32px";
		hitboxDiv.style.height = "32px";

		//set hitbox color (for testing purposes)
		hitboxDiv.style.backgroundColor = "yellow";
		hitboxDiv.style.outline = "1px solid black";

		document.body.insertBefore(hitboxDiv, document.getElementById("javascriptcode"));
	}


	getHitboxXPos() {
		return this.xPos;
	}

	getHitboxYPos() {
		return this.yPos;
	}

	//End of Hitbox class
}

//main method
let player1 = new Player("playe001", "red", 100, 100);
console.log(player1.getPlayerName());
