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

var userDetails = {
	name: null,
	loginSuccess: false
};


// Add the elements to the page when it finishes loading
window.addEventListener("load", () => {
	socket.emit('getblocktypes');

	document.body.appendChild(gamearea);

	gamearea.appendChild(ui);
	gamearea.appendChild(world);
	gamearea.appendChild(objects);

	var loginWindow = new UiWindow("logsignform", 0, 0, "cc", 300, 355);

	loginWindow.addObject(new UiLabel("", 20, 20, "tl", "Please enter your username", "16px sans-serif"));
	var loginUserBox = new UiTextInput("loguserinput", 20, 45, "tl", 260, 40, "Username");
	loginWindow.addObject(loginUserBox);
	
	loginWindow.addObject(new UiLabel("", 20, 95, "tl", "Please enter your password", "16px sans-serif"));
	var loginPassBox = new UiTextInput("passinput", 20, 120, "tl", 260, 40, "Password", "password");
	loginWindow.addObject(loginPassBox);

	var loginButton = new UiButton("loginButton", 0, 205, "tc", 260, 60, "Login", "20px sans-serif", () => {
		if (loginUserBox.getValue() == "" || loginPassBox.getValue() == "") {
			alert("Username and password cannot be empty");
			return;
		}
		userDetails.name = loginUserBox.getValue();
		var data = {user: loginUserBox.getValue(), pass: loginPassBox.getValue()};
		socket.emit('login', data);
	});
	loginWindow.addObject(loginButton);

	var signupButton = new UiButton("signButton", 20, 275, "tl", 125, 60, "Sign Up", "20px sans-serif", () => {
		if (loginUserBox.getValue() == "" || loginPassBox.getValue() == "") {
			alert("Username and password cannot be empty");
			return;
		}
		userDetails.name = loginUserBox.getValue();
		var data = {user: loginUserBox.getValue(), pass: loginPassBox.getValue()};
		socket.emit('addUser', data);
	});
	loginWindow.addObject(signupButton);

	var guestButton = new UiButton("guestButton", 20, 275, "tr", 125, 60, "Login as guest", "20px sans-serif", () => {
		socket.emit('guest');
	});
	loginWindow.addObject(guestButton);
	
	loginWindow.addToPage();

	socket.on('addUser', (data) => {
		loginUserBox.clear();
		loginPassBox.clear();
		if (data.success == true) 
			loginWindow.hide();
			userDetails.loginSuccess = true;
		alert(data.message);
	});
	
	socket.on('login', (data) => {
		loginUserBox.clear();
		loginPassBox.clear();
		if (data.success == true) {
			loginWindow.hide();
			userDetails.loginSuccess = true;
		}
		alert(data.message);
	});
	
	socket.on('guest', (data) => {
		loginUserBox.clear();
		loginPassBox.clear();
		if (data.success == true) {
			loginWindow.hide();
			console.info(data);
			userDetails.name = genGuestName(data.userId);
			userDetails.loginSuccess = true;
		}
		alert(data.message);
	});
	
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

var testWindow2;
var testInput;
var testScrollContainer;

var testWindow3;
var testLabel4;
var testInput2;

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

	testWindow2 = new UiWindow("testwindow2", 20, 20, "tr", 400, 100);
	testScrollContainer = new UiScrollContainer("testscrollcontainer", 5, 5, "tl", 390, 60, true);
	testInput = new UiTextInput("testinput", 5, 5, "bl", 345, null, "Type here");
	var maxMessages = 6;
	testButton2 = new UiButton("testbutton2", 5, 5, "br", 40, null, "Send", "", () => {
		var message = testInput.pop().substr(0, 200); // Limit the message length to 200 characters
		var label = new UiLabel("", 0, 0, "s", "<" + userDetails.name + "> " + message, "14px sans-serif");
		if (!userDetails.loginSuccess) {
			label.updateValue("Not logged in");
			label.updateColor("red");
		} else {
			socket.emit('chatmessage', {'level':currentLevel.id, 'user':userDetails.name, 'message':message});
		}
		var elem = testScrollContainer.elem;
		testScrollContainer.addObject(label);
		elem.scrollTo(0, elem.scrollHeight);
		while (elem.childElementCount > maxMessages)
			elem.removeChild(elem.childNodes[0]);
	});

	socket.on('chatmessage', (data) => {
		if (data.level != currentLevel.id) return;
		var label = new UiLabel("", 0, 0, "s", "<" + data.user + "> " + data.message, "14px sans-serif");
		var elem = testScrollContainer.elem;
		testScrollContainer.addObject(label);
		elem.scrollTo(0, elem.scrollHeight);
		while (elem.childElementCount > maxMessages)
			elem.removeChild(elem.childNodes[0]);
	});
	socket.on('chatmessagefail', (reason) => {
		var label = new UiLabel("", 0, 0, "s", reason, "14px sans-serif", "yellow");
		var elem = testScrollContainer.elem;
		testScrollContainer.addObject(label);
		elem.scrollTo(0, elem.scrollHeight);
		while (elem.childElementCount > maxMessages)
			elem.removeChild(elem.childNodes[0]);
	});

	testWindow2.addObject(testInput);
	testWindow2.addObject(testButton2);
	testWindow2.addObject(testScrollContainer);
	testWindow2.addToPage();
}

// Run the tests 200ms after the page loads
// window.addEventListener("load", () => {
// 	setTimeout(test, 200);
// });
