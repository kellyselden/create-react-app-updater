import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));

class MyComponent extends React.Component {
  componentDidCatch() {
    this.setState({ error: true });
  }
}
