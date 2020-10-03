function toRadians(angle) {
    return angle * (Math.PI / 180);
}
function toDegrees(angle) {
    return angle * (180 / Math.PI);
}

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

    add(pos) {
        if (pos instanceof Position) {
            x += pos.x;
            y += pos.y;

        } else if (pos instanceof Vector) {
            x += pos.toPosition().x;
            y += pos.toPosition().y;

        } else {
            throw new Error("Must be Position or Vector");
        }

        return pos;
    }

    distance(otherpos) {
        diffX = pos.x - otherpos.x
        diffY = pos.y - otherpos.y

        return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2))
    }
}

class Vector {
    constructor(magnitude, angle) {
        this.magnitude = magnitude;
        this.angle = angle;
    }

    toPosition() {
        x = Math.sin(toRadians(this.angle)) * this.magnitude;
        y = Math.cos(toRadians(this.angle)) * this.magnitude;

        return new Position(x, y);
    }

    add(pos) {
        pos.add(this.toPosition);

    }

    static fromXY(x, y) {
        var vec = new Vector(0, 0);
        vec.magnitude = Math.sqrt(x**2 + y**2);

        vec.angle = toDegrees(Math.tan(y/x));

        return vec;
    }
}