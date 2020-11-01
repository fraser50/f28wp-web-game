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

	toJSON() {
		return {
			"x" : this.pos.x,
			"y" : this.pos.y
		}
	}
}

class Player extends GameObject {
	constructor(pos, rotation, level, velocity, id) {
		super(pos, rotation, level);
		this.id = socket.id;
		this.wins = 0;
		this.kills = 0;
		this.points = 0;
		this.zPos = 5;
	}
	
	addToPage() {
		if (objects.querySelector("#"+this.id) != undefined)
			objects.removeChild(ui.querySelector("#"+this.id))
			
		var playerDiv = document.createElement("div");
		playerDiv.setAttribute("id", this.id);

		//get player spritesheet
		const playerImg = document.createElement("img");
		playerImg.setAttribute("id", "playerimg");
		playerImg.setAttribute("src", "client/assets/images/player_up.png");
		
		//set player size
		playerDiv.style.width = zoomLevel + "px";
		playerDiv.style.height = zoomLevel + "px";
		playerDiv.style.zIndex = this.zPos;
		
		playerImg.style.width = "100%";
		playerImg.style.height = "100%";


		//set player position
		playerDiv.style.position = "absolute";	//Top and Left won't affect it if we use static
		playerDiv.style.top = `calc(50% - ${zoomLevel/2}px + ${playerImg.y}px)`;
		playerDiv.style.left = `calc(50% - ${zoomLevel/2}px + ${playerImg.x}px)`;

		playerDiv.appendChild(playerImg);
		objects.appendChild(playerDiv);

		this.div = playerDiv;
	}
	
	remove() {
		var player = document.getElementById(this.id);
		objects.removeChild(player);
		loopStartButton.loopRunning = false;
		stopLoop();
		loopStartButton.updateValue("Start loop");
		loginWindow.show();
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
