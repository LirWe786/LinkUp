const express = require('express');
const { createServer } = require('http');
const path = require('path')
const { Server } = require('socket.io')

const app = express()
const PORT = process.env.PORT || 4000
const ipAdress = '192.168.0.10';
const server = createServer(app)
const io = new Server(server)
app.use(express.static(path.join(__dirname, '../client')));
io.on('connection', (socket) => {
  let message = '';
  let username = 'Anonymous';
  socket.on('disconect', () => {
    console.log(`🔴 Пользователь ${socket.id} отключился`)
  })
  socket.on('set username', (name) => {
    username = name || 'Anonymous';
    console.log(`🟢 Поользолватель ${username} с id:${socket.id} подключился`)
  })
  socket.on('chat message', (msg) => {
    const user = {
      firstname: username,
      message: msg
    }
    io.emit('chat message', user)
  })
  socket.on('voice message', (url) => {
    console.log(username)
    const user = {
      firstname: username,
      message: url
    }
    io.emit('voice message', user)
  })


})


app.get('/', (req, res) => {
  res.send('Hello World!')
})
server.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})