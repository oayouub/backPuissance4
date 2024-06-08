const socket = io('http://localhost:3000');
const boardElement = document.querySelector('.board');
const roomElement = document.getElementById('room');
const currentPlayerElement = document.getElementById('currentPlayer');
const joinButton = document.getElementById('joinButton');
const waitingMessageElement = document.getElementById('waitingMessage');

let room = '';

joinButton.addEventListener('click', () => {
    if (room) {
        socket.emit('leave', room);
    }
    room = roomElement.value;
    socket.emit('join', room);
});

socket.on('startGame', (game) => {
    showBoard();
    updateBoard(game.board);
    currentPlayerElement.textContent = game.currentPlayer + 1;
});

socket.on('endGame', () => {
    hideBoard();
    boardElement.innerHTML = '';
    currentPlayerElement.textContent = '';
});

socket.on('updateBoard', (board, currentPlayer) => {
    updateBoard(board);
    currentPlayerElement.textContent = currentPlayer + 1;
});

socket.on('join', ({ playerId, players }) => {
    if (players.length < 2) {
        showWaitingMessage();
    } else {
        hideWaitingMessage();
        showBoard();
    }
    const currentPlayerIndex = players.indexOf(playerId);
    const currentPlayer = currentPlayerIndex === 0 ? 1 : 2;
    currentPlayerElement.textContent = currentPlayer;
});

const updateBoard = (board) => {
    boardElement.innerHTML = '';
    board.forEach((row, rowIndex) => {
        row.forEach((cell, columnIndex) => {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            if (cell === 1) {
                cellElement.classList.add('player1');
            } else if (cell === 2) {
                cellElement.classList.add('player2');
            }
            cellElement.addEventListener('click', () => makeMove(columnIndex));
            boardElement.appendChild(cellElement);
        });
    });
};

const makeMove = (column) => {
    socket.emit('move', room, column);
};

const restartButton = document.getElementById('restartButton');

restartButton.addEventListener('click', () => {
    socket.emit('restart', room);
});

socket.on('restartGame', (game) => {
    updateBoard(game.board);
    currentPlayerElement.textContent = game.currentPlayer + 1;
});

socket.on('disconnect', () => {
    socket.emit('restart', room);
});

const showBoard = () => {
    boardElement.style.display = 'grid';
    currentPlayerElement.parentElement.style.display = 'block';
};

const hideBoard = () => {
    boardElement.style.display = 'none';
    currentPlayerElement.parentElement.style.display = 'none';
};

const showWaitingMessage = () => {
    waitingMessageElement.style.display = 'block';
};

const hideWaitingMessage = () => {
    waitingMessageElement.style.display = 'none';
};
