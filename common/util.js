DISABLE_VALIDATION = false; // This disables all username and password policies, useful for easy testing

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
		var diffX = this.x - otherpos.x;
		var diffY = this.y - otherpos.y;

		return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2))
	}

	clone() {
		return new Position(this.x, this.y);
	}
}

class Vector {
	constructor(magnitude, angle) {
		this.magnitude = magnitude;
		this.angle = angle;
	}

	toPosition() {
		var x = Math.sin(toRadians(this.angle)) * this.magnitude;
		var y = Math.cos(toRadians(this.angle)) * this.magnitude;

		return new Position(x, y);
	}

	add(pos) {
		pos.add(this.toPosition);

	}

	clone() {
		return new Vector(this.magnitude, this.angle);
	}

	static fromXY(x, y) {
		var vec = new Vector(0, 0);
		vec.magnitude = Math.sqrt(x**2 + y**2);

		vec.angle = toDegrees(Math.atan(y/x));

		return vec;
	}
}

function genChunkId(cx, cy) {
	return "c" + cx.toString() + "_" + cy.toString();
}

function fromChunkId(cId) {
	var arr = cId.substr(1).split("_");
	return [parseInt(arr[0]), parseInt(arr[1])];
}

function genTileImageId(t) {
	return "t" + t.toString();
}

function getBackgroundColorRGBA(element) {
	var colstr = window.getComputedStyle(element).backgroundColor;
	colstr = colstr.substr(colstr.indexOf("(")+1); // Remove "rgba("
	colstr = colstr.substr(0, colstr.length-1); // Remove ")"

	jsonstr = "[" + colstr + "]";

	return JSON.parse(jsonstr);
}

function setBackgroundColorRGBA(element, newRGBA) {
	element.style.backgroundColor = "rgba(" + newRGBA[0] + "," + newRGBA[1] + "," + newRGBA[2] + "," + newRGBA[3] + ")";
}

function genGuestName(gId) {
	return "guest_" + gId.toString();
}

// Check if a username is valid (maybe change the lengths later)
function isValidUsername(username) {
	if (DISABLE_VALIDATION) return true;
	
	var length = username.length >= 2 && username.length <= 16;

	var invalidChars = username.includes(" "); // Maybe change to allow spaces?

	return length && !invalidChars;
}

/* 
Check if a password is valid:
  • Must be between 6 and 30 characters in lenght (inclusive)
  • Cannot contain spaces
  • Must contain at least 1 letter/number
  • Must contain at leas 1 symbol
*/
function isValidPassword(password) {
	if (DISABLE_VALIDATION) return true;

	var length = password.length >= 6 && password.length <= 30;

	var invalidChars = !password.includes(" ");

	var normChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	var hasNotNorm = false;
	var hasNorm = false;
	for (var i in password) {
		hasNotNorm = hasNotNorm || !normChars.includes(password[i]);
		hasNorm = hasNorm || normChars.includes(password[i]);
		if (hasNotNorm && hasNorm) break;
	}

	return length && invalidChars && hasNorm && hasNotNorm;
}

// As JSON does not natively support comments, they have to be removed before parsing
function removeCommentsFromJSON(jsonstr) {
	jsonstr = jsonstr.toString();
	var lines = jsonstr.split("\n");
	var out = "";

	for (var i in lines) {
		var line = lines[i];
		if (line.includes("//")) {
			out += line.substr(0, line.indexOf("//")) + "\n";
		} else {
			out += line + "\n";
		}
	}

	return out;
}

function roundNumber(n, dp) {
	return Math.round(n*(10**dp)) / (10**dp);
}

function getTileAt(level, x, y) {
	var cx = Math.floor(x/chunkSize);
	var cy = Math.floor(y/chunkSize);
	var cId = genChunkId(cx, cy);

	var rx = x - cx*chunkSize;
	var ry = y - cy*chunkSize;

	if (level.chunks[cId])
		return level.chunks[cId][ry*chunkSize + rx];
	// If the chunk does not exist, the function will return undefined
}

function spawnposFromString(str) {
	var posarr = str.split(",");

	var outarr = [];

	for (var p in posarr) {
		var pos = posarr[p].replace("(", "").replace(")", "").split(" ");
		outarr.push([parseFloat(pos[0]), parseFloat(pos[1])]);
	}

	return outarr;
}

function spawnposToString(spawnpos) {
	var outstr = "";

	for (p in spawnpos) {
		var pos = spawnpos[p];
		outstr += `(${pos[0]} ${pos[1]}),`;
	}

	return outstr.substr(0, outstr.length-1);
}

function serverExports() {
	exports.toRadians = toRadians;
	exports.toDegrees = toDegrees;
	exports.Position = Position;
	exports.Vector = Vector;
	exports.genChunkId = genChunkId;
	exports.fromChunkId = fromChunkId;
	exports.genTileImageId = genTileImageId;
	exports.getBackgroundColorRGBA = getBackgroundColorRGBA;
	exports.setBackgroundColorRGBA = setBackgroundColorRGBA;
	exports.genGuestName = genGuestName;
	exports.isValidUsername = isValidUsername;
	exports.isValidPassword = isValidPassword;
	exports.removeCommentsFromJSON = removeCommentsFromJSON;
	exports.roundNumber = roundNumber;
	exports.getTileAt = getTileAt;
}

function clientExports() {
	util = {};
	util.toRadians = toRadians;
	util.toDegrees = toDegrees;
	util.Position = Position;
	util.Vector = Vector;
	util.genChunkId = genChunkId;
	util.fromChunkId = fromChunkId;
	util.genTileImageId = genTileImageId;
	util.getBackgroundColorRGBA = getBackgroundColorRGBA;
	util.setBackgroundColorRGBA = setBackgroundColorRGBA;
	util.genGuestName = genGuestName;
	util.isValidUsername = isValidUsername;
	util.isValidPassword = isValidPassword;
	util.removeCommentsFromJSON = removeCommentsFromJSON;
	util.roundNumber = roundNumber;
	util.getTileAt = getTileAt;
}

if (typeof window != "undefined") {
	clientExports();

} else {
	serverExports();
}
