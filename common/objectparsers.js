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

}