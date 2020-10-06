elementbuilders = [ // A new function will be placed here for creating the elements for different kinds of objects in the game
    [Player, function(obj) {
        var e = document.createElement("img");
        //e.style.position = 'absolute';
        //e.style.width = '64px';
        //e.style.height = '64px';
        e.style.top = 0;
        e.style.left = 0;
        e.src = "client/assets/images/temp_player.png"
        return e;
    }]
]

objectelements = [] // Please don't mess with this manually, modify one of the functions below

function setElementPosition(element, pos) {
    console.log('element below:');
    console.log(element);
    //element.style.left = pos.x;
    //element.style.top  = pos.y;
    element.style = "position:absolute; width:64px; height:64px; left:" + pos.x + "px; top:" + pos.y + "px;";
}

function render(level) {
    // Adding objects
    for (let i=0; i<level.newobjects.length; i++) {
        if (objectelements.indexOf(level.newobjects[i]) != -1) {
            // This code should never be called, if it is, a warning will be printed to the console
            console.log('WARNING: A new object that was already added to the screen was found!');
            console.log(objectelements);
            continue;
        }

        var newobj = level.newobjects[i];

        for (let j=0; j<elementbuilders.length; j++) {
            if (newobj instanceof elementbuilders[j][0]) {
                newelement = elementbuilders[j][1](newobj);
                setElementPosition(newelement, newobj.pos);
                var gamearea = document.getElementById("gamearea");
                gamearea.appendChild(newelement);

                objectelements.push(newobj);
                objectelements.push(newelement);
                break;

            }
        }

    }

    // Removing objects
    for (let i=0; i<level.removedobjects.length; i++) {
        var removedobj = level.removedobj[i];
        var objindex = objectelements.indexOf(removedobj);
        if (objindex == -1) {
            console.log("WARNING: Object was already removed!");
            continue;

        } else {
            var gamearea = document.getElementById("gamearea");
            gamearea.removeChild(objectelements[objindex + 1]);
            objectelements.splice(objindex, 2);
        }
    }

    // Rendering objects
    for (let i=0; i<objectelements.length-1; i += 2) {
        var obj = objectelements[i];

        if (obj.pos.changed) {
            setElementPosition(objectelements[i + 1], obj.pos);
            obj.pos.changed = false;
        }

    }

    level.newobjects.splice(0, level.newobjects.length);
    level.removedobjects.splice(0, level.removedobjects.length);

}