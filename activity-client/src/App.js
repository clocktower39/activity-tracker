import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Container, ThemeProvider } from "@mui/material";
import { getActivities, loginJWT } from "./Redux/actions";
import Log from "./Components/log/Log";
import Navbar from "./Components/Navbar";
import Metrics from "./Components/Metrics/Metrics";
import EditLayout from "./Components/Edit/EditLayout";
import AuthRoute from "./Components/AuthRoute";
import Login from "./Components/Login";
import SignUp from "./Components/SignUp";
import { theme } from './theme';
import "./App.css";

function App() {
  const dispatch = useDispatch();

  const handleLoginAttempt = async (e) => {
    dispatch(loginJWT(localStorage.getItem("JWT_AUTH_TOKEN")));
  };

  useEffect(() => {
    if (localStorage.getItem("JWT_AUTH_TOKEN") !== null) {
      handleLoginAttempt();
    }
    // eslint-disable-next-line
  }, []);
  useEffect(() => {
    dispatch(getActivities());
    // eslint-disable-next-line
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Router basename="/activity-tracker/">
        <Container maxWidth={"md"}>
          <Switch>
            <Route exact path="/login" component={Login} />
            <Route exact path="/signup" component={SignUp} />
            <AuthRoute exact path="/" component={Log} />
            <AuthRoute exact path="/edit" component={EditLayout} />
            <AuthRoute exact path="/metrics" component={Metrics} />
          </Switch>
        </Container>
        <Navbar />
      </Router>
    </ThemeProvider>
  );
}

export default App;
