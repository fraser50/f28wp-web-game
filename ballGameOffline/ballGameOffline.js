/*
Copyright (c) 2020 fraser50, mta2k00, blast1113, dr62, frg2
This work is licensed under the MIT license which can be found in the LICENSE file in the root of the project.
*/

class GameObject {
    constructor(xPos, yPos) {
        this.xPos = xPos;
        this.yPos = yPos;

        this.removed = false; //If set to true, object will be removed in next game loop
    }

    update() {
        // Override this method for logic that should run every cycle
    }

    getXPos() {
        return this.xPos;
    }

    getYPos() {
        return this.yPos;
    }
}

class Player extends GameObject{
    constructor(playerName, playerColor, playerXPos, playerYPos) {
        super(playerXPos, playerYPos);
        this.playerName = playerName;
        this.playerColor = playerColor;

        this.playerXVel = 0;
        this.playerYVel = 0;
        this.playerMaxVel = 10; //NOTE: playerMaxVel will be used if we are planning to implement acceleration

        this.state = "down";
        this.holdingBall = false;


        //create the player div
        const playerDiv = document.createElement("div");
        playerDiv.setAttribute("id", "playerdiv");

        //set player position
        playerDiv.style.position = "absolute";
        playerDiv.style.top = playerYPos + "px";
        playerDiv.style.left = playerXPos + "px";

        //set player size and z index
        playerDiv.style.width = "32px";
        playerDiv.style.height = "32px";
        playerDiv.style.zIndex = "1";

        //set player colour and outline
        playerDiv.style.backgroundColor = this.playerColor; //This code is only used if spritesheet is not being used
        playerDiv.style.outline = "1px solid black";


        //set player image
        //playerDiv.style.backgroundImage = "url('C:\Users\Mitchell\Documents\Programming\Javascript\multiGame\images\player_spritesheet.png')";

        document.body.append(playerDiv);
        //document.body.insertBefore(playerDiv, document.getElementById("javascriptcode"));
        document.addEventListener("keydown", this.readKey);
        document.addEventListener("keyup", this.stopMovement);
    }

    //methods


    readKey(key) {
        //check for left arrow key press
        if(key.keyCode == 37) {
            this.state = "left";
            this.playerXVel = -2;
            console.log("left was pressed"); //Test code
        }

        //check for right arrow key press
        if(key.keyCode == 39) {
            this.state = "right";
            this.playerXVel = 2;
            console.log("right was pressed"); //Test code
        }

        //check for up arrow key press
        if(key.keyCode == 38) {
            this.state = "up";
            this.playerYVel = -2;
            console.log("up was pressed"); //Test code
        }

        //check for down arrow key press
        if(key.keyCode == 40) {
            this.state = "down";
            this.playerYVel = 2;
            console.log("down was pressed"); //Test code
        }

        //check for spacebar pressed (attack button)
        if(key.keyCode == 32) {
            if(this.holdingBall){
                //code to drop ball
                this.holdingBall = false;
            }
            console.log("Attack!"); //Test code
        }
    }

    stopMovement() {
        this.playerXVel = 0;
        this.playerYVel = 0;
        console.log("Stopped moving"); //Test code
    }

    update() {
        this.playerXPos += playerXVel;
        this.playerYPos += playerYVel;
        playerDiv.style.left = playerXPos + "px";
        playerDiv.style.top = playerYPos + "px";
    }

    getPlayerName() {
        return this.playerName;
    }

    getPlayerState() {
        return this.state;
    }

    //End of Player class
}

//Room object will be a div with a border where the game takes place.
class Room {
    constructor(roomName, width, height) {
        this.roomName = roomName;
        this.width = width;
        this.height = height;

        this.isRunning = false; //Start gameloop when isRunning is true

        //Array of gameObjects
        this.gameobjects = [];

        //create room div
        const roomDiv = document.createElement("div");
        roomDiv.setAttribute("id", "roomdiv");

        //set room size
        roomDiv.style.position = "absolute";
        roomDiv.style.width = this.width + "px";
        roomDiv.style.height = this.height + "px";

        //set room colour and outline
        roomDiv.style.backgroundColor = "rgb(204, 255, 204)";
        roomDiv.style.outline = "2px solid black";

        document.body.append(roomDiv);

    }

    start() {
        setInterval(this.update, 1000/60);
    }

    update() {
        var i;

        //Note for Dan: This for loop causes an error: "this.gameobjects not defined"
        for (i = 0; i < this.gameobjects.length; i++) {
            console.log("Updated!");
        }
    }

    addObject(object) {
        this.gameobjects.push(object);
    }

    //End of Room class
}


//Main method
var gameRoom = new Room("Room1", 600, 400);
var player = new Player("PlayerNumber1", "blue", 50, 50);
var player2 = new Player("PlayerNumber2", "pink", 100, 100);

gameRoom.addObject(player);
gameRoom.addObject(player2);

gameRoom.start();
