class Position {
    constructor(x, y) {
        this._x = x;
        this._y = y;
        this.changed = false;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    set x(value) {
        this._x = value;
        this.changed = true;
    }

    set y(value) {
        this._y = value;
        this.changed = true;
    }

    distance(otherpos) {
        diffX = pos.x - otherpos.x
        diffY = pos.y - otherpos.y

        return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2))
    }
}