var ui = document.createElement("div");
ui.id = "ui";

var world = document.createElement("div");
world.id = "world";

var blockTypes = null;
var tilesFolder = "../client/assets/images/tiles/";

var selectedType = {};

var worldProperties = {};
var chunks = {};

var cameraPos = [0, 0];
var cameraVel = [0, 0];
var cameraVelMax = 0.12;

var disableMovement = false;

var typeReader = new FileReader();

typeReader.onload = (e) => {
	blockTypes = JSON.parse(removeCommentsFromJSON(e.target.result));

	// blockTypes[0] = {"src": null, "name": "Null"};

	typeInput.disabled = true;
	fileWindow.hide();

	var addType = (i) => {
		var container = new UiContainer("", null, null, "tl", 200, 64);
		if (blockTypes[i].src)
			container.addObject(new UiImage("", 0, 0, "tl", null, 64, tilesFolder + blockTypes[i].src));
		else
			container.addObject(new UiImage("", 0, 0, "tl", null, 64, "null_inv.png"));

		var name = blockTypes[i].name ? blockTypes[i].name : blockTypes[i].src;
		container.addObject(new UiLabel("", 75, 1, "tl", name, "13px sans-serif", null));
		container.addObject(new UiButton("", 75, 35, "tl", null, null, "Select", "13px sans-serif", () => {
			if (selectedType.id != i) {
				selectedType.type = "tile";
				selectedType.id = i;
				if (blockTypes[i].src)
					selectedImg.setSrc(tilesFolder + blockTypes[i].src);
				else
					selectedImg.setSrc(null);
				selectedLabel.updateValue("Selected (tile): " + name);
				console.info("Selected (tile): ", name, `(${i})`);
			}
		}));

		tileContainer.addObject(container);

		container.elem.className = "typeContainer";
		container.elem.style.position = "relative";
	};

	for (var i in blockTypes) {
		addType(i);
	}

	menuWindow.show();
};

var typeInput = document.createElement("input");
typeInput.type = "file";
typeInput.accept = "application/json";

typeInput.addEventListener("change", (e) => {
	typeReader.readAsText(typeInput.files[0], "UTF-8");
});

var levelReader = new FileReader();

levelReader.onload = (e) => {
	var data = JSON.parse(removeCommentsFromJSON(e.target.result));

	initNewWorld();

	if (data.chunks) {
		chunks = data.chunks;
		for (var cId in data.chunks)
			addChunkToList(cId);
	} else
		throw new TypeError("Tried to load invalid world");

	if (data.name)
		worldProperties.name = data.name;
	else
		worldProperties.name = "No name";

	if (data.spawnpos)
		worldProperties.spawnpos = data.spawnpos;
	else
		console.warn("Opened world has no spawn point set (if spawn points use GameObjects, ignore this)");

	worldPropertiesButton.enable();
	console.info(`Loaded world "${data.name}" successfully`);

	renderWorld();
};

var levelInput = document.createElement("input")
levelInput.type = "file";
levelInput.accept = "application/json";

levelInput.addEventListener("change", (e) => {
	levelReader.readAsText(levelInput.files[0], "UTF-8");
});

var fileWindow;
var menuWindow;
var worldPropertiesWindow;

var posWindow;
var posLabel;
var posChunk;

var tileWindow;
var tileContainer;

var chunkListWindow;
var chunkListContainer;

var selectedImg;
var selectedLabel;

var worldPropertiesButton;
var worldSaveButton;

window.addEventListener("load", () => {
	document.body.appendChild(ui);
	document.body.appendChild(world);

	menuWindow = new UiWindow("menuWindow", 0, 0, "cc", 400, 500);
	menuWindow.addObject(new UiLabel("", 10, 10, "tl", "Menu", "16px sans-serif"));

	menuWindow.addObject(new UiLabel("", 10, 38, "tl", "Open world", "14px sans-serif"));
	var levelContainer = new UiContainer("levelContainer", 10, 55, "tl", 380, 30);
	menuWindow.addObject(levelContainer);

	menuWindow.addObject(new UiButton("newWorldButton", 10, 95, "tl", null, null, "New world", "14px sans-serif", () => {
		initNewWorld();
		menuWindow.hide();
		worldPropertiesButton.enable();
	}));

	worldSaveButton = new UiButton("worldSaveButton", 10, 135, "tl", null, null, "Save world", "14px sans-serif", () => {
		saveWorld();
	});
	menuWindow.addObject(worldSaveButton);

	worldPropertiesButton = new UiButton("worldPropertiesButton", 10, 10, "tr", null, null, "World properties", "14px sans-serif", () => {
		menuWindow.hide();
		worldPropertiesWindow.show();

		worldPropertiesNameInput.updateValue(worldProperties.name);
		worldPropertiesSpawnInput.updateValue(worldProperties.spawnpos);
	});
	worldPropertiesButton.disable();
	menuWindow.addObject(worldPropertiesButton);

	menuWindow.hide();
	menuWindow.addToPage();
	levelContainer.elem.appendChild(levelInput);

	var openMenuWindow = new UiWindow("openMenuWindow", 20, 20, "tr", 64, 48);
	openMenuWindow.addObject(new UiButton("openMenuButton", 0, 0, "tl", 64, 48, "Menu", "14px sans-serif", () => {
		if (!blockTypes) return;
		menuWindow.toggleVisibility();
	}));
	openMenuWindow.addToPage();

	worldPropertiesWindow = new UiWindow("worldPropertiesWindow", 0, 0, "cc", 400, 500);
	worldPropertiesWindow.addObject(new UiLabel("", 10, 10, "tl", "World Properties", "16px sans-serif"));

	worldPropertiesWindow.addObject(new UiButton("", 10, 10, "tr", null, null, "Back to menu", "14px sans-serif", () => {
		worldPropertiesWindow.hide();
		menuWindow.show();
	}));

	var worldPropertiesNameInput = new UiTextInput("worldPropertiesNameInput", 10, 45, "tl", 380, null, "World name");
	worldPropertiesWindow.addObject(worldPropertiesNameInput);

	var worldPropertiesSpawnInput = new UiTextInput("worldPropertiesSpawnInput", 10, 90, "tl", 380, null, "Spawn Position (e.g. 5,6)");
	worldPropertiesWindow.addObject(worldPropertiesSpawnInput);

	worldPropertiesWindow.hide();
	worldPropertiesWindow.addToPage();

	worldPropertiesNameInput.addEventListener("change", (e) => {
		worldProperties.name = worldPropertiesNameInput.getValue();
	});
	worldPropertiesNameInput.setMovementDisableEditor();

	worldPropertiesSpawnInput.addEventListener("change", (e) => {
		var arr = worldPropertiesSpawnInput.getValue().split(",");

		for (var i in arr) {
			var temp = arr[i].split(" ");
			worldProperties.spawnpos[i] = [parseFloat(temp[0]), parseFloat(temp[1])]
		}
		console.log(worldProperties.spawnpos)
	});
	worldPropertiesSpawnInput.setMovementDisableEditor();

	fileWindow = new UiWindow("fileWindow", 0, 0, "cc", 250, 58);
	fileWindow.addObject(new UiLabel("", 10, 7, "tl", "Select blocktypes.json", "14px sans-serif"));
	var typeContainer = new UiContainer("typeContainer", 10, 25, "tl", 240, 30);
	fileWindow.addObject(typeContainer);
	fileWindow.addToPage();
	typeContainer.elem.appendChild(typeInput);

	tileWindow = new UiWindow("tileWindow", 20, 0, "cl", 250, 500);
	tileContainer = new UiScrollContainer("tileContainer", 5, 5, "tl", 240, 421, true, false);
	tileWindow.addObject(tileContainer);
	selectedImg = new UiImage("selectedImg", 5, 5, "bl", null, 64, null);
	tileWindow.addObject(selectedImg);
	selectedLabel = new UiLabel("selectedLabel", 75, 456, "tl", "Selected: none", "13px sans-serif");
	tileWindow.addObject(selectedLabel);
	tileWindow.addToPage();

	chunkListWindow = new UiWindow("chunkListWindow", 20, 0, "cr", 250, 500);
	chunkListWindow.addObject(new UiLabel("", 5, 5, "tl", "Chunks", "16px sans-serif"));
	chunkListContainer = new UiScrollContainer("chunkListContainer", 5, 25, "tl", 240, 470, true, false);
	chunkListWindow.addObject(chunkListContainer);
	chunkListWindow.addToPage();

	posWindow = new UiWindow("posWindow", 94, 37, "cc", 160, 50);
	posLabel = new UiLabel("pos", 5, 5, "tl", "", "14px monospace");
	posChunk = new UiLabel("chunk", 5, 22, "tl", "", "14px monospace");
	posWindow.addObject(posLabel);
	posWindow.addObject(posChunk);
	posWindow.addToPage();
	posWindow.setOpacity(0.45);
	posWindow.win.style.zIndex = 9997;

	var crosshair = document.createElement("img");
	crosshair.src = "crosshair.png";
	crosshair.style.zIndex = 9998;
	crosshair.style.position = "absolute";
	crosshair.style.left = "calc(50% - 64px)";
	crosshair.style.top = "calc(50% - 64px)";
	ui.appendChild(crosshair);

	window.requestAnimationFrame(loop);
});

function saveWorld() {
	var data = {name:worldProperties.name, spawnpos:worldProperties.spawnpos, chunks:chunks};

	var file = new Blob([JSON.stringify(data)], {type: "application/json"});

	var a = document.createElement("a");
	a.href = URL.createObjectURL(file);
	a.download = "world.json";
	a.click();

	URL.revokeObjectURL(a.href);
}

function initNewWorld() {
	worldProperties = {name: "", spawnpos: [0, 0]};
	
	for (var cId in chunks)
		deleteChunk(fromChunkId(cId)[0], fromChunkId(cId)[1]);
}

var chunkSize = 16;

var zoomLevel = 4;
var texSize = zoomLevel*16; // Different from texSize on client

function renderWorld() {
	for (var cId in chunks) {
		if (world.querySelector("#" + cId))
			world.removeChild(world.querySelector("#" + cId));

		var chunkElem = document.createElement("div");
		chunkElem.id = cId;

		chunkElem.style.width = chunkSize * texSize + "px";
		chunkElem.style.height = chunkSize * texSize + "px";

		var chunk = chunks[cId];

		for (var t=0; t<chunkSize**2; t++) {
			var tileElem = document.createElement("img");

			if (blockTypes[chunk[t].id].src)
				tileElem.src = tilesFolder + blockTypes[chunk[t].id].src;
			else
				tileElem.src = "null.png";

			tileElem.width = texSize;
			tileElem.height = texSize;

			if (chunk[t].isWall)
				tileElem.className = "tileWall";
			
			if (chunk[t].isBluebase)		//Nothing really done with these two yet (just here in case it is necessary probably isn't though)
				tileElem.className = "bluebase";
			
			if (chunk[t].isRedbase)
				tileElem.className = "redbase"

			chunkElem.appendChild(tileElem);
		}

		world.appendChild(chunkElem);
	}
	updateWorld();
}

var frametime = 0;
var thisLoop;
var lastLoop;

function loop() {
	thisLoop = new Date();
	frametime = thisLoop - lastLoop;

	doMovement();

	updateGrid();
	updateWorld();
	updateUI();

	if (!disableMovement && keyStates.place.pressed && selectedType.type == "tile") {
		setTileAt(-cameraPos[0]/(texSize/zoomLevel), -cameraPos[1]/(texSize/zoomLevel), selectedType.id, keyStates.shift.pressed);
		renderWorld();
	}

	lastLoop = thisLoop;
	window.requestAnimationFrame(loop);
}

function doMovement() {
	if (disableMovement) return;

	if (keyStates.up.pressed)
		cameraVel[1] += cameraVelMax;
	if (keyStates.down.pressed)
		cameraVel[1] -= cameraVelMax;

	if (keyStates.left.pressed)
		cameraVel[0] += cameraVelMax;
	if (keyStates.right.pressed)
		cameraVel[0] -= cameraVelMax;

	if (!keyStates.up.pressed && !keyStates.down.pressed)
		cameraVel[1] = 0;
	if (!keyStates.left.pressed && !keyStates.right.pressed)
		cameraVel[0] = 0;

	frametime = isNaN(frametime) ? 0 : frametime;

	var limit = (v, min, max) => {return Math.min(max, Math.max(min, v))};

	cameraVel[0] = limit(cameraVel[0], -cameraVelMax, cameraVelMax);
	cameraVel[1] = limit(cameraVel[1], -cameraVelMax, cameraVelMax);

	cameraPos[0] += cameraVel[0] * frametime;
	cameraPos[1] += cameraVel[1] * frametime;
}

function updateGrid() {
	ui.style.backgroundPositionX = (world.clientWidth/2 + cameraPos[0]*zoomLevel) + "px";
	ui.style.backgroundPositionY = (world.clientHeight/2 + cameraPos[1]*zoomLevel) + "px";
}

function updateWorld() {
	for (var i=0; i<world.childNodes.length; i++) {
		var chunk = world.childNodes[i];
		var cPos = fromChunkId(chunk.id);

		chunk.style.left = world.clientWidth/2 + cPos[0]*texSize*chunkSize + cameraPos[0]*zoomLevel + "px";
		chunk.style.top = world.clientHeight/2 + cPos[1]*texSize*chunkSize + cameraPos[1]*zoomLevel + "px";
	}
}

function updateUI() {
	posLabel.updateValue(`X: ${roundNumber(-cameraPos[0]/(texSize/zoomLevel), 1)}, Y: ${roundNumber(-cameraPos[1]/(texSize/zoomLevel), 1)}`);
	posChunk.updateValue(`CX: ${Math.floor((-cameraPos[0]/(texSize/zoomLevel))/16)}, CY: ${Math.floor((-cameraPos[1]/(texSize/zoomLevel))/16)}`)
}

function setTileAt(x, y, tileId, isWall) {
	var cx = Math.floor((-cameraPos[0]/(texSize/zoomLevel))/16);
	var cy = Math.floor((-cameraPos[1]/(texSize/zoomLevel))/16);

	var chunk = initNewChunk(cx, cy);

	var t = (Math.floor(y - cy*chunkSize))*chunkSize + (Math.floor(x - cx*chunkSize));

	chunk[t] = {id:tileId};
	if (isWall)
		chunk[t].isWall = true;
	
	if (tileId == 110 || tileId == 111) 		// Checks to see if tileId is one of the ones that is for the bluebase, will need to update if statement if more get added
		chunk[t].isBluebase = true;
	
	if (tileId == 115 || tileId == 116) 		// Checks to see if tileId is one of the ones that is for the redbase, will need to update if statement if more get added
		chunk[t].isRedbase = true;
	
}

function initNewChunk(cx, cy) {
	var cId = genChunkId(cx, cy);

	if (chunks[cId]) return chunks[cId];

	chunks[cId] = [];

	for (var t=0; t<chunkSize**2; t++) {
		chunks[cId].push({id:0});
	}

	addChunkToList(cId);

	return chunks[cId];
}

function addChunkToList(cId) {
	var cPos = fromChunkId(cId);
	var chunkListElem = new UiContainer(cId, null, null, "tl", 200, 32);
	chunkListElem.addObject(new UiLabel("", 12, 5, "tl", `${cPos[0]}, ${cPos[1]}`, "14px monospace"));
	chunkListElem.addObject(new UiButton("", 0, 0, "tr", null, null, "Delete", "14px sans-serif", () => {
		deleteChunk(fromChunkId(cId)[0], fromChunkId(cId)[1]);
		console.info("Deleted chunk", cId);
	}));

	chunkListContainer.addObject(chunkListElem);

	chunkListElem.elem.style.position = "relative";
}

function deleteChunk(cx, cy) {
	var cId = genChunkId(cx, cy);

	if (!chunks[cId]) return;

	delete chunks[cId];
	world.removeChild(world.querySelector("#" + cId));

	chunkListContainer.elem.removeChild(chunkListContainer.elem.querySelector("#" + cId));
}

var keyStates = {
	up: {code: 87},
	down: {code: 83},
	left: {code: 65},
	right: {code: 68},

	place: {code: 32},
	shift: {code: 16}
}

window.addEventListener("keydown", (e) => {
	// console.debug(e.keyCode);
	for (var k in keyStates) {
		if (keyStates[k].code == e.keyCode)
			keyStates[k].pressed = true;
	}
});
window.addEventListener("keyup", (e) => {
	// console.debug(e.keyCode);
	for (var k in keyStates) {
		if (keyStates[k].code == e.keyCode)
			keyStates[k].pressed = false;
	}
});
