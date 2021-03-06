/*
Copyright (c) 2020 fraser50, mta2k00, blast1113, dr62, frg2
This work is licensed under the MIT license which can be found in the LICENSE file in the root of the project.
*/

var util_tmp = require('../common/util.js');
if (util_tmp != null) util = util_tmp;

var gameobjects_tmp = require('../common/gameobjects.js');
if (gameobjects_tmp != null) gameobjects = gameobjects_tmp;



if (typeof window != "undefined") {
    gameobjects.GameObject = GameObject;
    gameobjects.Player = Player;
    gameobjects.Point = Point;
    gameobjects.BallSpawnPoint = BallSpawnPoint;
}

gameobjectgenerators = [
    [gameobjects.Player, function(jobj, level) {
        return new gameobjects.Player(new util.Position(jobj["x"], jobj["y"]), 0, level, new util.Vector(0, 0), 0);

    }],

    [gameobjects.Point, function(jobj, level) {
        return new gameobjects.Point(new util.Position(jobj["x"], jobj["y"]), 0, level);
    }]
]

function objToJSON(gobj) {
    var jsonobj = gobj.toJSON();
    jsonobj['id'] = gobj.id;

    for (var i = 0; i < gameobjectgenerators.length; i++) {
        if (gobj instanceof gameobjectgenerators[i][0]) {
            jsonobj["type"] = i;
            return jsonobj;
        }
    }
}

function objFromJSON(jsonobj, level) {
    var typeindex = jsonobj["type"];

    if (typeindex >= gameobjectgenerators.length) {
        throw new Error("Invalid object type");
    }

    var generator = gameobjectgenerators[typeindex][1];

    var obj = generator(jsonobj, level);
    obj.id = jsonobj['id'];

    return obj;

}

function serverExports() {
    exports.objToJSON = objToJSON;
    exports.objFromJSON = objFromJSON;
}

if (typeof window != "undefined") {
	clientExports();

} else{
	serverExports();
}