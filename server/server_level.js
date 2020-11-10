const SERVER = true;
const CLIENT = !SERVER;

var util = require('../common/util.js');
var fs = require('fs');

class GameLevel {
	constructor(id) {
		this.id = id;

		this.gameobjects = [];
		this.newobjects = []; // To allow the server to determine when it needs to send information about a new object to the client, and to allow the client to render new objects
		this.removedobjects = [];

		this.objectcounter = 0; // Used to create a unique id for each object, objects created client-side should use this * -1

		/* Each chunk is stored as an array of JSON objects with keys from their coordinates (e.g. "0,0")
		Within each chunk, the tiles are also JSON objects, with the structure {id:0,layer:0,isTransition:false} */
		this.newChunks = [];
		this.chunks = {};
		this.chunkElems = [];
		
		this.blue = [];
		this.red = [];
	}

	update() {
		for (let i=0; i<this.gameobjects.length; i++) {
			var obj = this.gameobjects[i];
			var toremove = [];

			if (obj.removed) {
				toremove.push(obj);
				continue;
			}

			this.gameobjects[i].update();
		}

		for (let i=0; i<toremove; i++) {
			if (this.gameobjects.indexOf(this.toremove[i]) != -1) {
				this.gameobjects.splice(this.gameobjects.indexOf(i));
				this.removedobjects.push(this.toremove[i]);
			}

		}

		// Move all chunks from newChunks to chunks ignoring undefined chunks
		while (this.newChunks.length > 0) {
			let currChunk = this.newChunks.pop();
			if (currChunk.chunk != undefined)
				this.chunks[currChunk.id] = currChunk.chunk;
		}
	}

	addObject(obj) {
		var exists = false;
		for (var i in this.newobjects)
			if (this.newobjects[i] == obj )
				exists = true;

		for (var i in this.gameobjects)
			if (this.gameobjects[i] == obj)
				exists = true;

		if (!exists) {
			this.gameobjects.push(obj);
			this.newobjects.push(obj);

			if (obj.id === undefined) {
				obj.id = this.objectcounter;
				this.objectcounter++;
			}
		}
	}

	removeObject(obj) {
		obj.removed = true;
	}


	addChunk(id, chunk) {
		this.newChunks.push({'id':id,'chunk':chunk});
	}
	addChunkUndef(id) {
		this.chunks[id] = "null";
	}
	clearChunks() {
		this.newChunks = [];
		this.chunks = {};
	}

	loadChunksAround(player, chunkRadius) {
		var x = player.pos[0];
		var y = player.pos[1];

		var lx = x - chunkRadius*chunkSize;
		var rx = x + chunkRadius*chunkSize;
		var ty = y - chunkRadius*chunkSize;
		var by = y + chunkRadius*chunkSize;

		for (var y=ty; y<by; y+=chunkSize) {
			for (var x=lx; x<rx; x+=chunkSize) {
				var cx = Math.floor(x/chunkSize);
				var cy = Math.floor(y/chunkSize);

				if (this.chunks[genChunkId(cx, cy)] == undefined || this.chunks[genChunkId(cx, cy)] == null) {
					loadChunk(cx, cy);
				}
			}
		}
	}

	unloadChunks(player, notInRadius) {
		var x = player.pos[0];
		var y = player.pos[1];

		var lx = x - notInRadius*chunkSize;
		var rx = x + notInRadius*chunkSize;
		var ty = y - notInRadius*chunkSize;
		var by = y + notInRadius*chunkSize;

		var notInRange = (n, lb, ub) => {
			return lb > n || ub < n;
		};

		for (var i in this.chunks) {
			if (this.chunks[i] == "null") continue;

			var cPos = fromChunkId(i);
			if (notInRange(cPos[0], lx, rx) || notInRange(cPos[1], ty, by)) {
				delete this.chunks[i];
				for (var j in this.chunkElems) {
					if (this.chunkElems[j].id == i)
						this.chunkElems[j].parentNode.removeChild(this.chunkElems[j]);
				}
			}
		}
	}

	// Position the world relative to the player
	render(player) {
		if (this.chunkElems == [] || SERVER) return;

		var pos = player.pos;

		for (var i=0; i<this.chunkElems.length; i++) {
			var cPos = fromChunkId(this.chunkElems[i].id);

			var wPos = {};
			wPos.x = cPos[0]*chunkSize;
			wPos.y = cPos[1]*chunkSize;

			var sPos = {};
			sPos.x = (wPos.x-pos[0]) * zoomLevel + world.clientWidth/2;
			sPos.y = (wPos.y-pos[1]) * zoomLevel + world.clientHeight/2;

			this.chunkElems[i].style.left = sPos.x + "px";
			this.chunkElems[i].style.top = sPos.y + "px";
		}
	}

	// Load a world from a JSON file (server only)
	loadFromFile(JSONFile) {
		if (CLIENT) return;

		var data = JSON.parse(util.removeCommentsFromJSON(fs.readFileSync(JSONFile)));

		this.spawnpos = data.spawnpos;

		for (var c in data.chunks)
			this.addChunk(c, data.chunks[c]);
	}

	// Random extra thing only used by server
	setInfo(data) {
		this.spawnpos = data.spawnpos;
		// There will probably be a lot more here
	}

	// Find a GameObject given its id
	findObject(id) {
		for (var i in this.gameobjects) {
			if (this.gameobjects[i].id == id) {
				return this.gameobjects[i].id;
			}
		}

		return null;
	}
}

exports.GameLevel = GameLevel;