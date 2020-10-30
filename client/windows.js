function generateLoginWindow(socket) {
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
		if (!isValidUsername(loginUserBox.getValue())) {
			alert("Invalid username");
			return;
		}
		if (!isValidPassword(loginPassBox.getValue())) {
			alert("Invalid password");
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
	
	socket.on('addUser', (data) => {
		loginUserBox.clear();
		loginPassBox.clear();
		if (data.success == true) {
			loginWindow.hide();
			logActivateWindow.hide();
			userDetails.loginSuccess = true;
			showSignedInButton();
			createPlayer(socket, userDetails.name);		//Just barely works

			chatSendButton.enable();

			initWorld();
		}
		alert(data.message);
	});
	
	socket.on('login', (data) => {
		loginUserBox.clear();
		loginPassBox.clear();
		if (data.success == true) {
			loginWindow.hide();
			logActivateWindow.hide();
			userDetails.loginSuccess = true;
			showSignedInButton();
			createPlayer(socket, userDetails.name);		//Just barely works

			chatSendButton.enable();

			initWorld();
		}
		alert(data.message);
	});
	
	socket.on('guest', (data) => {			//Havent implemented Stats and Log out to guest yet
		loginUserBox.clear();
		loginPassBox.clear();
		if (data.success == true) {
			loginWindow.hide();
			console.info(data);
			userDetails.name = genGuestName(data.userId);
			userDetails.loginSuccess = true;
			createPlayer(socket, userDetails.name);		//Just barely works, should be adapted for guest specifically

			chatSendButton.enable();

			initWorld();
		}
		alert(data.message);
	});
	
	return loginWindow;
}

function showSignedInButton() {
	if (signedInWindow.hidden) {
		signedInButton.updateValue("Signed in as: " + userDetails.name)
		signedInWindow.show();
	} else 
		signedInWindow.hide();
}

function generateUserWindow() {

	var userWindow = new UiWindow("userWindow", 0, 0, "cc", 300, 200);
	
	userWindowMessage = new UiLabel("userWindowMessage", 20, 20, "tl", "null", "16px sans-serif", "white");
	userWindow.addObject(userWindowMessage);	
	
	userWindow.addObject(new UiLabel("userWinsLabel", 20, 60, "tl", "Total Wins", "16px sans-serif", "white"));
	userWins = new UiLabel("userWins", 22, 80, "tl", "null", "16px sans-serif", "white");
	userWindow.addObject(userWins);
	
	userWindow.addObject(new UiLabel("userTotalPoints", 111.75, 60, "tl", "Total Points", "16px sans-serif", "white"));
	userTotalPoints = new UiLabel("userTotalPoints", 113.75, 80, "tl", "null", "16px sans-serif", "white");
	userWindow.addObject(userTotalPoints);

	userWindow.addObject(new UiLabel("userKills", 212.42, 60, "tl", "Total Kills", "16px sans-serif", "white"));
	userKills = new UiLabel("userKills", 214.42, 80, "tl", "null", "16px sans-serif", "white");
	userWindow.addObject(userKills);
	
	userWindow.addObject(new UiButton("Sign Out", 20, 120, "tl", 125, 60, "Sign Out", "20px sans-serif", () => {
		socket.emit('sign out');
		console.log('sign out');
		socket.on('sign out', () => {
			alert("Signed Out");
			userDetails.name = null;
			userDetails.loginSuccess = false;
			showSignedInButton();
			userWindow.hide();
			logActivateWindow.show();

			chatSendButton.disable();
		});
	}));
	
	userWindow.addObject(new UiButton("closeUserWindow", 20, 120, "tr", 125, 60, "Close", "20px sans-serif", () => {
		userWindow.hide();
	}));
	
	return userWindow;
}


function getUserStatVals() {
	var stats = {
		user : userDetails.name,
		wins : "",
		kills : "",
		points : ""
	}
		
	socket.emit('getStats', (stats));

	socket.on('getStats', (data) => {
		userWindowMessage.updateValue("Signed in as " + userDetails.name);
		userWins.updateValue(data.wins);
		userKills.updateValue(data.kills);
		userTotalPoints.updateValue(data.totalPoints);
	});

}