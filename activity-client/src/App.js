import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Container } from '@material-ui/core';
import Log from './Components/log/Log';
import Navbar from './Components/Navbar';

import './App.css';

function App() {
  return (
    <Router>
      <Container maxWidth={'md'}>
        <Switch>
          <Route exact path='/' component={Log} />
          <Route exact path='/goals' children={<>Update Goals</>} />
          <Route exact path='/progress' children={<>Progress</>} />
        </Switch>
      </Container>
      <Navbar />
    </Router>
  );
}

export default App;
