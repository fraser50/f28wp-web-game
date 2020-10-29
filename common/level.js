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

	loadChunksAround(player, chunkRadius) {
		var x = player.pos[0];
		var y = player.pos[1];

		var lx = x - chunkRadius*chunkSize;
		var rx = x + chunkRadius*chunkSize;
		var ty = y - chunkRadius*chunkSize;
		var by = y + chunkRadius*chunkSize;

		console.info(lx, rx, ty, by);

		for (var y=ty; y<by; y+=chunkSize) {
			for (var x=lx; x<rx; x+=chunkSize) {
				var cx = Math.floor(x/chunkSize);
				var cy = Math.floor(y/chunkSize);

				console.info("cload", cx, cy);

				loadChunk(cx, cy);
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

		console.info(lx, rx, ty, by);

		var notInRange = (n, lb, ub) => {
			return lb > n || ub < n;
		};

		for (var i in this.chunks) {
			console.info(i);
			var cPos = fromChunkId(i);
			if (notInRange(cPos[0], lx, rx) || notInRange(cPos[1], ty, by)) {
				console.info("not in range");
				delete this.chunks[i];
				for (var j in this.chunkElems) {
					console.info("chunkElem", j);
					if (this.chunkElems[j].id == i)
						this.chunkElems[j].parentNode.removeChild(this.chunkElems[j]);
				}
			}
		}
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

	loadFromFile(JSONFile) {
		if (CLIENT) return;

		var data = JSON.parse(fs.readFileSync(JSONFile));

		this.spawnpos = data.spawnpos;

		for (var c in data.chunks)
			this.addChunk(c, data.chunks[c]);
	}

	setInfo(data) {
		this.spawnpos = data.spawnpos;
		// There will probably be a lot more here
	}
}
