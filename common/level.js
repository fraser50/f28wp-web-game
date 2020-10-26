class GameLevel {
	constructor(id) {
		this.id = id;

		this.gameobjects = [];
		this.newobjects = []; // To allow the server to determine when it needs to send information about a new object to the client, and to allow the client to render new objects
		this.removedobjects = [];

		/* Each chunk is stored as an array of JSON objects with keys from their coordinates (e.g. "0,0")
		Within each chunk, the tiles are also JSON objects, with the structure {id:0,layer:0,isTransition:false} */
		this.newChunks = [];
		this.chunks = {};
		this.chunkElems = [];
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
		this.gameobjects.push(obj);
		this.newobjects.push(obj);
	}

	removeObject(obj) {
		obj.removed = true;
	}


	addChunk(id, chunk) {
		this.newChunks.push({'id':id,'chunk':chunk});
	}
	clearChunks() {
		this.newChunks = [];
		this.chunks = {};
	}

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
}
