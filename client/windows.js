/*
Copyright (c) 2020 fraser50, mta2k00, blast1113, dr62, frg2
This work is licensed under the MIT license which can be found in the LICENSE file in the root of the project.
*/

function generateLoginWindow(socket) {
	var loginWindow = new UiWindow("logsignform", 0, 0, "cc", 300, 355);

	loginWindow.addObject(new UiLabel("", 20, 20, "tl", "Please enter your username", "16px sans-serif"));
	var loginUserBox = new UiTextInput("loguserinput", 20, 45, "tl", 260, 40, "Username - 2-16 chars long");
	loginWindow.addObject(loginUserBox);
	
	loginWindow.addObject(new UiLabel("", 20, 95, "tl", "Please enter your password", "16px sans-serif"));
	var loginPassBox = new UiTextInput("passinput", 20, 120, "tl", 260, 40, "Password - 6-30 chars long with symbols", "password");
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
			alert("Invalid username - must be between 2-16 characters long");
			return;
		}
		if (!isValidPassword(loginPassBox.getValue())) {
			alert("Invalid password - must be between 6-30 characters long with at least one symbol");
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
			userDetails.loginSuccess = true;
			isGuest = false;
			createPlayer(socket, userDetails.name, isGuest);		//Just barely works
			loginActivateButton.updateValue("Signed in as: " + userDetails.name);
			loginActivateButton.setCallback(() => {loginCallbackToLoggedIn()});
			getUserStatVals();

			chatSendButton.enable();
			chatInput.setMovementDisable(socket.player);

			initWorld();
		}
		alert(data.message);
	});
	
	socket.on('login', (data) => {
		loginUserBox.clear();
		loginPassBox.clear();
		if (data.success == true) {
			loginWindow.hide();
			userDetails.loginSuccess = true;
			isGuest = false;
			createPlayer(socket, userDetails.name, isGuest);		//Just barely works
			loginActivateButton.updateValue("Signed in as: " + userDetails.name);
			loginActivateButton.setCallback(() => {loginCallbackToLoggedIn()});
			getUserStatVals();
			
			chatSendButton.enable();
			chatInput.setMovementDisable(socket.player);

			initWorld();
		}
		alert(data.message);
	});
	
	socket.on('guest', (data) => {			//Havent implemented Stats and Log out to guest yet
		loginUserBox.clear();
		loginPassBox.clear();
		if (data.success == true) {
			loginWindow.hide();
			userDetails.name = genGuestName(data.userId);
			userDetails.loginSuccess = true;
			isGuest = true;
			createPlayer(socket, userDetails.name, isGuest);		//Just barely works, should be adapted for guest specifically
			socket.player.isGuest = data.isGuest;
			loginActivateButton.updateValue("Signed in as: " + userDetails.name);
			loginActivateButton.setCallback(() => {loginCallbackToLoggedIn()});
			getUserStatVals();
			
			chatSendButton.enable();
			chatInput.setMovementDisable(socket.player);

			initWorld();
		}
		alert(data.message);
	});
	
	return loginWindow;
}

//function showSignedInButton() {
//	if (signedInWindow.hidden) {
//		signedInButton.updateValue("Signed in as: " + userDetails.name)
//		signedInWindow.show();
//	} else 
//		signedInWindow.hide();
//}

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
		alert("Signed Out");
		userDetails.name = null;
		userDetails.loginSuccess = false;
		removePlayer(socket);
		loginActivateButton.updateValue("Login/Sign Up");
		loginActivateButton.setCallback(() => {loginCallbackToLogIn()});
		userWindow.hide();
			
			
		chatSendButton.disable();
		chatInput.removeMovementDisable();
		
		location.reload();
	}));
	
	userWindow.addObject(new UiButton("closeUserWindow", 20, 120, "tr", 125, 60, "Close", "20px sans-serif", () => {
		userWindow.hide();
	}));
	
	return userWindow;
}

function loginCallbackToLoggedIn() {
	if (userWindow.hidden) {
		getUserStatVals();
		userWindow.show();
	} else 
		userWindow.hide();
}

function loginCallbackToLogIn() {
	if (loginWindow.hidden == true) {
		loginWindow.show();
	} else 
		loginWindow.hide();
	
}

function generateLeaderboard() {	
	var leaderboardWindow = new UiWindow("leaderboardWindow", 0, 0, "cc", 600, 500);
	var leaderboardTitle = new UiLabel("leaderboardTitle", -85, 20, "tc", "Leaderboard", "30px sans-serif");
	leaderboardWindow.addObject(leaderboardTitle);
	
	
	var leaderboard = new UiScrollContainer("leaderboard", 20, 60, "tl", 360, 420, true); //For scalability
	leaderboardWindow.addObject(leaderboard);
	leaderboard.hideScrollbar();		

	var blueTeamTitle = new UiLabel("blueTeamTitle", 60, 60, "tl", "Blue", "24px sans-serif", "blue");
	var redTeamTitle = new UiLabel("redTeamTitle", 495.97, 60, "tl", "Red", "24px sans-serif", "red");
	leaderboardWindow.addObject(blueTeamTitle);
	leaderboardWindow.addObject(redTeamTitle);
	
	var blueTeamScore = new UiLabel("blueTeamScore", 194.03, 60, "tl", "0", "24px sans-serif");
	var redTeamScore = new UiLabel("redTeamScore", 405.97, 60, "tl", "0", "24px sans-serif");
	leaderboardWindow.addObject(blueTeamScore);
	leaderboardWindow.addObject(redTeamScore);

	return leaderboardWindow;
}

function updateLeaderboard() {
	
}

	
function getUserStatVals() {
	userWindowMessage.updateValue("Signed in as " + userDetails.name);

	if (!(socket.player.isGuest)) {
		var stats = {
				user : userDetails.name,
				wins : "",
				kills : "",
				points : ""
			}
				
			socket.emit('getStats', (stats));

			socket.on('getStats', (data) => {
				userWins.updateValue(data.wins + socket.player.wins);
				userKills.updateValue(data.kills + socket.player.kills);
				userTotalPoints.updateValue(data.points + socket.player.points);
			});
	} else {
		userWins.updateValue(socket.player.wins);
		userKills.updateValue(socket.player.kills);
		userTotalPoints.updateValue(socket.player.points);
	}
	
	socket.player.startingWins = userWins.getValue();
	socket.player.startingKills = userKills.getValue();
	socket.player.startingPoints = userTotalPoints.getValue();
}

function updateUserStatVals() {
	userWins.updateValue(socket.player.startingWins + socket.player.wins);
	userKills.updateValue(socket.player.startingKills + socket.player.kills);
	userTotalPoints.updateValue(socket.player.startingPoints + socket.player.points);
}