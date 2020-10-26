var socketPath = window.location.pathname + "socket.io";
var socket = io({path: socketPath});

// Constants for shared files to know if they are running on the client or the server
const SERVER = false;
const CLIENT = !SERVER;

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

var userDetails = {
	name: null,
	loginSuccess: false
};

var chatSendButton;
var frametimeLabel;
var frametimeGraph;
var fpsLabel;

// Add the elements to the page when it finishes loading
window.addEventListener("load", () => {
	socket.emit('getblocktypes');

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
	
	
	signedInWindow = new UiWindow("signedInWindow", 20, 20, "tl", 100, 40);
	signedInButton = new UiButton("signedInButton", 0, 0, "tl", 100, 40, "Signed in as: " + userDetails.name, "", () => {
		if (userWindow.hidden == true) {
			getUserStatVals();
			userWindow.show();
		} else {
			userWindow.hide();
		}
	})
	signedInWindow.addObject(signedInButton);
	signedInWindow.addToPage();
	signedInWindow.hide();
	
	// User details window, initially hidden
	
	userWindow = generateUserWindow(socket);
	userWindow.addToPage();
	userWindow.hide();
	
	// Chat window

	var chatWindow = new UiWindow("chatWindow", 20, 20, "tr", 400, 150);

	var chatScrollContainer = new UiScrollContainer("chatScrollContainer", 5, 5, "tl", 390, 110, true);
	chatWindow.addObject(chatScrollContainer);

	var chatInput = new UiTextInput("chatInput", 5, 5, "bl", 345, null, "Chat");
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



	var perfWindow = new UiWindow("perfWindow", 20, 20, "br", 400, 200);

	frametimeLabel = new UiLabel("perfFrametime", 5, 5, "tl", "", "15px sans-serif", "white");
	perfWindow.addObject(frametimeLabel);

	frametimeGraph = new UiGraph("perfFrametimeGraph", 5, 40, "tl", 300, 100, 150, "red");
	perfWindow.addObject(frametimeGraph);

	fpsLabel = new UiLabel("perfFPS", 5, 20, "tl", "", "15px sans-serif", "white");
	perfWindow.addObject(fpsLabel);

	perfWindow.addToPage();


	
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
		

	// testData = {
	// 		user: "testUser2",
	// 		pass: "testPass2"
	// };

	// socket.emit('addUser', testData);

	// socket.on('addUser', (data) => {		//THIS IS COOL TEST STUFF (FOR SIGN UP/ LOG IN/ GUEST)
	// 	alert(data.message);
	// });
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
	loadChunk(69, 69); // Try loading non-existent chunk
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

function createPlayer(socket, user) {	//This relates to the gameobjects.js Player class rather than player_and_hitbox.js. Need to get a name assignment sorted out
	socket.player = new Player(user, "green", 100, 100);
	console.log(socket.player);
};
// Run the tests 200ms after the page loads
// window.addEventListener("load", () => {
// 	setTimeout(test, 200);
// });
