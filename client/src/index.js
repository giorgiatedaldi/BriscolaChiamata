import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

function prova () {
    ReactDOM.render(<App />, document.getElementById('root'));
}

ReactDOM.render(<App />, document.getElementById('root'));
setInterval(prova, 1000);

serviceWorker.unregister();
