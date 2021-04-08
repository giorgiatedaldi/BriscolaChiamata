/**
 * Function to remove an element from an array
 * 
 * @returns array without the removed element
 */
Array.prototype.remove = function() {
  var what, a = arguments, L = a.length, ax;
  while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
          this.splice(ax, 1);
      }
  }
  return this;
};

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const module_briscola = require('./Briscola');
game = module_briscola.game;

/**
 * @class ServerBriscola to handle communications between cliets and server
 */
class ServerBriscola {

  /**
   * ServerBriscola's constructor
   * 
   * @param {number} port Port
   * @property {numer} disconnectedCounter Number of disconnected clients
   * @property {Array.<string>} socketID Array of sockets' id 
   * @property {Map} sockets Map with sockets' id (key) and sockets themselves (value)
   * @property {Game} match New match
   * @property {Player} players Player's array
   * @property {numer} auctionTurn Index to handle acution's turn
   * @property {Array.<string>} playersPassed Array of id od players who passed during the auction
   * @property {boolean} gameStared Indicates if the game is started or not
   * @property {number} readyPlayers Number of players ready to play
   * @property {number} countHands Counter to end the game once it's equal to 8
   * @property {Map} finalResults Map of players' id (key) and score (value) at the end of every match
   * @property {Map} playerNicknames Map with players' id (key) and players' nicknames (value)
   * @property {number} restartRequests Players who have requestd to play again
   * @property {Map} matchScores Map with players' id and scores of the 'general' match
   * @property {Array.<number>} differentNickname Array to differntiate players' nicknames if there are some copies
   * @property {Boolean} sixth Boolean to manage the connections from sixth onwards
   */
  constructor(port) {
    this.port = port;
    this.disconnectedCounter = 0;
    this.app = express();
    this.server = http.createServer(this.app, {
      cors: {
        origin: '*',
      }
    });
    this.io = socketIO(this.server, {
      cors: {
        origin: '*',
      }
    });
    this.socketID = [];   
    this.sockets = new Map();
    this.match = null;
    this.players = null;
    this.auctionTurn = 0;
    this.playersPassed= [];
    this.gameStared = false;
    this.readyPlayers = 0;
    this.countHands = 0;
    this.finalResults= new Map();
    this.playerNicknames = new Map();
    this.restartRequests = 0;
    this.matchScores = new Map();
    this.differentNickname=[1,2,3,4];
    this.sixth = false;
  }

  /**
   * Method to restart the match. It resets the attributes to create a new game and communicates to clients that
   * the game has been restarted
   * 
   * @param {string} cause Cause beacuse of the match has to be restarted
   */
  resetMatch(cause){
    console.log("\n\n------GAME ENDED: %s-------\n\n", cause);
      this.gameStared = false;
      this.auctionTurn = 0;
      this.readyPlayers = 0;
      this.countHands = 0;
      this.restartRequests = 0;
      this.finalResults= new Map();
    
      if (this.playersPassed.length<5) {
      this.playerNicknames= new Map();
      this.matchScores = new Map();
      this.differentNickname=[1,2,3,4];
    }
    this.playersPassed = [];

    for (let clientSocket of this.sockets.values()){
      clientSocket.emit("gameReset",cause);
    }
    
  }

  /**
   * Method to inizialize the server.
   */
  createServer() {
    console.log("Server socket:",this.socketID);
    
    //Sockets' connection management
    this.io.on('connection', (socket) => {
      socket.removeAllListeners('disconnect');

      //Sockets' disconnection management
      socket.on('disconnect', () => {
        //A player has voluntary disconnected
        if(!this.sixth){
          this.resetMatch("playerDisconnected");
          this.disconnectedCounter += 1;
          this.sockets.delete(socket.id);
          console.log("User Disconnected:", socket.id,"N=", this.disconnectedCounter);
          this.socketID.remove(socket.id);
        }
        else {
          //Forced disconnection of a player
          console.log("Sixth disconnected");
          this.sixth=false;
        }
      });
      console.log('New client connected: %s', socket.id);

      //Number of connected socket management
      if(this.sockets.size < 5) {
        this.socketID.push(socket.id);
        this.sockets.set(socket.id, socket);
        
        //To memorize scores' state for new matches
        for (let id of this.sockets.keys()) {
          this.matchScores.set(id, 0);
        }
        this.setUpGame();
      }
      else {
        //Server forces the disconnection of every socket from the sixth onward
        this.sixth=true;
        socket.disconnect();
      }      
    });
    this.server.listen(this.port, () => console.log(`Listening on port ${this.port}`));
  }

  /**
   * Method to set up a new game
   */
  setUpGame() {
    if (this.sockets.size==5)
    {
      this.socketID=[];
      for (let sock of this.sockets.keys()){
        this.socketID.push(sock);
      }
      console.log("\n------------NEW GAME STARTED-------------\n");
      this.gameStared = true;
      var match = new game(this.socketID);
      this.match = match;
      var players = match.giveCards();
      this.players = players;
      this.readyPlayers = 0;
      this.auctionTurn = 0;
      this.playersPassed = [];
      this.countHands = 0;
      this.finalResults= new Map();
      this.restartRequests = 0;
      this.differentNickname=[1,2,3,4];
      

      //debug
      console.log("\n--------------PLAYER CARDS:-------------");
      for (let pl of players){
        console.log("ID: ",pl.id,"\nCards:\n",pl.myCards);
      }
      console.log("\n--------------END OF PLAYER CARDS-------------\n");

      //Before installing any handler, other ones with the same name are uninstalled. This in order to avoid 
      //double placements
      console.log("\n---------------INSTALLING HANDLERS------------\n");
      for (var [clientID, clientSocket] of this.sockets.entries()) {
        clientSocket.emit("everybodyReady");
        
        //ReceiveCards HANDLER
        clientSocket.removeAllListeners('receiveCards');
        clientSocket.on('receiveCards', (player_id, player_nick) => {
          console.log("Received card request from",player_id);
          
          //Nicknames' management
          if (this.playerNicknames.size < 5) {
            this.checkNicknames(player_id, player_nick);
          }
          if (this.playerNicknames.size == 5){
            this.shareNicknames();
          }

          for (let i = 0; i < players.length; i++) {
            if (player_id == players[i].id) {
              //sending cards to every player
              this.sockets.get(player_id).emit('giveCards', players[i].myCards);
              console.log('\n--------Giving card to player %s on socket %s: ---------', player_id, this.sockets.get(player_id).id);
              console.log(players[i].myCards);
              console.log("-------------------------\n");
            }
          }
        });

        console.log("Installed card request handler for",clientSocket.id);
      }
      this.chat();
      this.auction();
      this.deck();
      this.waitForMove();
      console.log("\n-------------HANDLERS INSTALLED-------------\n");
    }
  }

  /**
   * Method used to communicate to clients, once the hand is over, who's the winner.
   * Here is also managed the request to look at the last hand of every players.
   */
  deck(){
    for (var clientSocket of this.sockets.values()) {
      //deck HANDLER
      clientSocket.removeAllListeners('deck');
      clientSocket.on('deck', (ID) => {
        this.io.sockets.emit('DisplayDeck', ID);
        console.log("\n----------DISPLAY DECK----------",ID);
      });

      //lastHand HANDLER
      // idLastHand is the player's id whose last hand wants to be seen, while idApplicant is who's asking for it
      clientSocket.removeAllListeners('lastHand');
      clientSocket.on('lastHand', (idLastHand, idApplicant) => {
        this.sockets.get(idLastHand).emit('requestLastHand', idApplicant);
        console.log("\nPlayer %s asks for %s last hand",idApplicant,idLastHand);
      });

      //myLastHand HANDLER
      //The last hand requested is received from server which will communicate it to the right client 
      clientSocket.removeAllListeners('myLastHand');
      clientSocket.on('myLastHand', (idApplicant, lastHand) => {
        console.log("\nReceived lastHand from %s:",clientSocket.id);
        console.log(lastHand);
        this.sockets.get(idApplicant).emit('displayLastHand', lastHand);
        console.log("\nEmitting last hand required from %s:",idApplicant);
      });
    }
  }

  /**
   * Method which manages the chat. Once a messages is received from a socket, it's broadcasted to all the others
   */
  chat(){
    for (var clientSocket of this.sockets.values()) {
      //SendMessage HANDLER
      clientSocket.removeAllListeners('SendMessage');
      clientSocket.on('SendMessage', (ID, text) => {
        this.io.sockets.emit('DisplayMessages', ID, text);
        console.log("\nMessage sent to all sockets ID:%s text:%s",ID,text);
      });
    }
  }

  /**
   * Method to check and deal with equal nicknames.
   * @param {string} id Player's id
   * @param {string} n Player's nickname
   */
  checkNicknames(id,n){
    let found = false;
          if (this.playerNicknames.size !== 0) {
            for (let nick of this.playerNicknames.values()) {
              if (n === nick) {
                n = n + this.differentNickname[0];
                this.differentNickname.shift();
                found = true;
              }
            }
            if (!found) {
              this.playerNicknames.set(id, n);
            }
            else{
              this.checkNicknames(id, n);
            }
          }
          else {
            this.playerNicknames.set(id, n);
          }
  }
 
  /**
   * Method to communicate to clients all the nicknames
   */
  shareNicknames(){
    console.log("Emitting Nicknames to players");
    let tmp = new Map();
    for (let sockID of this.sockets.keys()){
      tmp.set(sockID, this.playerNicknames.get(sockID));
    }
    this.io.sockets.emit("shareUnames", Array.from(tmp));
  }

  /**
   * Method to update the auction and verify if it's over or not
   */
  updateAuction() {
    let nextPlayer = Array.from(this.sockets.keys())[this.auctionTurn];

    //If a player pass during the auction he will automatically make a 0 offer to the server, so if the last player who did an offer
    //is equal to the player who has to play the auction is over
    if (this.match.currentAuction[0] == nextPlayer){
      console.log("Auction over: %s %s %s", this.match.currentAuction[1],nextPlayer,this.match.currentAuction[2]);
      for (let clientSocket of this.sockets.values()) {
        clientSocket.emit("auctionOver", this.match.currentAuction[1],nextPlayer,this.match.currentAuction[2]);
      }
    }
    else {
      for (let clientSocket of this.sockets.values()){
        clientSocket.emit("sendOffer", this.match.currentAuction[0], this.match.currentAuction[1],nextPlayer,this.match.currentAuction[2]);
      }
    }
    
  }

  /**
   * Auction's management
   */
  auction(){
    for (let [clientId, clientSocket] of this.sockets.entries()) {

      //passed HANDLER
      clientSocket.removeAllListeners('passed');
      clientSocket.on("passed",(ID) => {
        this.playersPassed.push(ID);
      });
      
      //putOffer HANDLER
      clientSocket.removeAllListeners('putOffer');
      clientSocket.on("putOffer", (value, ID, pts) => {
        console.log("Client %s offered card %s at %s points", ID, value, pts);
        //Value = 0 means the client passed
        if (value != 0){
          this.match.setAuction(ID,value,pts);
        }
        this.auctionTurn = (this.auctionTurn+1)%5;
        if (this.playersPassed.length < 5){
          this.updateAuction();
          console.log("Client %s turn", Array.from(this.sockets.keys())[this.auctionTurn]);
        }
        else {
          console.log("Everybody passed: restarting match...");
          console.log(this.matchScores);
          this.resetMatch("everybody passed");
          this.setUpGame();
        }
        });
      console.log("Installed offer handle for",clientId);
      
      //sendOfferRequest HANDLER
      clientSocket.removeAllListeners('sendOfferRequest');
      clientSocket.on("sendOfferRequest", (ID) => {
        this.readyPlayers += 1;
        console.log("Player %s is ready, %s ready now", ID, this.readyPlayers);
        if (this.readyPlayers === 5) {
          //communicates to clients the actual 'winning offer'
          for (let [clientID,clientSocket] of this.sockets.entries()) {
            clientSocket.emit("sendOffer", this.match.currentAuction[0], this.match.currentAuction[1],
                              Array.from(this.sockets.keys())[this.auctionTurn],
                              this.match.currentAuction[2]);
            console.log("Sent client %s sendOffer, client %s turn", clientID, Array.from(this.sockets.keys())[this.auctionTurn]);
          }
        }
      });
      console.log("Installed offerRequest handle for",clientId);

      //putOfferType HANDLER
      clientSocket.removeAllListeners('putOfferType');
      clientSocket.on("putOfferType", (value, ID, type) => {
        //Auction's over and the winner decided the briscola
        this.match.setBriscola(value,type);
        console.log("Player %s set briscola to %s of %s", ID, value, type);
        this.io.sockets.emit("setBriscola", value, ID, type);
        this.io.sockets.emit("newHandOrder", this.match.currentTurn);
        this.match.setTeams();
        this.setTurn(this.match.currentTurn[0]);
      });
      console.log("Installed putOfferType handle for",clientId);
    }
    
  }

  /**
   * Manages the end of the match by communicating it to clients and sending them individual and team scores.
   * Manges also the match restart if all the five clients agree
   */
  endOfMatch(){
    this.socketID = [];
    for (let clientSocket of this.sockets.values()){
      clientSocket.emit("matchOver");
      clientSocket.removeAllListeners("sendSingleScores");
      clientSocket.on("sendSingleScores", (score) => {
        this.finalResults.set(clientSocket.id, score);
        if (this.finalResults.size == 5){
          let tempCallers=[];
          let tempOpponents=[];
          console.log("Final Results: ");
          console.log(this.finalResults);
          for (let pl of this.match.callerTeam){
            tempCallers.push([pl, this.finalResults.get(pl)]);
            console.log("Caller team points added: %s", this.finalResults.get(pl));
          }
          for (let pl of this.match.opponentTeam){
            tempOpponents.push([pl, this.finalResults.get(pl)]);
            console.log("Opponent team points added: %s", this.finalResults.get(pl));
          }

          this.match.setMatchScores(tempCallers, tempOpponents, this.matchScores);

          //Sending scores to opponent and caller team
          for (let pl of this.match.callerTeam){
            this.sockets.get(pl).emit("scores", tempCallers, tempOpponents, Array.from(this.matchScores));
          }
          for (let pl of this.match.opponentTeam){
            this.sockets.get(pl).emit("scores", tempCallers, tempOpponents, Array.from(this.matchScores));
          }
        }
      });

      //Managing a new match with the same players
      clientSocket.removeAllListeners("askForRestart");
      clientSocket.on("askForRestart", () => {
        this.restartRequests += 1;
        this.socketID.push(clientSocket.id);
        console.log("Client %s asked for restart, %s so far", clientSocket.id, this.restartRequests);
        if (this.restartRequests == 5){
          this.socketID=[];
          console.log("Match restarted");
          for (let [id, s] of this.sockets.entries()){
            this.socketID.push(id);
          }

          //Changing the sockets' order before restarting
          let firstElement = this.socketID.shift();
          let firstSocket = this.sockets.get(firstElement);
          this.sockets.delete(firstElement);
          this.sockets.set(firstElement,firstSocket);
          this.socketID.push(firstElement);  
          this.io.sockets.emit("okToRestart");
          this.setUpGame();
        }
      });
    }
  }

  /**
   * Managing the next hand: it's checked if it's the last one, otherwise the order of the new hand is setted.
   * 
   * @param {Array} winnerHand Array with the player's id and its 'winning' card
   * @returns 
   */
  nextHand(winnerHand){
    console.log("\n ----------- WINNER HAND -------------\n");
    console.log(winnerHand);
    for (let clientSocket of this.sockets.values()){
      clientSocket.emit("handOver", winnerHand[0]);
      console.log("Sent handOver to %s",clientSocket.id);
    }
    this.countHands++;
    let tmp = false;
    this.match.currentTurn = [];

    if (this.countHands===8){
      this.endOfMatch();
      return;
    }

    //Setting next turn's order
    for (let i = 0; this.match.currentTurn.length < 5; i = (i+1)%5){
      if ((this.players[i].id == winnerHand[0] && !tmp) || (tmp && this.players[i].id != winnerHand[0])){
        this.match.currentTurn.push(this.players[i].id);
        tmp = true;
      }
    }

    //Clear hand
    this.match.currentHand.clear();
    this.io.sockets.emit("newHandOrder", this.match.currentTurn);
    this.setTurn(this.match.currentTurn[0]);  
  }

  /**
   * Method to handle the match
   */
  waitForMove() {
    for (var [clientId, clientSocket] of this.sockets.entries()) {
      
      //playCard HANDLER
      clientSocket.removeAllListeners('playCard');
      clientSocket.on("playCard", (myId, playedCard) => {

        //Everytime a card is played the currentHand's array  is updated
        console.log("Client %s played card %s %s", myId, playedCard.value, playedCard.type);
        this.match.currentHand.set(myId, playedCard);
        this.io.sockets.emit("cardPlayed", myId, playedCard);
        let winnerHand = this.match.setWinnerHand();
        
        if (winnerHand!=null){
          this.nextHand(winnerHand);
        }
        else {
          //The player who played the card, who's the first in the array, is removed from it
          this.match.currentTurn.splice(0,1);
          if (this.match.currentTurn.length > 0) {
            this.setTurn(this.match.currentTurn[0]);
          }
        }
      });
      console.log("Installed play handle for",clientId);
    }
  }

  /**
   * Method communicate a specific client that's its turn to play
   * 
   * @param {string} ID player's id
   */
  setTurn(ID) {
    for (var [clientId, clientSocket] of this.sockets.entries()) {
      if (clientId===ID){
        clientSocket.emit("isYourTurnToPlay", ID)
        console.log("Client %s turn to play", ID);
      }   
    }
  }
}

var briscolaInCinque = new ServerBriscola(4001);
briscolaInCinque.createServer();
