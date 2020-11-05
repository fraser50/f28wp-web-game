class GameObject {
	constructor(pos, rotation, velocity) {
		this.id = undefined; // This will be populated when added to a level

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
	constructor(pos, rotation, level, velocity, id, isGuest) {
		super(pos, rotation, level);
		//this.id = socket.id;
		if (!this.id) {
			this.id = id;
		}
		this.wins = 0;
		this.kills = 0;
		this.points = 0;
		this.zPos = 5;
		this.isGuest = isGuest;
	}
	
	addToPage() {
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
	
	removeOtherPlayer() {
		var player = document.getElementById(this.id);
		objects.removeChild(player);
	}

	update() {
		if (this.elem) {
			this.elem.style.transform = `rotate(${this.rotation}rad)`;
		}
	}
	
	updateStats(wins, kills, points){
		this.wins += wins;
		this.kills += kills;
		this.points += points;
	}

	toJSON() {
		return {
			pos: this.pos,
			rot: this.rotation,
			vel: this.velocity,

			id: this.id
		}
	}
}

class Point extends GameObject {
	constructor(pos, rotation, level) {
		this.velocity = velocity;
		this.zPos = 4; //z index of points are one below player so player can run over points if already carrying ball
	}
}

exports.GameObject = GameObject;
exports.Player = Player;
exports.Point = Point;