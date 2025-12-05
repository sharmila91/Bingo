class BingoBoard {
    constructor() {
        this.board = this.createBoard();
        this.winningConditions = this.getWinningConditions();
    }

    createBoard() {
        const board = [];
        for (let i = 0; i < 5; i++) {
            const row = [];
            for (let j = 0; j < 5; j++) {
                row.push({ number: i * 5 + j + 1, marked: false });
            }
            board.push(row);
        }
        return board;
    }

    markTile(row, col) {
        if (this.board[row][col]) {
            this.board[row][col].marked = true;
        }
    }

    isTileMarked(row, col) {
        return this.board[row][col] && this.board[row][col].marked;
    }

    checkWin() {
        return this.winningConditions.some(condition => 
            condition.every(([row, col]) => this.isTileMarked(row, col))
        );
    }

    getWinningConditions() {
        const conditions = [];

        // Rows
        for (let i = 0; i < 5; i++) {
            conditions.push([...Array(5)].map((_, j) => [i, j]));
        }

        // Columns
        for (let j = 0; j < 5; j++) {
            conditions.push([...Array(5)].map((_, i) => [i, j]));
        }

        // Diagonals
        conditions.push([...Array(5)].map((_, i) => [i, i])); // Top-left to bottom-right
        conditions.push([...Array(5)].map((_, i) => [i, 4 - i])); // Top-right to bottom-left

        return conditions;
    }

    resetBoard() {
        this.board.forEach(row => row.forEach(tile => tile.marked = false));
    }
}

export default BingoBoard;