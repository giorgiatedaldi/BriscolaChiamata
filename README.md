# briscola_in_5_online
BRISCOLA IN 5 ONLINE
INTRODUZIONE
Le regole di base per la vincita delle diverse mani sono le stesse della classica Briscola in quattro, la variante in cinque, però, si differenzia  principalmente per l’introduzione di una parte iniziale chiamata “asta”, durante la quale il giocatore che fa la migliore offerta (“comandante”) sceglie quella che sarà la briscola. I giocatori vengono quindi divisi in due squadre: quella “chiamante”, composta da comandante ed eventuale “socio” (il giocatore che possiede la carta chiamata), e quella “avversaria”, di cui fanno parte tutti gli altri giocatori.

ASTA
Il mazziere distribuisce otto carte a testa, in senso antiorario, partendo dal giocatore alla sua destra. I giocatori, a questo punto, esaminano le loro carte, con lo scopo di valutare quale sia il seme in cui risultano più forti, e se convenga chiamare una delle carte “mancanti” di quel seme.
 
Esempio:
Il seme dominante del giocatore in questione è Denari. Il caso con maggiori probabilità di vincita sarebbe quello di chiamare il Tre, in quanto è la briscola più forte tra quelle mancanti al giocatore, il secondo miglior caso sarebbe quello di chiamare il Cavallo, e così via. Il giocatore, se in possesso di molte briscole, può decidere anche di chiamare una delle carte tra quelle possedute (“chiamata in mano”), cosciente, però, di essere in squadra da solo.
Durante l’asta, quindi, a turno, ogni giocatore ha la possibilità di “chiamare” (senza specificare il seme) o di “passare”: l’asta procede in senso antiorario ed in modo decrescente, cioè si possono chiamare solo carte progressivamente più basse secondo l’ordine: Asso, Tre, Re, Cavallo, Fante, Sette, Sei, Cinque, Quattro, Due. Essendo il Due la carta più bassa chiamabile, se più giocatori risultano essere intenzionati nel proseguimento dell’asta, l’unica possibilità è quella di alzare il punteggio di vittoria: per vincere non sarà più necessario arrivare a 60 ma al nuovo punteggio “offerto”. 
 
Esempio:

Il giocatore in questione, sta dichiarando che, la squadra chiamante, dovrà arrivare ad almeno 64 punti per vincere. I giocatori che passano, invece, vengono esclusi dal proseguimento dell’asta. Quest’ultima termina nel momento in cui tutti i giocatori, tranne uno, il futuro comandante, passano. Una volta che l’asta è terminata, il comandante dichiara pubblicamente il seme della briscola.

SVOLGIMENTO DEL GIOCO
Il gioco comincia e procede secondo le regole della Briscola, partendo dal giocatore alla destra del mazziere, a prescindere dal vincitore dell’asta, con la differenza che le due squadre non saranno note finché il socio non si sarà rivelato giocando la carta chiamata, oppure, adottando un comportamento di gioco che evidenzi il suo stato. 

GESTIONE DEI PUNTEGGI
Una volta che la partita è finita, vengono calcolati i punti totali di entrambe le squadre. Il match risulta vinto dalla squadra chiamante se sono stati realizzati almeno 60 punti, o nel caso di chiamata a Due, i punti stabiliti durante l’asta. 
Il punteggio generale attribuito a ciascun giocatore dipende strettamente da questi ultimi. 
Nel caso in cui una delle due squadre realizzi tutti e 120 i punti, si parla di “volata”.
Distinguiamo le seguenti casistiche in caso di vittoria della squadra chiamante:



Comandante
Socio
Altri giocatori (x3)
Partita normale
+2
+1
-1
2 a 70 punti
+4
+2
-2
 2 a 80 punti
+6
+3
-3
Volata
+8
+4
-4


Nel caso in cui il comandante si chiami in mano i punteggi variano nel seguente modo:


Comandante
Altri giocatori (x4)
Partita normale
+4
-1
2 a 70 punti
+8
-2
 2 a 80 punti
+12
-3
Volata
+16
-4


Nel caso in cui, invece, a vincere sia la squadra avversaria, tutti i punteggi precedenti sono di segno opposto.

SPECIFICHE E FUNZIONALITÀ
CONNESSIONE
Il server è in ascolto e rimane in attesa della connessione di client, che devono essere almeno 5. Nel caso in cui ne risultino di più, i client dal sesto in avanti vengono disconnessi, mentre per gli altri può iniziare la partita.

A questo punto ogni client può inserire un nickname altrimenti questo sarà settato all’ID della sua socket. Alla ricezione dei primi 5 giocatori il server genera le carte per ciascun giocatore, ma le distribuisce solo dopo che i client premono il pulsante gioca.
L’ordine di gioco è stabilito in base all’ordine temporale di connessione dei client.

ASTA
A questo punto il primo giocatore vede la seguente schermata, da cui ha inizio l’asta.

La schermata si aggiorna ogni volta che un giocatore preme uno dei pulsanti per effettuare l’offerta, passando il turno al giocatore successivo: mano mano che un bottone viene premuto,  il server riceve le informazioni dal client in questione, per poi comunicarle a tutti gli altri, in modo che il bottone premuto e tutti quelli precedenti vengano disabilitati per tutti i giocatori.

L’asta prosegue fino a quando tutti i giocatori, tranne uno, hanno passato. A questo punto il comandante deve scegliere qual è il seme premendo sulla carta desiderata, in questo modo la scelta della briscola viene comunicata al server, che a sua volta invierà il messaggio a tutti i client. 

Nel remoto caso in cui tutti i giocatori dovessero passare, le carte vengono ridistribuite e la partita ricomincia normalmente.

SVOLGIMENTO DEL GIOCO
Dopo la conclusione dell’asta, il comandante è identificato, da tutti i giocatori, con una corona e l’immagine della carta chiamata di fianco all’avatar. La partita inizia con il primo giocatore, le cui carte sono ora selezionabili.
Quando una carta viene giocata, questa viene trasferita sul tavolo ed eliminata dalle carte disponibili del giocatore. 
Nel caso in cui una tra le carte giocate sia quella chiamata dal comandante, questa viene visualizzata con un bordino rosso, per mettere in evidenza il comportamento del socio.

Il giocatore che vince la mano, alla fine di questa, viene affiancato da un mazzetto, ad indicare le carte appena prese.

Il gioco prosegue in questo modo fino all’esaurimento delle otto carte di tutti i giocatori.

ORDINA CARTE
Tramite l’apposito pulsante, che è cliccabile una sola volta e rimane attivo dalla distribuzione iniziale delle carte fino alla penultima mano (durante la quale i giocatori hanno una sola carta in mano), è possibile ordinare le proprie carte per seme e valore. 
Soprattutto nelle prime fasi della partita (asta e prime mani), questa funzionalità può risultare molto comoda per il giocatore, che ha la possibilità di visualizzare le proprie carte in modo più chiaro e leggibile.  
Prima dell’ordinamento:
 
Dopo l’ordinamento:


ULTIMA MANO
Durante lo svolgimento della partita è sempre possibile vedere l’ultima mano di un qualsiasi giocatore che ne ha vinta almeno una, scorrendo sopra il mazzetto di quest’ultimo. Quando il cursore è posizionato sopra uno dei mazzetti viene mandata una richiesta al server in cui il giocatore interessato a vedere l’ultima mano, comunica il proprio ID e quello del giocatore in questione. A questo punto il server richiede le ultime cinque carte presenti nel mazzo del giocatore di cui vuole essere vista l’ultima mano, e le comunica al richiedente, che ora le può visualizzare.


CHAT
Durante la partita è possibile comunicare con gli altri giocatori tramite una chat comune. Ogni messaggio viene visualizzato dopo l’ID del mittente (dello stesso colore dell’avatar).
La chat si può aprire e chiudere tramite appositi pulsanti in base alle preferenze di ciascun giocatore. 

Nel caso in cui ci siano messaggi non letti e la chat sia chiusa, apparirà un simbolo di notifica.


VISUALIZZAZIONE DEI PUNTEGGI
Alla fine di ogni partita, tutti i giocatori visualizzano una schermata riassuntiva con i punti di ogni squadra e i punteggi individuali della partita, aggiornati rispetto ai precedenti match.


RIGIOCA
Una volta visualizzata la schermata finale dei punteggi, i giocatori possono scegliere di intraprendere una nuova partita con gli stessi avversari. Nel caso in cui, anche solo uno dei giocatori scegliesse di non giocare nuovamente, le statistiche vengono azzerate e il server rimane in attesa della connessione di un nuovo client, mantenendo aperte le connessioni precedenti e i relativi nickname dei giocatori.



DISCONNESSIONE DI UN GIOCATORE
Se dovesse verificarsi la disconnessione di un qualsiasi giocatore, durante tutto lo svolgimento della partita, le statistiche vengono azzerate e il server rimane in attesa della connessione di un nuovo client, mantenendo aperte le connessioni precedenti e i relativi nickname dei giocatori.


REGOLAMENTO
Durante il corso di tutta la partita è sempre possibile visualizzare le regole del gioco, premendo l’apposito bottone in alto a destra.


TECNOLOGIE UTILIZZATE
REACT
React è una libreria per creare interfacce utente. Un componente React può mantenere i dati del suo stato interno (accessibili tramite this.state), ad ogni cambio di stato React aggiorna solamente le parti della UI che dipendono da tali dati. L’utilizzo di questa libreria è quindi motivato dalla sua semplicità di utilizzo e dalla sua reattività nell’aggiornamento di pagine dinamiche, che lo rende particolarmente efficiente per applicazioni real-time, quali giochi.

SOCKET.IO
Socket.IO è una libreria Javascript per applicazioni web in tempo reale. Prevede una comunicazione bidirezionale real-time tra i client e il server. Socket.IO è formato da due parti: una libreria lato client (socket.IO-client) che gira sul browser e una libreria lato server per Node.js (socket.IO). L’utilizzo di questa di libreria è motivato dalla necessità di avere connessioni sempre aperte e con scambio bilaterale sincronizzato tra client e server. Nelle comunicazioni non sincronizzate il server non alcun mezzo per inviare messaggi al client a meno che non sia questo a richiederlo. La possibilità di avere un canale di comunicazione sempre aperto, invece, permette al server, di comunicare con il client di sua spontanea volontà.

NODE.JS
Node.js è un framework per realizzare applicazioni Web in JavaScript, permettendoci di utilizzare questo linguaggio, tipicamente utilizzato nella “client-side”, anche per la scrittura di applicazioni “server-side”. La piattaforma è basata sul runtime JavaScript Engine V8, che è il runtime di Chrome per creare facilmente applicazioni di rete veloci e scalabili.
L’utilizzo di questa di libreria è motivato da un fattore fondamentale: Node.js ha un'architettura orientata agli eventi che rende possibile la presenza di un'API asincrona con I/O non bloccante che lo rende leggero ed efficiente. Esso è infatti designato per essere responsive (non si blocca e dà una risposta nel tempo più rapido possibile), rendendolo perfetto per le applicazioni in tempo reale.

EXPRESS
Express è un framework per applicazioni web Node.js che fornisce funzioni avanzate, rendendo quindi più facile e veloce la creazione di queste.

INSTALLAZIONE DEL GIOCO
REQUISITI
Per poter utilizzare “Briscola in 5 online” è prima di tutto necessario installare:
Node.js (Installer): https://nodejs.org/it/download/  
Git: https://git-scm.com/download/

INSTALLAZIONE DI BRISCOLA IN 5 ONLINE
Aprire un terminale e digitare i seguenti comandi:
git clone https://github.com/giorgiatedaldi/briscola_in_5_online
cd briscola_in_5_online/client/
npm install socket.io-client
cd ../server/
npm install express
npm install socket.io

AVVIARE IL GIOCO
node server.js
Aprire un secondo terminale e seguire i seguenti comandi:
cd briscola_in_5_online/client/
npm start
