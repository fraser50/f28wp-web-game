# f28wp-web-game

A multiplayer MMO browser game written for a university project

# Installing

Please complete the following steps to get the game running

* Clone the repository
* CD into the f28wp-web-game directory
* Run the command "npm install"
* cd server and run "node server.js"

You should be the be able to access the game through the url "http://localhost:2000"

# How To Play

When you load up the game you must first either sign up or log in as a guest, or, If you already have an account - log in.
Once you have signed into an account - guest or otherwise - you should now click the "Join Match" button in the bottom right window.

The game will start once there are at least two players connected.
The objective of this game is to collect balls that spawn around the map and deposit them in your team's base,
your team wins the match if they deposit more balls than the opposing team.

Controls:

* Use WASD to move, picking up and depositing the balls is automatic.
* Left Shift to view team scores and match leaderboard.
* To view your personal lifetime stats click on the button with you username in the top left of the screen

# Level Editor

To run the level editor, open the html file in a browser and load the file blocktypes.json when prompted.

Controls:

* WASD to move
* Space to place tile as floor
* Shift + Space to place tile as wall

To place a tile, a type must be selected from the list on the left.

For the world to function properly, the spawn points must be set in the World Properties window in the form:

    `(x y),(x y),(x y),(x y),(x y),(x y)`

where the first 3 sets of coordinates are for the blue team and the last 3 are for the red team.

# Testing

Before a commit that adds a feature or changes an existing one perform the following tests:

* Check the player can login as a registered user/guest
* Check there is no obvious UI errors
* Check for server crashes/console errors
* Check movement and collision still works
* Test for multiplayer by adding in another client, check both players can see the other
* Test there are no errors for multi-level support, do this by adding in more than 6 players to trigger new level creation

Once these tests have passed, commit your code
