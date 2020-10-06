class GameObject {
    constructor(pos, rotation, level) {
        this.pos = pos;
        this.rotation = rotation;
        this.level = level;

        this.removed = false;
    }

    update() {
        // Override this method for logic that should run every cycle
    }

    remove() {
        this.level.removeObject(this);
    }
}

class Player extends GameObject {
    constructor(pos, rotation, level, velocity) {
        super(pos, rotation, level);
        this.velocity = velocity;
    }
}