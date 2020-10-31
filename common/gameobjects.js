class GameObject {
	constructor(pos, rotation, velocity) {
		this.pos = pos;
		this.rotation = rotation;
		this.velocity = velocity;

		this.removed = false;
	}

	update() {
		// Override this method for logic that should run every cycle
	}

	remove() {
		this.level.removeObject(this);
	}
}

class Player extends GameObject {
	constructor(pos, rotation, level, velocity) {
		super(pos, rotation, level);
		this.wins = 0;
		this.kills = 0;
		this.points = 0;
		this.zPos = 5;

		this.holdingBall = false;
		this.facing = "up";
	}

	addToPage() {
		if (objects.querySelector("#"+this.id) != undefined)
			objects.removeChild(ui.querySelector("#"+this.id))

		var playerDiv = document.createElement("div");
		playerDiv.setAttribute("id", "playerdiv");

		//get player spritesheet
		var playerImg = document.createElement("img");
		playerImg.setAttribute("id", "playerimg");
		playerImg.setAttribute("src", "../client/assets/images/player_up.png");

		//set player size
		playerDiv.style.width = "64px";
		playerDiv.style.height = "64px";
		playerDiv.style.zIndex = this.zPos;

		playerImg.style.width = "100%";
		playerImg.style.height = "100%";


		//set player position
		playerDiv.style.position = "absolute";	//Top and Left won't affect it if we use static
		playerDiv.style.top = `calc(50% - ${playerImg.h == undefined ? 0 : playerImg.h/2}px + ${playerImg.y}px)`;
		playerDiv.style.left = `calc(50% - ${playerImg.w == undefined ? 0 : playerImg.w/2}px + ${playerImg.x}px)`;

		playerDiv.appendChild(playerImg);
		objects.appendChild(playerDiv);

		//Add event listener to handle sprite changes
		document.addEventListener("keydown", this.readKey);
	}


    	readKey(key) {
        	//check for left arrow key or A key press
        	if((key.keyCode == 37) || (key.keyCode == 65)) {
			//check that player is not already facing left
			if(this.facing != "left") {
				let playerImg = document.getElementById("playerimg");
				playerImg.setAttribute("src", "../client/assets/images/player_left.png");
				this.facing = "left";
			}
        	}

        	//check for right arrow key or D key press
        	if((key.keyCode == 39) || (key.keyCode == 68)) {
			if(this.facing != "right") {
				let playerImg = document.getElementById("playerimg");
				playerImg.setAttribute("src", "../client/assets/images/player_right.png");
				this.facing = "right";
			}
        	}

        	//check for up arrow key or W key press
        	if((key.keyCode == 38) || (key.keyCode == 87)) {
			if(this.facing != "up") {
				let playerImg = document.getElementById("playerimg");
				playerImg.setAttribute("src", "../client/assets/images/player_up.png");
				this.facing = "up";
			}
        	}

        	//check for down arrow key or S key press
        	if((key.keyCode == 40) || (key.keyCode == 83)) {
			if(this.facing != "down") {
				let playerImg = document.getElementById("playerimg");
				playerImg.setAttribute("src", "../client/assets/images/player_down.png");
				this.facing = "down";
			}
        	}
    	}

        //check for spacebar pressed (attack button)
		//TODO: Finish off this commented out code for player attack
		/*if(key.keyCode == 32) {
            if(this.holdingBall){
                //code to drop ball
                this.holdingBall = false;
            }
            console.log("Attack!"); //Test code
        }
		*/

	changeSprite(spriteDirLocation) {
		playerImg.setAttribute("src", spriteDirLocation);
	}

	updateStats(wins, kills, points){
		this.wins += wins;
		this.kills += kills;
		this.points += points;
	}
}
class Point extends GameObject {
	constructor(pos, rotation, level) {
		this.velocity = velocity;
		this.zPos = 4; //z index of points are one below player so player can run over points if already carrying ball
	}
}
