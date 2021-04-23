const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const {addUser, getUser, removeUser, getUsersInRoom} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

io.on('connection', (socket) => {
  console.log('New Websocket connection');
  
  socket.on('join', (userData, callback) => {
   const {error, user} = addUser({id: socket.id, ...userData});
   const {username, room} = user || {};
    if(error){
      return callback(error);
    }
    socket.join(room);
    socket.emit('message', generateMessage("Welcome!", "Admin"));
    socket.broadcast.to(room).emit('message', generateMessage(`${username} has joined`, "Admin"));
    io.to(room).emit('roomData', {
      room,
      users: getUsersInRoom(room),
    })
  })

  socket.on('sendMessage', (message, cb) => {
    const filter = new Filter();
    if(filter.isProfane(message)){
      return cb('Profanity not allowed!');
    }
    const user = getUser(socket.id);
    if(user){
      io.to(user.room).emit('message', generateMessage(message, user.username));
      cb();
    }
  })

  socket.on('sendLocation', (location, cb) => {
    const user = getUser(socket.id);
    if(user){
      io.to(user.room).emit('locationMessage', generateLocationMessage(location, user.username));
      cb('Location shared!')
    }
  })

  socket.on('disconnect', () => {
    const {room, username} = removeUser(socket.id) || {};

    if(!!room && !!username){
      io.to(room).emit('message', generateMessage(`${username} has left!`, "Admin"));
      io.to(room).emit('roomData', {
        room,
        users: getUsersInRoom(room),
      })
    }
  })
})

app.use(express.static(publicDirectoryPath))

server.listen(port, () => {
  console.log('server is up on port' + port);
})