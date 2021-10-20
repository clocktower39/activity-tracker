import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Container } from '@material-ui/core';
import Log from './Components/log/Log';
import Navbar from './Components/Navbar';
import Metrics from './Components/Metrics/Metrics';
import EditLayout from './Components/Edit/EditLayout';
import AuthRoute from './Components/AuthRoute';
import Login from './Components/Login';
import SignUp from './Components/SignUp';
import './App.css';

function App() {

  return (
    <Router basename="/activity-tracker/">
      <Container maxWidth={'md'}>
        <Switch>
          <Route exact path='/login' component={Login} />
          <Route exact path='/signup' component={SignUp} />
          <AuthRoute exact path='/' component={Log} />
          <AuthRoute exact path='/edit' component={EditLayout} />
          <AuthRoute exact path='/metrics' component={Metrics} />
        </Switch>
      </Container>
      <Navbar />
    </Router>
  );
}

export default App;
