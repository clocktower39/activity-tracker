import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Container } from '@material-ui/core';
import Log from './Components/log/Log';
import Navbar from './Components/Navbar';
import Progress from './Components/Progress/Progress';
import { getActivities } from "./Redux/actions";
import './App.css';

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    dispatch(getActivities()).then(setLoading(false));
  // eslint-disable-next-line
  },[])

  return loading?<>Loading</>:
  (
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
