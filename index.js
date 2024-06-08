import express from 'express';
import http from 'http';
import ip from 'ip';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const PORT = 3000;
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

app.use(cors());
app.get('/', (req, res) => {
    res.json('ip address: http://' + ip.address() + ':' + PORT);
});

const games = {};

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('join', (room) => {
        if (!games[room]) {
            games[room] = {
                players: [],
                board: Array(6).fill(null).map(() => Array(7).fill(null)),
                currentPlayer: 0
            };
        }
    
        const game = games[room];
    
        if (game.players.length < 2) {
            game.players.push(socket.id);
            socket.join(room);
            io.to(room).emit('join', { playerId: socket.id, players: game.players });
            console.log('player joined room ' + room);
        }
    
        if (game.players.length === 2) {
            io.to(room).emit('startGame', game);
            console.log('game started in room ' + room);
        }
    });

    socket.on('leave', (room) => {
        console.log('leave room: ' + room);
        socket.leave(room);
        if (games[room]) {
            games[room].players = games[room].players.filter(player => player !== socket.id);
            if (games[room].players.length < 2) {
                delete games[room];
                io.to(room).emit('endGame');
                console.log('game ended in room ' + room);
            }
        }
    });
    
    socket.on('move', (room, column) => {
        const game = games[room];

        if (game) {
            const currentPlayer = game.players[game.currentPlayer];
            if (socket.id !== currentPlayer) {
                return;
            }

            for (let row = 5; row >= 0; row--) {
                if (!game.board[row][column]) {
                    game.board[row][column] = game.currentPlayer + 1;
                    break;
                }
            }

            game.currentPlayer = 1 - game.currentPlayer; 
            io.to(room).emit('updateBoard', game.board, game.currentPlayer);
        }
    });
    
    socket.on('restart', (room) => {
        if (games[room]) {
            games[room].board = Array(6).fill(null).map(() => Array(7).fill(null));
            games[room].currentPlayer = 0;
            io.to(room).emit('restartGame', games[room]);
        }
    }); 
});

server.listen(PORT, () => {
    console.log('Server ip : http://' + ip.address() + ":" + PORT);
});
