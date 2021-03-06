import React, { Component } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Modal } from 'react-native';
import AppScreen from '../AppScreen';

export default class GameScreen extends Component {

    static UNPLAYED = 0;
    static PLAYERONE = 1;
    static PLAYERTWO = 2;

    static NUMROWS = 6;
    static NUMCOLS = 7;

    constructor(props) {
        super(props);

        let gameState = [[], [], [], [], [], []];
        let nextMove = [5, 5, 5, 5, 5, 5, 5];
        for (let i = 0; i < GameScreen.NUMROWS; i++) {
            for (let j = 0; j < GameScreen.NUMCOLS; j++) {
                gameState[i].push(GameScreen.UNPLAYED);
            }
        }
        
        this.state = {
            gameState, // The current board.
            currentPlayer: GameScreen.PLAYERONE, // Next player to play a move.
            nextMove, // An array to tell you which column the next play is in each row.
            winner: null,
            examine: false,
        }
    }

    static getDerivedStateFromProps(props, state) {
        if (props.newGame) {
            let gameState = [[], [], [], [], [], []];
            let nextMove = [5, 5, 5, 5, 5, 5, 5];
            for (let i = 0; i < GameScreen.NUMROWS; i++) {
                for (let j = 0; j < GameScreen.NUMCOLS; j++) {
                    gameState[i].push(GameScreen.UNPLAYED);
                }
            }

            props.unfreshScreen();
            return {
                gameState,
                currentPlayer: GameScreen.PLAYERONE,
                nextMove,
                winner: null,
                examine: false,
            };
        }

        return null;
    }

    getMoveBoard = (moveRow, moveCol) => {

        // Get an array of the row the move was made in.
        let boardRow = [...this.state.gameState[moveRow]];

        // Get an array of the column that the move was in.
        let boardCol = [];
        for (let i = 0; i < GameScreen.NUMROWS; i++) {
            boardCol.push(this.state.gameState[i][moveCol]);
        }

        // Get an array of the forward diagonal (/) that the move was in.
        let boardForwardDiag = [];
        let i = GameScreen.NUMROWS - (moveRow + 1); // Invert this to go from bottom to top.
        let j = moveCol;
        while (i > 0 && j > 0) {
            i--;
            j--;
        }
        while (i < GameScreen.NUMROWS && j < GameScreen.NUMCOLS) {

            const uninverted = GameScreen.NUMROWS - (i + 1);
            boardForwardDiag.push(this.state.gameState[uninverted][j]);
            i++;
            j++;
        }

        // Get an array of the backwards diagonal (\) that the move was in.
        let boardBackwardDiag = [];
        i = GameScreen.NUMROWS - (moveRow + 1); // Invert this to go from bottom to top.
        j = moveCol; // Invert to go from right to left.
        while (i < GameScreen.NUMROWS - 1 && j > 0) {
            i++;
            j--;
        }
        while (i >= 0 && j < GameScreen.NUMCOLS) {

            const uninverted = GameScreen.NUMROWS - (i + 1);
            boardBackwardDiag.push(this.state.gameState[uninverted][j]);
            i--;
            j++;
        }

        return [boardRow, boardCol, boardForwardDiag, boardBackwardDiag];
    }

    numberTouching = (moveRow, moveCol, player) => {
        let moveBoard = this.getMoveBoard(moveRow, moveCol);
        let pieceCount = [0, 0, 0, 0];

        let currentBoard = 0;
        for (const board of moveBoard) {

            let lastPlayer = false; // Keep track if this is a sequence or not.
            let sequenceCount = 0;
            for (const cell of board) {

                // If the cell being looked at is the current player,
                // Then either add to the sequence, or start a new one.
                if (cell === player) {

                    // Start a new sequence
                    if (!lastPlayer) {
                        lastPlayer = true;
                    }

                    // Add to the sequence
                    sequenceCount++;
                }

                // Otherwise, keep going if this is stil not from the current player.
                // Or finalize the sequence if this is the end of a sequence.
                else {
                    if (!lastPlayer) {
                        sequenceCount = 0;
                        continue;
                    }

                    if (sequenceCount > pieceCount[currentBoard]) {
                        pieceCount[currentBoard] = sequenceCount;
                    }

                    lastPlayer = false;
                    sequenceCount = 0;
                }
            }

            // Attempt to finalize the sequence in case there was no
            // end to it in the loop.
            if (sequenceCount > pieceCount[currentBoard]) {
                pieceCount[currentBoard] = sequenceCount;
                lastPlayer = false;
                sequenceCount = 0;
            }

            currentBoard++;
        }

        // Return the highest sequence count.

        let pstring = player === GameScreen.PLAYERONE ? "Red" : "Blue";
        console.log(`\n============ Player: ${pstring} => Move At: (${moveRow}, ${moveCol})\nRow: ${pieceCount[0]} => ${moveBoard[0]}\nCol: ${pieceCount[1]} => ${moveBoard[1]}\nFD: ${pieceCount[2]} => ${moveBoard[2]}\nBD: ${pieceCount[3]} => ${moveBoard[3]}\n`);

        return Math.max(...pieceCount);
    }

    isWin = (moveRow, moveCol, player) => {
        // Returns:
        //  true if the passed move won the game
        //  false otherwise.

        if (this.numberTouching(moveRow, moveCol, player) >= 4) {
            return true;
        }

        return false;
    }

    playMove = (col) => {
        if (this.state.nextMove[col] === -1 || this.state.winner !== null) {
            return;
        }

        let gameBoard = [...this.state.gameState];
        gameBoard[this.state.nextMove[col]][col] = this.state.currentPlayer;

        let nextMove = [...this.state.nextMove];
        nextMove[col]--;

        let winner = null;
        if (this.isWin(this.state.nextMove[col], col, this.state.currentPlayer)) {
            winner = this.state.currentPlayer;
        }
        let currentPlayer = this.state.currentPlayer !== GameScreen.PLAYERONE ? GameScreen.PLAYERONE : GameScreen.PLAYERTWO;

        this.setState({
            gameState: gameBoard,
            nextMove,
            currentPlayer,
            winner,
        });
    }

    enterExamineState = () => {
        this.setState({
            examine: true,
        });
    }

    render() {
        let gameCells = [[],[],[],[],[],[]];

        for (let i = 0; i < GameScreen.NUMROWS; i++) {
            for (let j = 0; j < GameScreen.NUMCOLS; j++) {
                const key = `(${i},${j})`;
                
                let color_style;
                if (this.state.gameState[i][j] == GameScreen.UNPLAYED) {
                    color_style = { backgroundColor: "#666666" };
                } else if (this.state.gameState[i][j] == GameScreen.PLAYERONE) {
                    color_style = { backgroundColor: "#cc3311" };
                } else if (this.state.gameState[i][j] == GameScreen.PLAYERTWO) {
                    color_style = { backgroundColor: "#1133cc" };
                }
                else {
                    color_style = {};
                }

                const circle_style = Object.assign({}, styles.cell_circle, color_style);
                gameCells[i].push(
                    <TouchableOpacity activeOpacity={ 1 } key={key} style={ styles.game_cell } onPress={ () => { this.playMove(j); } }>
                        <TouchableOpacity activeOpacity={ 1 } style={ circle_style } onPress={ () => { this.playMove(j); } }/>
                    </TouchableOpacity>);
            }
        }

        let winner = this.state.winner === GameScreen.PLAYERONE ? "Red player" : "Blue player";

        return (
            <React.Fragment>
                <View style={ styles.main_container }>
                    <View style={ styles.game_board }>
                        { gameCells }
                    </View>
                </View>
                {
                    <Modal
                        animationType="slide"
                        visible={ this.state.winner !== null && !this.state.examine}
                        transparent={ true }
                    >
                        <View style={ { display: "flex", alignItems: "center", justifyContent: "center" } }>
                            <View style={ styles.modal_container }>
                                <Text style={ styles.victory_text }>{ winner } is the winner of the game.</Text>
                                <View style={ { display: "flex", flexDirection: "row", alignContent: "center", justifyContent: "space-between" } }>
                                    <View style={ styles.modal_button }>
                                        <Text style={ styles.modal_button_text } onPress={ () => { this.props.changeScreen(AppScreen.INVALIDATE); }}>
                                            New Game
                                        </Text>
                                    </View>
                                    <View style={ styles.modal_button }>
                                        <Text style={ styles.modal_button_text } onPress={ this.enterExamineState }>
                                            Examine Board
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Modal>
                }
            </React.Fragment>
        );
    }
}

const styles = StyleSheet.create({
    main_container: {
        flex: 1,
        display: "flex",
        backgroundColor: '#444444',
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: 'center',
    },
    modal_container: {
        flexGrow: 1,
        marginVertical: "15.5%",
        marginLeft: "7.5%",
        backgroundColor: '#333333f0',
        opacity: 1,
        paddingHorizontal: "2.5%",
        paddingBottom: "2.5%",
        paddingTop: "5%",
    },
    victory_text: {
        color: '#44cc44',
        fontSize: 20,
        marginBottom: "1%",
    },
    game_board: {
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "90%",
        maxWidth: "77%",
        flexWrap: "wrap",
        borderWidth: 3,
        borderColor: "#333333",
        paddingBottom: "7.5%",
        backgroundColor: "#bbbbbb"
    },
    game_cell: {
        flex: 1,
        backgroundColor: "#cccccc",
        minWidth: "10.5%",
        minHeight: "16.66%",
        borderWidth: 1,
        borderColor: '#333333'
    },
    cell_circle: {
        marginTop: "7%",
        height: "13%",
        marginLeft: "25%",
        marginRight: "25%",
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#333333'
    },
    modal_button: {
        flex: 1,
        display: "flex",
        backgroundColor: '#666666',
        borderWidth: 2,
        borderRadius: 50,
        borderColor: '#aaaaaa',
        marginHorizontal: "8%",
    },
    modal_button_text: {
        color: '#eeeeee',
        textAlign: "center",
        textAlignVertical: "center",
        paddingHorizontal: "3%",
    }
});
  