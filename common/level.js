class GameLevel {
    constructor() {
        this.gameobjects = [];
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
            }

        }
    }

    addObject(obj) {
        this.gameobjects.push(obj);
    }

    removeObject(obj) {
        obj.removed = true;
    }
}