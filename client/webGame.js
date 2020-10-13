var socketPath = window.location.pathname + "socket.io";
var socket = io({path: socketPath});

// JSON object that stores every type of tile as JSON objects (e.g. {src:"/assets/images/thingy.png"})
var blockTypes = {}; // Do not edit this, edit it in the server instead

var gamearea = document.createElement("div");
gamearea.id = "gamearea";

// Create a div element to store all UI elements
var ui = document.createElement("div");
ui.id = "ui";

var world = document.createElement("div");
world.id = "world";

var objects = document.createElement("div");
objects.id = "objects";


// Add the elements to the page when it finishes loading
window.addEventListener("load", () => {
	socket.emit('getblocktypes');

	document.body.appendChild(gamearea);

	gamearea.appendChild(ui);
	gamearea.appendChild(world);
	gamearea.appendChild(objects);
	

//	testData = {
//			user: "testUser2",
//			pass: "testPass2"
//	};
//
//	socket.emit('addUser', testData);
//
//	socket.on('addUser', (data) => {		//THIS IS COOL TEST STUFF (FOR SIGN UP/ LOG IN/ GUEST)
//		alert(data.message);
//	});
});

socket.on('getblocktypes', (dataStr) => {
	var data = JSON.parse(dataStr);
	blockTypes = data;
});

// Temporary variable to store the current level. Definitly change the way this works
var currentLevel = new GameLevel(0);

// Load a chunk from the server and add it to the current level
function loadChunk(cx, cy) {
	if (cx == undefined || cy == undefined) return;
	socket.emit('getchunk', JSON.stringify({'x':cx,'y':cy,'level':currentLevel.id}));
}
socket.on('getchunk', (dataStr) => {
	var data = JSON.parse(dataStr);
	currentLevel.addChunk(genChunkId(data.x, data.y), data.tiles);
});


// Test variables (global to allow modification from the console)
var testWindow;
var testLabel;
var testLabel2;
var testLabel3;
var testButton;

// Function to test the loading and rendering of chunks and UI elements
function test() {
	// Chunk tests
	loadChunk(0,0);
	loadChunk(1,0);
	setTimeout(() => {
		currentLevel.update();
		createWorld(currentLevel);
	}, 1000);

	// UI tests
	testWindow = new UiWindow("testwindow", 20, 20, "bl", 400, 250);
	testLabel = new UiLabel("testlabel", 5, 5, "tl", "asdf", "16px monospace");
	testLabel2 = new UiLabel("testlabel2", 5, 5, "tr", "tr test", "16px monospace");
	testLabel3 = new UiLabel("testlabel2", 5, 5, "bl", "bottom text", "16px Impact");
	testButton = new UiButton("testbutton", 5, 5, "br", null, null, "Hide window for 2s", "15px sans-serif", () => {testWindow.hide(); setTimeout(() => {testWindow.show()}, 2000)});

	testWindow.addObject(testLabel);
	testWindow.addObject(testLabel2);
	testWindow.addObject(testLabel3);
	testWindow.addObject(testButton);
	testWindow.addToPage();

	testLabel.updateValue("yeetus"); // Try updating the value after it has been added to the page
}

// Run the tests 200ms after the page loads
window.addEventListener("load", () => {
	setTimeout(test, 200);
});
