import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

ReactDOM.render(React.createElement(App), document.getElementById('root'));

class MyComponent extends React.Component {
  unstable_handleError() {
    this.setState({ error: true });
  }
}
