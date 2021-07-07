import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Container } from '@material-ui/core';
import Log from './Components/log/Log';
import Navbar from './Components/Navbar';
import Progress from './Components/Progress';

import './App.css';

function App() {
  return (
    <Router>
      <Container maxWidth={'md'}>
        <Switch>
          <Route exact path='/' component={Log} />
          <Route exact path='/progress' children={<Progress />} />
          <Route exact path='/add' children={<>Add Goals</>} />
        </Switch>
      </Container>
      <Navbar />
    </Router>
  );
}

export default App;
