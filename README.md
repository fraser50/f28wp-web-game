# f28wp-web-game

A multiplayer MMO browser game written for a university project

# Installing

Please complete the following steps to get the game running

* Clone the repository
* CD into the f28wp-web-game directory
* Run the command "npm install"
* cd server and run "node server.js"

You should be the be able to access the game through the url "http://localhost:2000"

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
