
//identify player and position from html doc
var player = document.getElementById("player");


//  variables to store player current x and y position
var playerXPos;
var playerYPos;

var playerXVel = 0;
var playerYVel = 0;

//this update function should run within main gameloop update function
function update() {
  readKey();

  //update player position;
  playerXPos += playerXVel;
  playerYPos += playerYVel;
  
}



function readKey(key){
  //check for left arrow key press
  if(key.keyCode == 37) {
    playerXVel = -2;
  }

  //check for right arrow key press
  if(key.keyCode == 39) {
    playerXVel = 2;
  }

  //check for up arrow key press
  if(key.keyCode == 38) {
    playerYVel = -2;
  }

  //check for down arrow key press
  if(key.keyCode == 40) {
    playerYVel = 2;
  }
}
