elementbuilders = [ // A new function will be placed here for creating the elements for different kinds of objects in the game
	[Player, function(obj) {
		var e = document.createElement("img");
		e.style.top = 0;
		e.style.left = 0;
		e.src = "client/assets/images/temp_player.png"
		return e;
	}],

	[Point, function(obj) {
		var e = document.createElement("img");
		e.style.top = 0;
		e.style.left = 0;
		e.src = "client/assets/images/point.png"
		return e;
	}]
]

objectelements = [] // Please don't mess with this manually, modify one of the functions below

function setElementPosition(element, pos) {
	console.log('element below:');
	console.log(element);
	//element.style.left = pos.x;
	//element.style.top  = pos.y;
	element.style = "position:absolute; width:64px; height:64px; left:" + pos.x + "px; top:" + pos.y + "px;";
}

function render(level) {
	// Adding objects
	for (let i=0; i<level.newobjects.length; i++) {
		if (objectelements.indexOf(level.newobjects[i]) != -1) {
			// This code should never be called, if it is, a warning will be printed to the console
			console.log('WARNING: A new object that was already added to the screen was found!');
			console.log(objectelements);
			continue;
		}

		var newobj = level.newobjects[i];

		for (let j=0; j<elementbuilders.length; j++) {
			if (newobj instanceof elementbuilders[j][0]) {
				newelement = elementbuilders[j][1](newobj);
				setElementPosition(newelement, newobj.pos);
				var gamearea = document.getElementById("gamearea");
				gamearea.appendChild(newelement);

				objectelements.push(newobj);
				objectelements.push(newelement);
				break;

			}
		}

	}

	// Removing objects
	for (let i=0; i<level.removedobjects.length; i++) {
		var removedobj = level.removedobj[i];
		var objindex = objectelements.indexOf(removedobj);
		if (objindex == -1) {
			console.log("WARNING: Object was already removed!");
			continue;

		} else {
			var gamearea = document.getElementById("gamearea");
			gamearea.removeChild(objectelements[objindex + 1]);
			objectelements.splice(objindex, 2);
		}
	}

	// Rendering objects
	for (let i=0; i<objectelements.length-1; i += 2) {
		var obj = objectelements[i];

		if (obj.pos.changed) {
			setElementPosition(objectelements[i + 1], obj.pos);
			obj.pos.changed = false;
		}

	}

	level.newobjects.splice(0, level.newobjects.length);
	level.removedobjects.splice(0, level.removedobjects.length);

}

var texSize = 16;

var zoomLevel = 6*texSize; // Change to scale the world

var chunkSize = 16;

function createWorld(level, replace) {
	var keys = Object.keys(level.chunks);
	for (var i=0; i<keys.length; i++) {
		var chunk = level.chunks[keys[i]];
		if (chunk == undefined) {
			console.log("Tried to render undefined chunk " + keys[i], chunk);
			continue;
		}
		if (chunk == "null") continue;

		// If chunk is already rendered (return if replace = false)
		if (world.querySelector("#"+keys[i]) != undefined)
			if (replace)
				world.removeChild(world.querySelector("#"+keys[i]));
			else
				return;

		var chunkElem = document.createElement("div");
		chunkElem.id = keys[i];

		chunkElem.style.width = (zoomLevel*chunkSize).toString() + "px";
		chunkElem.style.height = (zoomLevel*chunkSize).toString() + "px";

		var chunkPos = fromChunkId(keys[i]);
		chunkElem.style.left = (zoomLevel*chunkSize)*chunkPos[0] + "px";
		chunkElem.style.top = (zoomLevel*chunkSize)*chunkPos[1] + "px";

		for (var t=0; t<chunkSize**2; t++) {
			var tile = chunk[t];

			if (tile.id == 0) continue;

			var tileElem = document.createElement("img");
			tileElem.id = genTileImageId(t);
			tileElem.className = "tileImg";

			tileElem.src = tilesFolder + blockTypes[tile.id].src;

			tileElem.width = zoomLevel;
			tileElem.height = zoomLevel;

			var wx = chunkPos[0]*chunkSize + (t % chunkSize);
			var wy = chunkPos[1]*chunkSize + Math.floor(t/chunkSize);

			var x = (t % chunkSize)*zoomLevel;
			var y = Math.floor(t/chunkSize)*zoomLevel;

			tileElem.style.left = x + "px";
			tileElem.style.top = y + "px";

			chunkElem.appendChild(tileElem);

			/* Old shadow code
			if (tile.isWall) {
				tileElem.style.zIndex = 3;
				var shadowElem = document.createElement("img");
				shadowElem.className = "tileImg tileShadow";
				shadowElem.src = tilesFolder + "tile_shadow_4x.png";

				shadowElem.style.left = (x-4) + "px";
				shadowElem.style.top = (y-4) + "px";

				chunkElem.appendChild(shadowElem);
			} */

			if (tile.isWall) {
				tileElem.style.zIndex = 3;

				var imgPrefix = tilesFolder + "tile_shadow_";

				var sx = (x-zoomLevel) + "px";
				var sy = (y-zoomLevel) + "px";

				var addShadow = (side) => {
					var shadowElem = document.createElement("img");
					shadowElem.className = "tileImg tileShadow";
					shadowElem.src = imgPrefix + side + ".png";

					shadowElem.style.left = sx;
					shadowElem.style.top = sy;

					shadowElem.width = zoomLevel*3;
					shadowElem.height = zoomLevel*3;

					chunkElem.appendChild(shadowElem);
				};

				// If there is no wall to the left
				// if (chunk[t-1] && !chunk[t-1].isWall)
				var lt = getTileAt(level, wx-1, wy);
				if (lt && !lt.isWall)
					addShadow("left");

				// If there is no wall to the right
				// if (chunk[t+1] && !chunk[t+1].isWall)
				var rt = getTileAt(level, wx+1, wy);
				if (rt && !rt.isWall)
					addShadow("right");

				// If there is no wall above
				// if (chunk[t-chunkSize] && !chunk[t-chunkSize].isWall)
				var ut = getTileAt(level, wx, wy-1);
				if (ut && !ut.isWall)
					addShadow("up");

				// If there is no wall below
				// if (chunk[t+chunkSize] && !chunk[t+chunkSize].isWall)
				var bt = getTileAt(level, wx, wy+1);
				if (bt && !bt.isWall)
					addShadow("down");
			}
		}

		world.appendChild(chunkElem);

		level.chunkElems.push(chunkElem);
	}
};
