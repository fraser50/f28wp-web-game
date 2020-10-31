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
	}
	
	addToPage() {
		if (objects.querySelector("#"+this.id) != undefined)
			objects.removeChild(ui.querySelector("#"+this.id))
			
		var playerDiv = document.createElement("div");
		playerDiv.setAttribute("id", "playerdiv");

		//get player spritesheet
		const playerImg = document.createElement("img");
		playerImg.setAttribute("id", "playerimg");
		playerImg.setAttribute("src", "client/assets/images/player_up.png");
		
		//set player size
		playerDiv.style.width = "64px";
		playerDiv.style.height = "64px";
		playerDiv.style.zIndex = this.zPos;
		
		playerImg.style.width = "100%";
		playerImg.style.height = "100%";


		//set player position
		playerDiv.style.position = "absolute";	//Top and Left won't affect it if we use static
		playerDiv.style.top = `calc(50% - 32px + ${playerImg.y}px)`;
		playerDiv.style.left = `calc(50% - 32px + ${playerImg.x}px)`;

		playerDiv.appendChild(playerImg);
		objects.appendChild(playerDiv);

		this.div = playerDiv;
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
