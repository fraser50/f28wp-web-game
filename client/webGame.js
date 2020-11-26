/*
Copyright (c) 2020 fraser50, mta2k00, blast1113, dr62, frg2
This work is licensed under the MIT license which can be found in the LICENSE file in the root of the project.
*/

var socketPath = window.location.pathname + "socket.io";
var socket = io({path: socketPath});

// Constants for shared files to know if they are running on the client or the server
const SERVER = false;
const CLIENT = !SERVER;


// JSON object that stores every type of tile as JSON objects (e.g. {src:"/assets/images/thingy.png"})
var blockTypes = {}; // Do not edit this, edit it in the server instead
var tilesFolder = "client/assets/images/tiles/";

var gamearea = document.createElement("div");
gamearea.id = "gamearea";

// Create a div element to store all UI elements
var ui = document.createElement("div");
ui.id = "ui";

var world = document.createElement("div");
world.id = "world";

var objects = document.createElement("div");
objects.id = "objects";

var userDetails = {
	name: null,
	loginSuccess: false
};

var chatSendButton;
var chatInput;
var frametimeLabel;
var frametimeGraph;
var fpsLabel;
var posLabel;
var velLabel;
var pingLabel;

var DISABLE_PERF = false; // Allows for disabling performance monitor ui

// Add the elements to the page when it finishes loading
window.addEventListener("load", () => {
	socket.emit('getLevelId');
	socket.on('returnLevelId', (data) => {
		currentLevel = new GameLevel(data.id);	// This will either be too slow or will not work as it creates a different level to the one provided in the server
		
		socket.emit('getblocktypes');
		socket.emit('getleveldata', {"id": currentLevel.id});
	});

	document.body.appendChild(gamearea);

	gamearea.appendChild(ui);
	gamearea.appendChild(world);
	gamearea.appendChild(objects);

	// Login window

	loginWindow = generateLoginWindow(socket);
	
	loginWindow.addToPage();
	
	
	
	logActivateWindow = new UiWindow("activateLogWindow",20,20,"tl",100,40);
	loginActivateButton = new UiButton("activateLogWindowButton", 0, 0, "tl", 100, 40, "Login/Sign Up", "", () => {
		if (loginWindow.hidden == true) {
			loginWindow.show();
		} else {
			loginWindow.hide();
		}
	})
	logActivateWindow.addObject(loginActivateButton);
	logActivateWindow.addToPage();
		
	// User details window, initially hidden
	
	userWindow = generateUserWindow(socket);
	userWindow.addToPage();
	userWindow.hide();
	
	// Leaderboard window, initially hidden
	
	var leaderboard = generateLeaderboard();
	leaderboard.addToPage();
	leaderboard.hide();
	
	// Chat window

	var chatWindow = new UiWindow("chatWindow", 20, 20, "tr", 400, 150);

	var chatScrollContainer = new UiScrollContainer("chatScrollContainer", 5, 5, "tl", 390, 110, true);
	chatWindow.addObject(chatScrollContainer);

	chatInput = new UiTextInput("chatInput", 5, 5, "bl", 345, null, "Chat");
	chatWindow.addObject(chatInput);

	var maxMessages = 10;

	chatSendButton = new UiButton("chatSendButton", 5, 5, "br", 40, null, "Send", "", () => {
		var message = chatInput.pop().substr(0, 200); // Limit the message length to 200 characters
		if (message.length == 0) return;
		var label = new UiLabel("", 0, 0, "s", "<" + userDetails.name + "> " + message, "14px sans-serif");
		if (!userDetails.loginSuccess) {
			label.updateValue("Not logged in");
			label.updateColor("red");
		} else {
			socket.emit('chatmessage', {'level':currentLevel.id, 'user':userDetails.name, 'message':message});
		}
		var elem = chatScrollContainer.elem;
		chatScrollContainer.addObject(label);
		elem.scrollTo(0, elem.scrollHeight);
		while (elem.childElementCount > maxMessages)
			elem.removeChild(elem.childNodes[0]);
	});
	chatSendButton.disable();
	chatWindow.addObject(chatSendButton);

	chatWindow.addToPage();

	// Performance stats window

	var perfWindow = new UiWindow("perfWindow", 20, 20, "br", 400, 185);

	if (!DISABLE_PERF){		
		frametimeLabel = new UiLabel("perfFrametime", 5, 5, "tl", "", "15px monospace", "white");
		perfWindow.addObject(frametimeLabel);
		
		frametimeGraph = new UiGraph("perfFrametimeGraph", 5, 40, "tl", 390, 100, 195, "red");
		perfWindow.addObject(frametimeGraph);
		
		fpsLabel = new UiLabel("perfFPS", 5, 20, "tl", "", "15px monospace", "white");
		perfWindow.addObject(fpsLabel);

		posLabel = new UiLabel("perfPos", 5, 145, "tl", "", "15px monospace", "white");
		perfWindow.addObject(posLabel);
		
		velLabel = new UiLabel("perfVel", 5, 165, "tl", "", "15px monospace", "white");
		perfWindow.addObject(velLabel);

	}

	loopStartButton = new UiButton("loopStartButton", 5, 5, "tr", null, null, "Join Match", null, () => {
		if (loopStartButton.loopRunning) {
			loopStartButton.loopRunning = false;
			stopLoop();
			stopServerLoop(currentLevel);
			loopStartButton.updateValue("Join Match");
			stopTimer();
		} else {
			loopStartButton.loopRunning = true;
			assignTeam(currentLevel);	//Assign to a team when start loop
			startLoop(currentLevel);
			startServerLoop(currentLevel);
			socket.emit('joinMatch', {levelId : currentLevel.id});
			loopStartButton.updateValue("Stop loop");
			startTimer();
		}
	});

	perfWindow.addObject(loopStartButton);

	if (!DISABLE_PERF) {
		pingLabel = new UiLabel("perfPing", 200, 12, "tl", "", "15px monospace");
		perfWindow.addObject(pingLabel);
	}
	

	perfWindow.addToPage();
	
	//This creates a timer that counts down from 60, should end up controlling the length of each match
	//Need to make count down more robust so tampering is not an issue and all clients timers are in sync
	//Need to create method to start timer on match start, end match when timer runs out
	var timerWindow = new UiWindow("timerWindow", 0, 20, "tc", 44.5, 45);
	var timer = new UiLabel("timer", 0, 0, "tl", 60, "40px sans-serif");
	timerWindow.addObject(timer);
	timerWindow.addToPage();
	timerWindow.setOpacity(0);

	function stopTimer() {
		var sec = 60;
		socket.off('updateTimer');	//Dont think this works
		timer.updateValue(sec);
	}
	
	function startTimer() {
		var sec = "Waiting for players";
		timer.updateValue(sec);
		
		socket.on('updateTimer', (data) => {
			sec = data;
			if (sec == "0") {
				console.log("Game Over");
			}
			timer.updateValue(sec);
		});
	}
		
	socket.on('chatmessage', (data) => {
		if (data.level != currentLevel.id) return;
		var label = new UiLabel("", 0, 0, "s", "<" + data.user + "> " + data.message, "14px sans-serif");
		var elem = chatScrollContainer.elem;
		chatScrollContainer.addObject(label);
		elem.scrollTo(0, elem.scrollHeight);
		while (elem.childElementCount > maxMessages)
			elem.removeChild(elem.childNodes[0]);
	});
	socket.on('chatmessagefail', (reason) => {
		var label = new UiLabel("", 0, 0, "s", reason, "14px sans-serif", "yellow");
		var elem = chatScrollContainer.elem;
		chatScrollContainer.addObject(label);
		elem.scrollTo(0, elem.scrollHeight);
		while (elem.childElementCount > maxMessages)
			elem.removeChild(elem.childNodes[0]);
	});
});

socket.on('getblocktypes', (dataStr) => {
	var data = JSON.parse(dataStr);
	blockTypes = data;
});

socket.on('getleveldata', (data) => {
	if (data)
		if (data.id == currentLevel.id) {
			currentLevel.setInfo(data);
		}
});

var ping = 0;

socket.on("pong", (time) => {
	ping = time;
});

function initWorld() {
	setInterval(() => {
		currentLevel.unloadChunks(socket.player, 5);
		currentLevel.loadChunksAround(socket.player, 3);
		currentLevel.update();
		createWorld(currentLevel);
		setTimeout(() => {
			currentLevel.render(socket.player);
		}, 100);
	}, 200);
}

// Load a chunk from the server and add it to the current level
function loadChunk(cx, cy) {
	if (cx == undefined || cy == undefined) return;
	socket.emit('getchunk', JSON.stringify({'x':cx,'y':cy,'level':currentLevel.id}));
}
socket.on('getchunk', (dataStr) => {
	var data = JSON.parse(dataStr);
	currentLevel.addChunk(genChunkId(data.x, data.y), data.tiles);
});
socket.on('getchunkundef', (data) => {
	currentLevel.addChunkUndef(data.id);
});

function createPlayer(socket, user, isGuest) {	//This relates to the gameobjects.js Player class rather than player_and_hitbox.js. Need to get a name assignment sorted out
	var clsp = currentLevel.spawnpos;

	socket.player = new Player(clsp == undefined ? new Position(0, 0) : new Position(clsp[0], clsp[1]), 0, 0, [0, 0], user, isGuest);
	socket.player.addToPage();
	console.log(user);
};

function removePlayer(socket, user) {
	socket.player.remove();
}
