class GameObject {
	constructor(pos, rotation, velocity, level=undefined) {
		this.id = undefined; // This will be populated when added to a level
		this.level = level;

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
			"y" : this.pos.y,
			//"rot" : this.rotation,

		}
	}
}

class Player extends GameObject {
	constructor(pos, rotation, level, velocity, team) {
		super(pos, rotation, velocity, level);
		//this.id = socket.id;

		this.wins = 0;
		this.kills = 0;
		this.points = 0;
		this.zPos = 5;
		this.team = team;
		this.holdingBall = false;	// This is to track whether player currently has a ball
		this.holdingBallChanged = false;
		//this.image = image;
	}
	
	addToPage() { // Consider moving this to client
		if (objects.querySelector("#"+this.id) != undefined)
			objects.removeChild(ui.querySelector("#"+this.id))

		var elem = document.createElement("img");
		elem.id = this.id;
		elem.src = "client/assets/images/player_up.png";
		elem.style.width = zoomLevel + "px";
		elem.style.height = zoomLevel + "px";

		elem.style.left = `calc(50% - ${zoomLevel/2}px)`;
		elem.style.top = `calc(50% - ${zoomLevel/2}px)`;

		this.elem = elem;

		objects.appendChild(elem);
	}
	
	remove() {
		var player = document.getElementById(this.id);
		objects.removeChild(player);
		loopStartButton.loopRunning = false;
		stopLoop();
		loopStartButton.updateValue("Start loop");
		loginWindow.show();
	}
	
	removeOtherPlayer() {	//THIS MIGHT BE USELESS NOW
		var player = document.getElementById(this.id);
		objects.removeChild(player);
	}
	
	updatePlayerImg(image) {
		var filepath = 'client/assets/images/'
		this.elem.src = filepath + image;
		this.image = image;	// Maybe have to remove this if we struggle changing player image multiple times
	}

	update() {
		if (this.elem) {
			this.elem.style.transform = `rotate(${this.rotation}rad)`;

		}
		
		if (typeof window == "undefined") { // This logic is to only run on the server
			for (var i in this.level.gameobjects) {
				var obj = this.level.gameobjects[i];

				if ( !this.holdingBall && obj instanceof Point && obj.pos.distance(this.pos) < 0.5) {
					obj.remove();
					this.holdingBall = true;
					this.holdingBallChanged = true;	// This is only server side, client side info doesn't change
				}
			}
		}
	}
	
	updateStats(wins, kills, points){
		this.wins += wins;
		this.kills += kills;
		this.points += points;
	}

	toJSON() {
		return {
		pos:this.pos,
		rot:this.rotation,
		vel: this.velocity,
		id: this.id};
	}
}

class Point extends GameObject {
	constructor(pos, rotation, level) {
		super(pos, rotation);
		this.level = level;
	}
}

class BallSpawnPoint extends GameObject {
	constructor(pos, level) {
		super(pos, 0, 0);
		this.level = level;
		this.hasBall = false;
	}
}

function serverExports() {
	exports.GameObject = GameObject;
	exports.Player = Player;
	exports.Point = Point;
	exports.BallSpawnPoint = BallSpawnPoint;
}

function clientExports() {
	gameobjects = {};
	gameobjects.GameObject = GameObject;
	gameobjects.Player = Player;
	gameobjects.Point = Point;
	gameobjects.BallSpawnPoint = BallSpawnPoint;
}

serverExports();
clientExports();