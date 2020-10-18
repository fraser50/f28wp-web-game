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
    
    return loginWindow;
}