let https = require('https');
let http = require('http');
let express = require('express');
var socket = require('socket.io');
let fs = require('fs');
let robot = require('robotjs')

//load permissionkey for HTTPsetup;
var privateKey = fs.readFileSync('my-key.pem');
var certificate = fs.readFileSync('my-cert.pem');

var credentials = {
  key: privateKey,
  cert: certificate
};
let users = [];

//Setup HTTPS server and serve public folder
let app = express();
app.use(express.static('public'))
let server = https.createServer(credentials, app);

server.listen(443, () => {
  console.log("listening on port 8080");
})

var io = socket(server)


io.sockets.on('connection', (socket) => {
  console.log("we have a new client" + socket.id)

  socket.on('users', (userData) => {
    users.push({
      "user": userData,
      "id": socket.id
    })
    io.sockets.emit('onlineUsers', users)
  })


  socket.on('mouseLocation', (mouseLoc) => {
    console.log(mouseLoc)
  })

  socket.on('disconnect', (user) => {
    console.log("user Disconnected: " + socket.id)
    for (let i = 0; i < users.length; i++) {
      if (users[i].id == socket.id) {
        users.splice(i, 1);
      }
      io.sockets.emit('onlineUsers', users)
    }

    io.sockets.emit(socket.id)

  })


})
