import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Container } from '@material-ui/core';
import Log from './Components/log/Log';
import Navbar from './Components/Navbar';

import './App.css';

function App() {
  return (
    <Container maxWidth={'sm'}>
      <Router>
        <Switch>
          <Route exact path='/' component={Log} />
          <Route exact path='/goals' children={<>Update Goals</>} />
          <Route exact path='/progress' children={<>Progress</>} />
        </Switch>
        <Navbar />
      </Router>
    </Container>
  );
}

export default App;
