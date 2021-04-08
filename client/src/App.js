import React, { Component } from "react";
import socketIOClient from "socket.io-client";
import './App.css';
class App extends Component {
  /**
     * Constructor
     * 
   */
  constructor() {
    super();
    this.all_cards = [1,3,10,9,8,7,6,5,4,2];
    this.all_types = ["Denari", "Bastoni", "Spade", "Coppe"];
    this.state = {
      endpoint: "localhost:4001",
      color: 'rgb(145, 208, 246)',
      cards: null, //Player's card
      priv_socket: null, //Player's socket
      available_card_values:[], //Cards available for the auction
      myTurn: false, //Indicates if it's the player's turn
      hasPassed: false, //Indicates if the player has passed
      auctionResult: [], //It contains player's id who won the auction, card's value and points
      winningPts: 60, //Points to win by default are 60
      briscola: null, //It contains card's value, player's id who won the auction and card's value
      restartReason: null, //Reason of restarting the match
      everybodyReady: false, //True if 5 clients are connected
      scoreDeck: [], //Player's deck: it contains all the won hands by the player
      hand: [], //Everytime a player plays a card, this one is inserted in the array
      handIds: [], //It contains the players' id who are playing cards, in order
      matchIsOver: false, //Indicates the end of a match
      teamsScore: null,  //It contains 2 array, each one contains information about the final scores of players of both teams
      nickname: null, //Player's nickname
      allNicknames: null, //Map with player's id (key) and nickname (value)
      matchScores: null, //Scores of the 'general' match
      waitingForRestart: false, //True once the player agrees to play again
      handOrder: null, //The actual order of the hand
      myMatchOrder: null, //Player's specific order of the table
      myNicknamesOrder: null, //Player's specific order of nicknames
      currentAuction:[], //Actual winning auction
      messages:[], //It contains all messages
      handsWinners:[], //It contains all hands' winners
      requiredLastHand: [], //Last hand that has to be shown, if requested by the player
      buttonChat:false, //True if clicked, to open the chat 
      notification:false, //True if there are unread messages
      rules:false, //True if the rules have to be displayed
      shuffle:false //True if player decides to order cards
    };
    document.getElementById("Rules").style.visibility="hidden";
    
  }
  
  /**
   * Setting ready the client installing required handlers
   */
  setReady(){
    var sock = this.state["priv_socket"];
    if (sock!=null && sock.connected) {
      let nick = null;
      //Setting player's nickname
      if (this.state.nickname != null) {
        nick = this.state.nickname;
      }
      else{
        nick = document.getElementById("Username").value;
      }

      
   
      //giveCards HANDLER
      //Setting player's cards and informing server he's ready to send offers
      sock.removeAllListeners('giveCards');
      sock.on('giveCards', (yourCards) => {
        this.setState({
          cards: yourCards,
          available_card_values: [1,3,10,9,8,7,6,5,4,2],
        });
        sock.emit("sendOfferRequest", sock.id);
      });

      //shareUnames HANDLER
      sock.removeAllListeners("shareUnames");
      sock.on("shareUnames", (allNicks) => {
        this.setState({allNicknames: allNicks});
        this.myNicknamesOrder();
      });

      //sendOffer HANDLER
      sock.removeAllListeners('sendOffer');
      sock.on("sendOffer", (currentID, currentOffer, turnID, points) => {
        let tmp = this.state.available_card_values;
        let i = 0;
        for (i = 0; i < tmp.length; i++) {
          if (i < tmp.length && tmp[i] === currentOffer){
            break;
          }
        }
        //Card available in the array
        if (i < tmp.length-1){ 
          tmp.splice(0,i+1);
        }
        //Player called 2
        else if (i === tmp.length-1){ 
          tmp.splice(0,i);
          this.setState({winningPts: points+1});
        }
        let cAuction=[];
        cAuction.push(currentID, currentOffer,points);
        
        //Updating the available cards for the auction
        this.setState({
          available_card_values: tmp, 
          currentAuction: cAuction
        });
        if (turnID === this.state.priv_socket.id){
          this.setState({myTurn: true});
          //Player who pass is emitting a 0 offer
          if (this.state.hasPassed || this.state.available_card_values.length===0){
            this.state.priv_socket.emit("putOffer",0,this.state.priv_socket.id,60);
          }
        }
        else{
          this.setState({myTurn: false});
        }
      });

      //auctionOver HANDLER
      //Updating the winning auction
      sock.removeAllListeners('auctionOver');
      sock.on("auctionOver", (winningOffer, winningPlayer, wPts) =>{
        this.setState({auctionResult: [winningPlayer, winningOffer, wPts]});
      });

      //setBriscola HANDLER
      //Updating the briscola once the player who called chooses briscola's type
      sock.removeAllListeners('setBriscola');
      sock.on("setBriscola", (value, ID, type) => {
        this.setState({
          briscola: [value, ID, type],
          myTurn:false});
      });

      //isYourTurnToPlay HANDLER
      sock.removeAllListeners('isYourTurnToPlay');
      sock.on("isYourTurnToPlay", (ID) => {
        this.setState({myTurn:true});
      });

      //newHandOrder HANDLER
      //Updating the new hand's order according to the previous hand's winner
      sock.removeAllListeners("newHandOrder");
      sock.on("newHandOrder", handOrder =>{
        this.setState({handOrder: handOrder});
        this.myPlayersOrder();
      });

      //handOver HANDLER
      //Updating the score deck once the hand is over
      sock.removeAllListeners("handOver");
      sock.on("handOver", (winner_id) =>{
        if (winner_id === sock.id){
          let tmp = this.state.scoreDeck;
          for (let c of this.state.hand){
            tmp.push(c);
          }
          this.setState({scoreDeck: tmp});
        }
      });

      //matchOver HANDLER
      //Sending to server player's score
      sock.removeAllListeners('matchOver');
      sock.on("matchOver", () => {
        this.setState({
          matchIsOver: true, 
          cards: null});
        let totalResult=0;
        for (let c of this.state.scoreDeck)
        {
          totalResult+=c.score;
        }
        sock.emit("sendSingleScores", totalResult);
      });

      //scores HANDLER
      sock.removeAllListeners('scores');
      sock.on("scores", (totScoreCallers, totScoreOpponents, matchScores) => {
        this.setState({
          teamsScore: [totScoreCallers, totScoreOpponents], 
          matchScores: matchScores});
      });

      //cardPlayed HANDLER
      sock.removeAllListeners('cardPlayed');
      sock.on("cardPlayed", (ID, card) => {
        if (this.state.hand.length===5){
          this.setState({
            hand:[], 
            handIds: []
          });
        }
        let tmp=this.state.hand;
        let tempNick = this.state.handIds;
        tmp.push(card);
        tempNick.push(ID);
        this.setState({
          hand:tmp, 
          handIds: tempNick
        });
      });

      //DisplayMessages HANDLER
      //Updating messages and checking if there are unread messages
      sock.removeAllListeners('DisplayMessages');
      sock.on("DisplayMessages", (ID, msg) => {
        let temp=[]; 
        let arr=this.state.messages;
        temp.push(ID,msg);
        arr.push(temp);
        this.setState({messages:arr});
        if(ID!==this.state.priv_socket.id && !this.state.buttonChat){
          this.setState({notification:true})
        } else {
          this.setState({notification:false})
        }
      });

      //DisplayDeck HANDLER
      sock.removeAllListeners('DisplayDeck');
      sock.on("DisplayDeck", (ID) => {
        if(this.state.hand!==null&&this.state.hand.length===1){
          let tmp=this.state.handsWinners;
          for (let i=0; i< this.state.myMatchOrder.length; i++){
            if (this.state.myMatchOrder[i]===ID){
              tmp.push(ID);
            }
          }
          this.setState({handsWinners:tmp});
      }
        
      });

      //requestLastHand HANDLER
      //Sending to server player's last hand that has been requested by another player
      sock.removeAllListeners('requestLastHand');
      sock.on("requestLastHand", (idApplicant) => {
        let temp = this.state.scoreDeck;
        let lastHand = [];
        if (this.state.scoreDeck !== null) {
          temp.reverse();
          for (let i=0; i<5; i++){
            lastHand.push(temp[i]);
          }
          temp.reverse();
        }
        sock.emit('myLastHand', idApplicant, lastHand);
      });

      //displayLastHand HANDLER
      //Updating the last hand that is wanted to be seen from the player
      sock.removeAllListeners('displayLastHand');
      sock.on("displayLastHand", (lastHand) => {
        this.setState({requiredLastHand: lastHand});
      });

      if (nick.length > 0){
        this.setState({
          color: "green", 
          nickname: nick, 
          waitingForRestart: false});
        sock.emit('receiveCards', sock.id, nick);
      }
      else{
        this.setState({
          color: "green", 
          nickname: sock.id, 
          waitingForRestart: false});
        sock.emit('receiveCards', sock.id, sock.id);
      }

      
    }
  }
  
  /**
   * Method called when the player push one of the button during the auction
   * 
   * @param {Card} value card proposed for the auction
   */
  sendOffer(value){
    if (this.state.myTurn){
      this.state.priv_socket.emit("putOffer", value, this.state.priv_socket.id, this.state.winningPts);
      if (value === 0){
        this.state.priv_socket.emit("passed",this.state.priv_socket.id);
        this.setState({hasPassed: true});
      }
    }
  }

  /**
   * Method called once the auction's winner chooses the briscola's type
   * 
   * @param {number} value briscola's value
   * @param {string} type briscola's type
   */
  sendOfferType(value, type){
    let cardNames = ["Asso","2","3","4","5","6","7","Fante","Cavallo","Re"];
    this.state.priv_socket.emit("putOfferType", value,this.state.priv_socket.id, type);
    let tmp = []
    tmp.push(cardNames[this.state.auctionResult[1]-1]);
    tmp.push(type);
    this.setState({briscola: tmp});
  }

  /**
   * Method to manage clients' connection
   */
  componentDidMount() {
    const socket = socketIOClient(this.state.endpoint);
    socket.on('connect', () => {
      
      //everybodyReady HANDLER
      socket.removeAllListeners('everybodyReady');
      socket.on("everybodyReady", () => {
        this.setState({
          everybodyReady: true
        });
       
      });

      //gameReset HANDLER
      socket.removeAllListeners('gameReset');
      socket.on("gameReset", (cause) => {
        this.buttonBack();
        this.setState({
          color: 'rgb(145, 208, 246)',
          cards: null,
          available_card_values:[],
          myTurn: false,
          hasPassed: false,
          auctionResult: [],
          winningPts: 60,
          briscola: null,
          restartReason: cause,
          everybodyReady: false,
          scoreDeck: [],
          hand: [],
          handIds: [],
          matchIsOver: false,
          teamsScore: null,
          matchScores: null,
          waitingForRestart: false,
          handOrder: null,
          myMatchOrder: null,
          myNicknamesOrder: null,
          currentAuction:[],
          messages:[],
          handsWinners:[],
          requiredLastHand: [],
          buttonChat:false,
          notification:false,
          shuffle:false
        });
      });
      this.setState({priv_socket: socket});
      document.getElementById("Rules").style.visibility="hidden";
    });
  }
  
  /**
   * Method to play a card
   * 
   * @param {Card} c played card 
   */
  playCard(c){
    if (this.state.myTurn && this.state.briscola!==null && this.state.briscola.length ===3){
      let myCards = this.state.cards;
      for (let i = 0; i < myCards.length; i++) {
        if (myCards[i]===c){
          myCards.splice(i,1);
        }
      }
      this.state.priv_socket.emit("playCard",this.state.priv_socket.id,c);
      let temp=this.state.countHands;
      temp++;
      this.setState({
        countHands: temp, 
        cards: myCards, 
        myTurn:false
      });
    } 
    this.isDeck();
  }

  /**
   * Method to get player's nickname
   * 
   * @param {string} ID id of the player whose nickname is requested
   * @returns requested nickname if exists otherwise player's id
   */
  getNickname(ID){
    if (this.state.allNicknames != null){
      for (let player of this.state.allNicknames){
        if (player[0] === ID){
          return player[1];
        }
      }
    }
    return ID;
  }

  /**
   * Method to manage the view of long nicknames 
   * 
   * @param {string} ID 
   * @returns managed nickname
   */
  manageNicknames(ID){
    if (this.state.allNicknames !== null){
      for (let i=0; i< this.state.allNicknames.length;i++){
        if (this.state.allNicknames[i][0]===ID){
          if (this.state.allNicknames[i][1].length<=10){
            return (this.state.allNicknames[i][1]);
          }
          else{
            return ((this.state.allNicknames[i][1]).slice(0,6)+"...");
          }
        }
      }
    }
    return ID;
  }
  

  /**
   * Method called to restart a match once one is over and players ask to play again
   */
  restartMatch(){
    this.buttonBack();
    this.state.priv_socket.emit("askForRestart");
    this.setState({
      color: 'rgb(145, 208, 246)',
      cards: null,
      available_card_values:[],
      myTurn: false,
      hasPassed: false,
      auctionResult: [],
      winningPts: 60,
      briscola: null,
      restartReason: null,
      everybodyReady: true,
      scoreDeck: [],
      hand: [],
      handIds: [],
      matchIsOver: false,
      teamsScore: null,
      waitingForRestart: true,
      handOrder: null, 
      myMatchOrder: null,
      myNicknamesOrder: null,
      currentAuction:[],
      messages:[],
      handsWinners:[],
      requiredLastHand: [],
      buttonChat:false,
      notification:false,
      shuffle:false
    });
    this.state.priv_socket.removeAllListeners("okToRestart");
    this.state.priv_socket.on("okToRestart", () => this.setReady());
  }

  /**
   * Method to establish the specific order of the players on the table
   */
  myPlayersOrder(){
    let temp=[];   
      if (this.state.handOrder!==null){
      while(temp.length<5){
        for (let j=0;j<this.state.handOrder.length;(j++)%5){
          if (this.state.priv_socket.id===this.state.handOrder[j] && temp!==null && temp.length<5){
            temp.push(this.state.handOrder[j]);
          }
          if (temp.length>0 && this.state.priv_socket.id!==this.state.handOrder[j] && temp!==null && temp.length<5){
            temp.push(this.state.handOrder[j]);
          }
        }
      }
      this.setState({myMatchOrder: temp});
    }
  }

  /**
   * Method to establish the specific order of the players' nickname on the table
   */
  myNicknamesOrder(){
    let temp=[];   
      if (this.state.allNicknames!==null){
      while(temp.length<5){
        for (let j=0;j<this.state.allNicknames.length;(j++)%5){
          if (this.state.priv_socket.id===this.state.allNicknames[j][0] && temp!==null && temp.length<5){
            temp.push(this.state.allNicknames[j][1]);
          }
          if (temp.length>0 && this.state.priv_socket.id!==this.state.allNicknames[j][0] && temp!==null && temp.length<5){
            temp.push(this.state.allNicknames[j][1]);
          }
        } 
      }
      this.setState({myNicknamesOrder: temp});
    }
  }

  /**
   * Method to sent a message once the chat button is clicked
   */
  sendMessage(){
    let msg = document.getElementById("TextChat").value;
    if (msg!==""){
      this.state.priv_socket.emit("SendMessage", this.state.priv_socket.id, msg);
    }
    document.getElementById("TextChat").value="";
  }
  
   /**
   * Shows rules
   */
  buttonRules(){
    this.setState({rules:true});
    document.getElementById("Rules").style.visibility="visible";
    document.getElementById("Rules").style.top="7%";
    document.getElementById("Rules").style.left="66%";
  }

  /**
   * Hides rules
   */
  buttonBack(){
    this.setState({rules:false});
    document.getElementById("Rules").style.visibility="hidden";
  }

  /**
   * Method to ask the server which players have at least a winning hand, in order to display the card's deck
   */
  isDeck(){
    if(this.state.scoreDeck!==null && this.state.scoreDeck.length>0 && !this.state.matchIsOver){
      this.state.priv_socket.emit("deck", this.state.priv_socket.id);
    }
  }

  /**
   * Method to ask the server someone's last hand 
   * 
   * @param {string} idLastHand player's id whose last hand is requested
   */
  showLastHand(idLastHand){
    this.state.priv_socket.emit('lastHand', idLastHand, this.state.priv_socket.id);
  }

  /**
   * Method to hide the requested last hand once it's seen by the player
   */
  hideLastHand(){
    this.setState({requiredLastHand: []});
  }

  /**
   * Method to show the chat
   */
  showChat(){
    this.setState({
      buttonChat:true,
      notification:false
    }); 
  }

  /**
   * Method to hide the chat
   */
  hideChat(){
    this.setState({buttonChat:false});
  }

  /**
   * Method to order cards according to types and values
   */
  shuffleCards(){
    let cards=this.state.cards;
    let temp = [];
    let allCards=[1,3,10,9,8,7,6,5,4,2];
    let types=["Denari","Coppe","Spade","Bastoni"];
    let scores=[11,10,4,3,2,0,0,0,0,0];
    let tot=[];

    for (let i=0;i<types.length;i++){
      for (let j=0;j<allCards.length;j++){
        temp.push(types[i]);
        temp.push(allCards[j]);
        temp.push(scores[j]); 
      }
    }

    for(let i=0;i<(temp.length)/3;i++){
      for(let c of cards){
        if(c['value']===temp[3*i+1] && c['type']===temp[3*i]){
          tot.push(c);
        }
      }
    }
    
    this.setState({cards:tot, shuffle:true});
  }

  /**
   * Render of chat button
   */
  renderButtonChat(){
    if(!this.state.buttonChat && !this.state.matchIsOver && this.state.cards!==null && this.state.allNicknames!==null && !this.state.waitingForRestart && this.state.myNicknamesOrder!==null){
      return (<button id="ShowChat" onClick={() => this.showChat()}>CHAT</button>);
    }
    else{
      return(<div></div>);
    }
  }

  /**
   * Render of notifications' symbol
   */
  renderNotification(){
    if(this.state.notification && !this.state.buttonChat && !this.state.matchIsOver && this.state.cards!==null && this.state.allNicknames!==null && !this.state.waitingForRestart && this.state.myNicknamesOrder!==null){
      return(<div id="Notification">!</div>);
    }
    return null;
  }

  /**
   * Chat render
   */
  renderChat(){
    let visibleChat=null;
    if (this.state.buttonChat){
      let msg=[];
      let c=[];
      let index=null;
      let colors=["#fc0808","#fff500","#29a2fe","#fb7ef4","#fc9608"];
      if(this.state.cards!==null && !this.state.matchIsOver && this.state.allNicknames!==null && this.state.myNicknamesOrder!==null) {
        for (let i=0;i<this.state.messages.length; i++){
          //Finding the position of the message's sender to assign him the right color
          index = this.state.myNicknamesOrder.indexOf(this.getNickname(this.state.messages[i][0]));
          if (this.state.messages[i][0]===this.state.priv_socket.id){
            if (!(this.state.messages.length>1 && i>0 && this.state.messages[i-1][0]===this.state.priv_socket.id)){
              msg.push(<p id="MyMessageNick"><font color={colors[index]}><b>&lt;You&gt;</b></font></p>);
            }
            msg.push(<p id="MyMessage">&nbsp;{this.state.messages[i][1]}&nbsp;</p>);
          } 
          else {
            if(i>0 && this.state.messages[i][0]!==this.state.messages[i-1][0]){
              msg.push(<p id="OthersMessageNick"><font color={colors[index]}><b>&lt;{this.manageNicknames(this.state.messages[i][0])}&gt;</b></font></p>);
            } 
            else if(i>0 && this.state.messages[i][0]===this.state.messages[i-1][0]){
            } 
            else if (i<=0){
              msg.push(<p id="OthersMessageNick"><font color={colors[index]}><b>&lt;{this.manageNicknames(this.state.messages[i][0])}&gt;</b></font></p>);
            }
            msg.push(<p id="OthersMessage"> &nbsp;{this.state.messages[i][1]}</p>); 
            c.push(<p id="OthersMessage"> &nbsp;{this.state.messages[i][1]}</p>); 
          }  
        }
          
        visibleChat = <div id="VisibleChat">
          <div id="Messages">{msg.reverse()}</div>
          <div id="TextAndButton">
            <input type="text" id="TextChat" placeholder="Scrivi qui!"></input>
            <button id="SendButton" onClick={() => this.sendMessage()}>&gt;</button>
          </div>
          <div id="ChatTitle">CHAT</div>
          <button id="HideChat" onClick={() => this.hideChat()}>x</button>
        </div>
      }  
      else{
        visibleChat=<div></div>
      }
    }
    return visibleChat;
  }

  /**
   * Player's card render 
   */
  renderCards(){
    let myCards = this.state.cards;
    let cards = null;
    //Playable cards if they are not ordered
    if (myCards !== null && this.state.myTurn && this.state.briscola!==null && this.state.briscola.length===3 && this.state.shuffle){
      let entries = myCards.map((c)=> 
        <button id={"CardsInUse"+ myCards.indexOf(c)} onClick={() => this.playCard(c)} >
          <img src = {process.env.PUBLIC_URL+'/Cards/'+c['type']+'_'+c['value']+'.png'} cards={c} width="100%" alt="CardIMG" ></img>
        </button>);
        cards = <div id="MyCards">{entries}</div>;
    }
    //Playable cards if they are ordered
    else if (myCards !== null && this.state.myTurn && this.state.briscola!==null && this.state.briscola.length===3){
      let entries = myCards.map((c)=> 
        <button id={"CardsInUse"} onClick={() => this.playCard(c)} >
          <img src = {process.env.PUBLIC_URL+'/Cards/'+c['type']+'_'+c['value']+'.png'} cards={c} width="100%" alt="CardIMG" ></img>
        </button>);
        cards = <div id="MyCards">{entries}</div>;
    }
    //Unplayable cards if they are not ordered
    else if(myCards !== null && this.state.shuffle){
      let entries = myCards.map((c)=> 
        <button id={"CardsShufflingNotInUse"+myCards.indexOf(c)} >
          <img src = {process.env.PUBLIC_URL+'/Cards/'+c['type']+'_'+c['value']+'.png'} cards={c} width="100%" alt="CardIMG"></img>
        </button>);
        cards = <div id="MyCards">{entries}</div>;
    } 
    else if (myCards !== null){
          //Giving card unplayable to players
          if (this.state.briscola===null) {
            let entries = myCards.map((c)=> 
            <button id={"CardsNotInUse"+myCards.indexOf(c)} >
              <img src = {process.env.PUBLIC_URL+'/Cards/'+c['type']+'_'+c['value']+'.png'} cards={c} width="100%" alt="CardIMG"></img>
            </button>);
            cards = <div>{entries}<div id="CC"></div></div>;
          }
          //Unplayable cards if they are ordered
          else {
            let entries = myCards.map((c)=> 
            <button id="CardsNotInUseNotStart" >
              <img src = {process.env.PUBLIC_URL+'/Cards/'+c['type']+'_'+c['value']+'.png'} cards={c} width="100%" alt="CardIMG"></img>
            </button>);
            cards = <div id="MyCards">{entries}</div>;  
          }
    }
    else {
      if (this.state.matchIsOver){
        cards = <div id="MatchIsOver">Partita terminata</div>
      }
      else if (this.state.priv_socket!==null && this.state.priv_socket.disconnected) {
        cards = <div id="NotConnected">Cinque giocatori sono già connessi, riprova più tardi...</div>
      }
      else{
        if (this.state.everybodyReady && !this.state.waitingForRestart){
          cards = <div id="PressReady">Premi il pulsante per ricevere le carte</div>
        }
        else if(!this.state.waitingForRestart){
          cards = <div id="WaitForConnection">In attesa di altri giocatori...</div>
        } 
      }
    }
    return cards;
  }

  /**
   * Auction render
   */
  renderAuction(){
    let myCards = this.state.cards;
    let auction = null;
    let myAuction = this.state.available_card_values;
    let cardNames = ["Asso","Due","Tre","Quattro","Cinque","Sei","Sette","Fante","Cavallo","Re"];
    let cardNotReverse =["Asso","Tre","Re","Cavallo","Fante","Sette","Sei","Cinque","Quattro","Due"];
    
    if (myAuction.length > 0 && this.state.auctionResult.length===0){
      let entries = myAuction.map((c)=> 
        //Matching the available card with their right names
        <button id={"AuctionButton"+c} onClick={() => this.sendOffer(c)}>
          <b>{cardNames[c-1]}</b>
        </button>);
      for(let i=0; i<(10-myAuction.length); i++){
          entries.push(<div id={"AuctionButtonNot"+(i+1)}>{cardNotReverse[i]}</div>);
      } 
      entries.push(<button id="AuctionButton" onClick={() => this.sendOffer(0)}><b>Passo</b></button>);
      if (this.state.winningPts > 60){
        if(this.state.myTurn){
          entries.push(<p id="RaisePoints">Punteggio minimo per vincere: {this.state.winningPts}</p>);
        }
        if (!this.state.hasPassed && this.state.winningPts<120 && this.state.myTurn){
          entries.push(<button id="Plus" onClick={() => {this.setState({winningPts: this.state.winningPts+1});}}>+</button>)
        }
        if (this.state.winningPts > 120){
          entries = [];
          entries.push(<button id="SkipButton" onClick={() => this.sendOffer(0)}>Passo</button>);
          entries.push(<p id="OnlyPass"><b>Un giocatore ha chiamato a 120, puoi solo passare</b></p>);
        }
      }
      if (this.state.myTurn){
        auction = <div id="Auction" style= {{ textAlign: "center"}}>
            <p>{entries}</p>
            <p id="YourTurnOffer">È il tuo turno per chiamare!</p>
          </div>;
      }
      else{
        auction = <div id="Auction" style= {{ textAlign: "center"}}>
          <p>{entries}</p>
          <p id="WaitingOffers">In attesa che gli altri giocatori chiamino...</p>
        </div>;
      }
    }
    else{
      if (myCards !== null){
        auction = <div id="AuctionFinished">Asta terminata: in attesa che {this.getNickname(this.state.auctionResult[0])} scelga la briscola...</div>;
        if (this.state.auctionResult[0] === this.state.priv_socket.id){
          if (this.state.briscola == null || this.state.briscola.length < 2){
            //Showing to the auction's winner the cards to choose from
            let entries = this.all_types.map((t)=> 
              <button id={"CallerCards"+t}>
                <img src = {process.env.PUBLIC_URL+'/Cards/'+t+'_'+this.state.auctionResult[1]+'.png'} alt="CardIMG" onClick={() => this.sendOfferType(this.state.auctionResult[1],t)} width="100%"></img>
              </button>);
            auction = <div id="Auction" width="100%">{entries}</div>;
          }
          else{
            auction = <div id="Auction">Hai vinto l'asta chiamando un {this.state.briscola[0]} di {this.state.briscola[1]} a {this.state.auctionResult[2]}</div>;
          }
        }
        //Building the graphics for the caller, with the card called, the final auction's points and the crown image
        let pl=[];
        if (!this.state.matchIsOver && this.state.allNicknames!==null && this.state.briscola !== null && this.state.briscola.length===3 && this.state.myNicknamesOrder!==null){
          let index = null;
          let p=null;
          let c=null;
          let pt=null;
          for (let i=0; i<this.state.allNicknames.length; i++) {
            index = this.state.myNicknamesOrder.indexOf(this.state.allNicknames[i][1]);
            if (this.state.allNicknames[i][0]===this.state.briscola[1]){
              p="Caller"+index;
              c="Crown"+index;
              pt="Points"+index;
              pl.push(<img src = {process.env.PUBLIC_URL+'/Cards/'+this.state.briscola[2]+'_'+this.state.briscola[0]+'.png'} width="3%" id={p} alt="cardIMG"></img>); 
              pl.push(<div id={pt}>{this.state.auctionResult[2]}</div>);
              pl.push(<img src={process.env.PUBLIC_URL+'crown.png'} id={c} alt="CrownIMG"></img>);
            }    
          } 
        auction = <div>{pl}</div>;
        }
      }
      else{
        auction = <div id="Auction" style= {{ textAlign: "center"}}></div>;
      }
    }
    return (auction);
  }

  /**
   * Manage the graphics during the offers
   */
  renderOffer(){
    let cardNames = ["Asso","Due","Tre","Quattro","Cinque","Sei","Sette","Fante","Cavallo","Re"];
    let offer=[];
    if (!this.state.matchIsOver && this.state.allNicknames!==null && this.state.briscola === null && this.state.myNicknamesOrder!==null){
      let imcalling=null;
      let ind=null;
      let baloon=null;
      for (let i=0; i<this.state.allNicknames.length; i++) {
        ind = this.state.myNicknamesOrder.indexOf(this.state.allNicknames[i][1]);
        //Displaying who's calling and what card's calling
        if (this.state.allNicknames[i][0]===this.state.currentAuction[0]){
          imcalling="IMCalling"+ind;
          baloon="Baloon"+ind;
          offer.push(<img id={baloon} src={process.env.PUBLIC_URL+"vignetta"+ind+".png"} alt="vimg" width="10%"></img>);
          if (this.state.currentAuction[2]<61){
            offer.push(<div id={imcalling}>{cardNames[this.state.currentAuction[1]-1]}!</div>); 
          } 
          //Displaying also the auction's points
          else{
            offer.push(<div id={imcalling}>{cardNames[this.state.currentAuction[1]-1]} a {this.state.currentAuction[2]}!</div>); 
          }
        }    
      }
    }
    else{
      offer.push(<div></div>);
    }
    return (<div id="OfferAlign">{offer}</div>);
  }

  /**
   * Ready button render
   */
  renderReadyButton(){
    let readyButton = null;
    let rReason = null;
    if (this.state.cards!=null || !this.state.everybodyReady || this.state.matchIsOver || this.state.waitingForRestart){
      readyButton = <div id="ReadyNotShown"></div>
      if (this.state.restartReason === "playerDisconnected" && !this.state.everybodyReady){
        rReason = <div id="Disconnected"><p>La partita deve ricominciare perchè uno dei giocatori si è disconnesso</p></div>; 
      }
    }
    else{
      readyButton = <button id="Ready" onClick={() => this.setReady()}>GIOCA</button>;
      if (this.state.restartReason === "everybody passed"){
        rReason = <div id="Passed"><p>La partita deve ricominciare perchè tutti hanno passato</p></div>;
      }
    }
    return [readyButton, rReason]
  }

  /**
   * Deck render
   */
  renderDeck(){
    let index;
    let d=[];
    if(this.state.handsWinners!==null && this.state.handsWinners.length>0 && !this.state.matchIsOver && this.state.cards!==null && this.state.myMatchOrder!==null){
      for(let i=0; i<this.state.handsWinners.length; i++){
        //Displaying the card's back near all players who won at least one hand
        index = this.state.myMatchOrder.indexOf(this.state.handsWinners[i]);
        let idLastHand = this.state.myMatchOrder[index];
        d.push(<img id={"Deck"+index} onMouseOver={() => this.showLastHand(idLastHand)} onMouseOut={() => this.hideLastHand()} src = {process.env.PUBLIC_URL+'/Cards/deck.png'} alt = "deckIMG"></img>);
      }
    }
    else{
      d.push(<div></div>);
    }
    return d; 
  }

  /**
   * Last hand render
   */
  renderLastHand() {
    let cards = null;
    if (this.state.requiredLastHand!==null ){
      let lastHandImg = this.state.requiredLastHand;
      let entries = lastHandImg.map((c)=> 
        <img id={"LastHand"+lastHandImg.indexOf(c)} src = {process.env.PUBLIC_URL+'/Cards/'+c['type']+'_'+c['value']+'.png'}  width="5%" alt="lastHandIMG"></img>);
      cards = <div>{entries}</div>;
    }
    return cards;
  }

  /**
   * Players' avatar and nickname render
   */
  renderPlayers(){
    let pl=[];  
    if (this.state.cards!==null && !this.state.matchIsOver && this.state.allNicknames!==null && this.state.myNicknamesOrder!==null){
      let index = null;
      for (let i=0; i<this.state.allNicknames.length; i++) {
        index = this.state.myNicknamesOrder.indexOf(this.state.allNicknames[i][1]);
        if(this.state.allNicknames[i][0]===this.state.priv_socket.id){
          pl.push(
            <div id={"PlayerID"+index}> 
              <img src = {process.env.PUBLIC_URL+"user"+index+'.png'} width="100%" id={"Img"+index} alt="cardIMG"></img>
              <div id="Nickname">IO</div>
            </div>
          );  
        } 
        else{
          pl.push(
            <div id={"PlayerID"+index}> 
              <img src = {process.env.PUBLIC_URL+"user"+index+'.png'} width="100%" id={"Img"+index} alt="cardIMG"></img>
              <div id="Nickname">{this.manageNicknames(this.state.allNicknames[i][0])}</div>
            </div>
          );  
        }
      }      
    }
    return pl;
  }

  /**
   * Render of the cards on the table
   */
  renderHand(){
    let pl=[];  
    if (this.state.briscola!==null && this.state.briscola.length===3 && !this.state.matchIsOver){
      if (this.state.hand !== null && this.state.handIds!== null) {
        let currentHand = [this.state.hand, this.state.handIds];
        let index = null;
        let p=null;
        let c = null;
        if (currentHand !== null && this.state.myMatchOrder!== null && this.state.handIds!== null) {
          for (let i=0; i<currentHand[0].length; i++) {
            index = this.state.myMatchOrder.indexOf(this.state.handIds[i]);
            c = currentHand[0][i];
            p="Player"+index;
            if (c['type']===this.state.briscola[2]&&c['value']===this.state.briscola[0]){
              pl.push(
                <div id={p}> 
                  <img src = {process.env.PUBLIC_URL+'/Cards/'+c['type']+'_'+c['value']+'.png'} width="50%" style={{border:"2px solid red"}} alt="cardIMG"></img> 
                </div>
              );
            }
            else{
              pl.push(
                <div id={p}> 
                  <img src = {process.env.PUBLIC_URL+'/Cards/'+c['type']+'_'+c['value']+'.png'} width="50%" alt="cardIMG"></img>
                </div>
              );
            }
          }
        }    
      }
      
    }
    return pl;
  }

  /**
   * Render of the final scores 
   */
  renderScore(){
    let scores = null;
    let myTeam = null;
    let index=null;
    if (this.state.teamsScore != null){
      let callerScoreVals = this.state.teamsScore[0].map((s) => {
        if (s[0] === this.state.priv_socket.id){
          myTeam = 0;
          return (<p style={{color:"red", fontWeight:"bold"}}>Il tuo punteggio: {s[1]}</p>);
        }
        else{
          return (<p>Punteggio di {this.getNickname(s[0])}: {s[1]}</p>);
        }
      });
      let tCallerScore = 0;
      for (let s of this.state.teamsScore[0]){
        tCallerScore += s[1];
      }
      callerScoreVals.push(<p id="TotalCaller">TOTALE: {tCallerScore} punti</p>);
      let opponentScoreVals = this.state.teamsScore[1].map((s) => {
        if (s[0] === this.state.priv_socket.id){
          myTeam = 1;
          return (<p style={{color:"red", fontWeight:"bold"}}>Il tuo punteggio: {s[1]}</p>);
        }
        else{
          return (<p>Punteggio di {this.getNickname(s[0])}: {s[1]}</p>);
        }
      });
      let tOpponentScore = 0;
      for (let s of this.state.teamsScore[1]){
        tOpponentScore += s[1];
      }
      opponentScoreVals.push(<p id="TotalOpponent">TOTALE: {tOpponentScore} punti</p>);
      let finalScores = null;
      if ((tCallerScore >= this.state.auctionResult[2] && myTeam === 0) || (tOpponentScore >= this.state.auctionResult[2] && myTeam === 1)){
        finalScores = <p><strong>HAI VINTO!</strong></p>;
      }
      else {
        finalScores = <p><strong>HAI PERSO!</strong></p>;
      }
      let mScores = this.state.matchScores.map((p) => {
        index=this.state.matchScores.indexOf(p);
        return (<div id={"ActualScores"+index}><p id={"Nicknames"+index}>{this.manageNicknames(p[0])}</p><p id={"FinalScores"+index}>{p[1]}</p></div>);
      });

      scores = <div id="Scores" style= {{textAlign: "center"}}> 
                  <div id="WonLost">{finalScores}</div>
                  <div id="CallerResults"><p><strong>RISULTATI TEAM CHIAMANTE</strong></p><p id="CallerScores">{callerScoreVals}</p></div>
                  <div id="OpponentResults" ><p><strong> RISULTATI TEAM AVVERSARIO</strong></p><p id="OpponentScores">{opponentScoreVals}</p></div>
                  <strong><p id="UpToNowScores">Stato attuale della partita:</p></strong>
                  {mScores}
                </div>;       
    }
    return scores;
  }

  /**
   * Disconnected server render
   */
  renderDisconnectedServer(){
    let id = null;
    if (this.state.priv_socket === null){
      id = <div id="ServerDisconnected">Server non connesso</div>;
    }
    return id;
  }

  /**
   * "It's your turn to play or not" render
   */
  renderTurn(){
    if (this.state.myTurn && this.state.briscola !== null && this.state.briscola.length === 3 && !this.state.matchIsOver) {
      return (<div width="100%"><p id="YourTurnToPlay"><strong>È il tuo turno!</strong></p></div>);
    }
    else if (!this.state.myTurn && this.state.briscola !== null && this.state.briscola.length === 3 && !this.state.matchIsOver) {
      return (<div width="100%"><p id="WaitToPlay"><strong> In attesa degli altri giocatori...</strong></p></div>);
    }
  }

  /**
   * Render input type for nickname
   */
  renderUnameSelector(){
    if (this.state.nickname==null && this.state.everybodyReady){
      return (<div><input type="text" id="Username" name="Username" placeholder="Nickname"></input></div>);
    }
    else{
      return (<div id="NicknameAlreadySet"></div>);
    }
  }

  /**
   * Restart button render
   */
  renderRestartButton(){
    let restartButton = null;
    if (this.state.matchIsOver){
      restartButton = <button id="RestartButton" onClick={() => this.restartMatch()}><strong>RIGIOCA</strong></button>
    }
    else if (this.state.waitingForRestart){
      restartButton = <div id="RestartWriting"><p>In attesa che tutti i giocatori siano pronti per fare un'altra partita...</p></div>
    }
    return restartButton;
  }

  /**
   * Main title render
   */
  renderTitle(){
    if (this.state.cards===null && !this.state.matchIsOver){
      return(<h1 id="MainTitle"><strong>BRISCOLA IN 5 ONLINE</strong></h1>);
    }
  }

  /**
   * Render the button which order cards
   */
  renderShuffleButton(){
    if (this.state.cards!==null&&this.state.cards.length>1&&!this.state.matchIsOver&&!this.state.shuffle){
      return (<button id="ShuffleButton" onClick={()=>this.shuffleCards()}>Ordina carte</button>);
    }
    return (<div></div>);
  }

  /**
   * Render the game's rules 
   */
  renderButtonRules(){
    let button=null;
    if (!this.state.rules){
      button=<button id="ButtonRules" onClick={()=>this.buttonRules()}>REGOLE</button>
    }
    else{
      button=<button id="ButtonBack" onClick={()=>this.buttonBack()}>CHIUDI</button>
    }
    return button;
  }

  /**
   * Render the initial images
   */
  renderImages(){
    let image=[];
    if (this.state.cards===null && !this.state.matchIsOver){
      image.push(<img id="AssoDenari" src={process.env.PUBLIC_URL+'/Cards/Denari_1.png'} width="10%" alt="DImg"></img>);
      image.push(<img id="AssoBastoni" src={process.env.PUBLIC_URL+'/Cards/Bastoni_1.png'} width="10%" alt="BImg"></img>);
      image.push(<img id="AssoCoppe" src={process.env.PUBLIC_URL+'/Cards/Coppe_1.png'} width="10%" alt="CImg"></img>);
      image.push(<img id="AssoSpade" src={process.env.PUBLIC_URL+'/Cards/Spade_1.png'} width="10%" alt="SImg"></img>);
    }
    else {
      image.push(<div></div>);
    }
    return image;
  }

  /**
   * Final render
   */
  render() {
    document.body.style.backgroundColor= this.state.color;
    
    let title=this.renderTitle();
    let id = this.renderDisconnectedServer();
    let uname = this.renderUnameSelector();
    let [readyButton, rReason] = this.renderReadyButton();
    let auction = this.renderAuction();
    let currentHand=this.renderHand();
    let cards = this.renderCards();
    let scores = this.renderScore();
    let yourTurn = this.renderTurn();
    let restartButton = this.renderRestartButton();
    let players = this.renderPlayers();
    let images=this.renderImages();
    let offer=this.renderOffer();
    let chat=this.renderChat();
    let deck=this.renderDeck();
    let lastHand = this.renderLastHand();
    let chatButton=this.renderButtonChat();
    let notification=this.renderNotification();
    let buttonRules=this.renderButtonRules();
    let shuffleButton=this.renderShuffleButton();

    return (
      <div style={{ textAlign: "center"}} id="MainBody" width="100%">
        {title}
        {images}
        {currentHand}
        {players}
        {id}
        {uname}
        {cards}
        {rReason}
        {readyButton}
        {yourTurn}
        {scores}
        {restartButton}
        {auction}
        {offer}
        {chat}
        {deck}
        {lastHand}
        {chatButton}
        {notification}
        {buttonRules}
        {shuffleButton}
      </div>
    );
  }
}
export default App;
