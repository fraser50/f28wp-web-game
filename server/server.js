// TODO: Write server
// Might need to install node js
// Install express, socket.io through npm

var express = require('express');
var app = express();
var server = require('http').Server(app)
var path = require('path')

app.get('/',function(req, res) {
    res.sendFile(path.join(__dirname, '../client/WebDevGame.html'));
});
app.use('/client',express.static(path.join(__dirname, '/../client')));
app.use('/common',express.static(path.join(__dirname, '/../common')));

//To run this, navigate to server folder in the command line. Enter "node server.js"
//Go to browser enter localhost:2000 as url 

server.listen(2000);      //Connect with port 2000
console.log("Server started.");     //Send a log to console to confirm connection
