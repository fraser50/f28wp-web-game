class GameLevel {
    constructor() {
        this.gameobjects = [];
        this.newobjects = []; // To allow the server to determine when it needs to send information about a new object to the client, and to allow the client to render new objects
        this.removedObjects = [];
    }

    update() {
        for (let i=0; i<this.gameobjects.length; i++) {
            var obj = this.gameobjects[i];
            var toremove = [];

            if (obj.removed) {
                toremove.push(obj);
                continue;
            }

            this.gameobjects[i].update();
        }

        for (let i=0; i<toremove; i++) {
            if (this.gameobjects.indexOf(this.toremove[i]) != -1) {
                this.gameobjects.splice(this.gameobjects.indexOf(i));
                this.removedObjects.push(this.toremove[i]);
            }

        }
    }

    addObject(obj) {
        this.gameobjects.push(obj);
        this.newobjects.push(obj);
    }

    removeObject(obj) {
        obj.removed = true;
    }
}