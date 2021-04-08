/**
 * @class Card to define each property of cards.
 */
class Card {

    /**
     * Card constructor
     * 
     * @param {string} type  The card's type: Bastoni, Coppe, Denari or Spade 
     * @param {string} value The card's value: from 1 to 10
     * @param {number} score The card's score according to value
     */
    constructor(type, value, score) {
        this.type = type;
        this.value = value;
        this.score = score;
    }
}

/**
 * @class Deck to create and shuffle a deck
 */
class Deck {

    /**
     * Deck constructor
     */
    constructor() {
        this.types = ["Denari", "Bastoni", "Spade", "Coppe"];
        this.scores = [11, 0, 10, 0, 0, 0, 0, 2, 3, 4];
        this.cards = [];
        for (let i = 0; i < 40; i++){
            this.cards.push(new Card(this.types[Math.floor(i/10)], (i%10)+1, this.scores[i%10]));
        }
    }

    /**
     * Method to shuffle the deck
     */
    shuffle() {
        for (var i = this.cards.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = this.cards[i];
            this.cards[i] = this.cards[j];
            this.cards[j] = temp;
        }
    }
}

/**
 * @class Player to define a player
 */
class Player {

    /**
     * Player constructor
     * 
     * @param {string} id Player's id is equal to socket's id
     * @property {Array.<Card>} myCards Player's cards'
     */
    constructor(id) {
        this.id = id;
        this.myCards = [];
    }
}

/**
 * @class Game to create and handle a match
 */
class Game { 

    /**
     * Game constructor
     * 
     * @param {Array.<string>} playersID Array of players' id (sockets' id)
     * @property {Deck} deck Match's deck
     * @property {Array.<Player>} players Array of objects Player
     * @property {Array} currentAuction Array with information about current auction: player's id, card's value and points to win 
     * @property {Array} briscola Array with information about the final briscola: card's value and type
     * @property {Array.<string>} callerTeam Array of player's id who's making the call and his partner
     * @property {Array.<string>} opponentTeam Array of others players' id 
     * @property {Array.<string>} currentTurn Array of players' order of current turn
     * @property {Map} currentHand The map contains a list of id of player (key) who's playing the card (value)
     */
    constructor(playersID) {
        this.playersID = playersID;
        this.deck = new Deck();
        this.deck.shuffle();
        this.players = []; 
        this.currentAuction = [];
        this.briscola = [];
        this.callerTeam = [];
        this.opponentTeam = [];
        this.currentTurn = playersID; 
        this.currentHand = new Map();
    }

    /**
     * Method to give cards to players
     * 
     * @returns Array of players with id and cards
     */
    giveCards() {
        for (let j = 0; j < 5; j++) {
            this.players[j]= new Player(this.playersID[j]);
        } 
        for (let i = 8; i > 0 ; i--) { 
            for (let j = 0; j<this.players.length; j++){
                this.players[j].myCards.push(this.deck.cards.pop());
            }
        }
        return this.players; 
    }

    /**
     * Method to define the 2 teams once the acution's over.
     */
    setTeams() {
        this.callerTeam.push(this.currentAuction[0]);
        
        //Defines the first team: the one with the player who won the auction
        for (let i=0; i<this.players.length; i++) {
            let temp = this.players[i];
            for (let j=0; j<temp.myCards.length; j++) {
                if (temp.myCards[j]['type'] === this.briscola[1] && temp.myCards[j]['value'] === this.briscola[0] && temp.id !== this.currentAuction[0]) {
                    this.callerTeam.push(temp.id);
                    break;
                }
            }
        }

        //Defines the opponent team
        for (let i=0; i<this.players.length; i++) {
            if (this.callerTeam.indexOf(this.players[i].id) === -1){
                this.opponentTeam.push(this.players[i].id);
            }
        }

        console.log('\n ---------CALLER TEAM--------\n');
        console.log(this.callerTeam);
        console.log('\n ---------OPPONENT TEAM--------\n');
        console.log(this.opponentTeam);
    }

    /**
     * Method to set the current auction team
     * 
     * @param {string} playerID Player's id
     * @param {number} card_value Card's value
     * @param {number} points Points to win the match
     */
    setAuction(playerID,card_value,points){
        this.currentAuction = [playerID, card_value,points];
    }

    /**
     * Method to set the winning card to briscola
     * 
     * @param {number} value Briscola's value
     * @param {string} type Briscfola's type
     */
    setBriscola(value, type){
        this.briscola = [value,type];
    }
    
    /**
     * Method to select the max card's value of a specif type in the current hand
     * 
     * @param {string} type Card's type
     * @param {Map} currentHand Match's current hand
     * @returns the card of the specified type which has the max card's value
     */
    selectMax(type, currentHand) {
        let maxCard = [];
        let maxToSelect = new Map();

        //The value of the card also depends on its score. A map is created containing a list of players' id (key) and 
        // an "absolute" cards' grade (value) to order them according to both score and value
        for (var [playerId, card] of this.currentHand.entries()) {
            if (card['type'] === type) {
                maxToSelect.set(playerId, card['score']*3+card['value']);
            }
        }
        console.log('\n--------MAX TO SELECT--------\n');
        console.log(maxToSelect);
        let max = Math.max(...maxToSelect.values());
        console.log('\n--------MAX selected--------\n');
        console.log(max);

        //It's selected the card with the max absolute grade and the player who played it
        for (var [playerId, card] of this.currentHand.entries()) {
            if (card['score']*3+card['value']=== max && card['type'] === type) {
                maxCard.push(playerId, card);
            }
        }
        return maxCard;
    }

    /**
     * Method to establish which player won the hand
     * 
     * @property {Array} maxBriscola The highest briscola on table
     * @property {Array} maxCardOfFirstType The highest card with type equal to the first one
     * @returns an array with the player's id and its 'winning' card
     */
    setWinnerHand() {
        if (this.currentHand.size === 5) {
            let maxBriscola = this.selectMax(this.briscola[1], this.currentHand);
            if (maxBriscola.length === 0) {
                let maxCardOfFirstType = this.selectMax(this.currentHand.values().next().value['type'], this.currentHand);
                console.log('maxvalue: ');
                console.log(maxCardOfFirstType);
                return maxCardOfFirstType;
            }
            return maxBriscola;
        }
        return null;
    }

    /**
     * The final scores are duplicated or tripled according to points called during the auction
     */
    scoreModule() {
        let points = this.currentAuction[2];
        if (points < 70) {
            return 1;
        }
        else if (points < 80) {
            return 2;
        }
        else if (points < 120) {
            return 3;
        }
    }

    /**
     * Method to upgrade the scores of the 'general' match according to the result of the actual match.
     * The sum of players' general scores must be 0 after every match.
     * 
     * @param {Array.<Array>} callerScores In the position 0 of every array there is the player's id, while in the 1 one the score of this match
     * @param {Array.<Array>} opponentScores In the position 0 there is the player's id, while in the position 1 the score of this match
     * @param {Map} matchScores Map with players' id and scores of the 'general' match which has to be upgraded
     */
    setMatchScores(callerScores, opponentScores, matchScores) {
        let totCaller = 0;
        let wonOrLost = 0;
        let callerPoint = 0;
        let shutout = 4;

        //Computing the score of caller team and comparing it to the point called during the auction to verify if the team has won or lost
        for (let i=0; i<callerScores.length; i++) {
            totCaller += callerScores[i][1];
        }
        if (totCaller >= this.currentAuction[2]) {
            wonOrLost = 1;
        }
        else {
            wonOrLost = -1;
        }

        //The caller choose another player's card
        if (callerScores.length === 2) {
            for (let i=0; i<callerScores.length; i++) {
                if (callerScores[i][0] === this.currentAuction[0] && totCaller !== 120 && totCaller !== 0) {
                    //Caller's score 
                    console.log("setting point of caller %s: %s", callerScores[i][0], wonOrLost*2*this.scoreModule())
                    callerPoint += wonOrLost*2*this.scoreModule();
                    matchScores.set(callerScores[i][0], wonOrLost*2*this.scoreModule() + matchScores.get(callerScores[i][0]));
                }
                else if (callerScores[i][0] !== this.currentAuction[0] && totCaller !== 120 && totCaller !== 0) {
                    //Partner's score
                    console.log("setting point of socio %s: %s", callerScores[i][0], wonOrLost*this.scoreModule())
                    callerPoint += wonOrLost*this.scoreModule();
                    matchScores.set(callerScores[i][0], wonOrLost*this.scoreModule()+ matchScores.get(callerScores[i][0]));
                } 
                else if (callerScores[i][0] === this.currentAuction[0] && totCaller === 120) {
                    //Caller's score during a winning shutout
                    callerPoint += 2*shutout;
                    matchScores.set(callerScores[i][0], 2*shutout + matchScores.get(callerScores[i][0]));
                }
                else if (callerScores[i][0] !== this.currentAuction[0] && totCaller === 120) {
                    //Partner's score during a winning shutout
                    callerPoint += shutout;
                    matchScores.set(callerScores[i][0], shutout + matchScores.get(callerScores[i][0]));
                }
                else if (callerScores[i][0] === this.currentAuction[0] && totCaller === 0) {
                    //Caller's score during a losing shutout
                    callerPoint += (-2)*shutout;
                    matchScores.set(callerScores[i][0], -2*shutout + matchScores.get(callerScores[i][0]));
                }
                else if (callerScores[i][0] !== this.currentAuction[0] && totCaller === 0) {
                    //Caller's score during a losing shutout
                    callerPoint += (-1)*shutout;
                    matchScores.set(callerScores[i][0], -shutout + matchScores.get(callerScores[i][0]));
                }
                
            }
        }
        //The caller choose his own card
        else {
            if (totCaller !== 0 && totCaller != 120) {
                callerPoint += wonOrLost*4*this.scoreModule();
                matchScores.set(callerScores[0][0], wonOrLost*4*this.scoreModule() + matchScores.get(callerScores[0][0]));
            }
            else if (totCaller === 120) { 
                //Caller's score during a winning shutout
                callerPoint += 4*shutout;
                matchScores.set(callerScores[0][0], 4*shutout + matchScores.get(callerScores[0][0]));
            }
            else if (totCaller === 0) { 
                //Caller's score during a losing shutout
                callerPoint += (-4)*shutout;
                matchScores.set(callerScores[0][0], -4*shutout + matchScores.get(callerScores[0][0]));
            }
            
        }

        //Opponent team scores
        for (let i=0; i<opponentScores.length; i++) {
            if (opponentScores.length === 3) {
                console.log("setting point of opponent %s: %s", opponentScores[i][0], -(callerPoint/3))
                matchScores.set(opponentScores[i][0], -(callerPoint/3) + matchScores.get(opponentScores[i][0]));
            }
            else {
                console.log("setting point of opponent %s: %s", opponentScores[i][0], -(callerPoint/4))
                matchScores.set(opponentScores[i][0], -(callerPoint/4) + matchScores.get(opponentScores[i][0])); 
            }
        }
        console.log('\n-----Match Scores-----\n');
        console.log(matchScores);
 
    }
}

module.exports = {
    card: Card, 
    deck: Deck, 
    game: Game,
    player: Player
};
