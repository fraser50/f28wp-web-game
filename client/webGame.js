var socket = io();

// Temporary variable to store the current level. Definitly change the way this works
var currentLevel = new GameLevel();

// Load a chunk from the server and add it to the current level
function loadChunk(cx, cy, level) {
	socket.emit('getchunk', JSON.stringify({'x':cx,'y':cy,'level':level}));
	socket.on('getchunk', (dataStr) => {
		var data = JSON.parse(dataStr);
		console.log(data);

		currentLevel.addChunk(genChunkId(data.x, data.y), data.tiles);
	});
}
