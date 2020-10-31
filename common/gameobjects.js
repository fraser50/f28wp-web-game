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
