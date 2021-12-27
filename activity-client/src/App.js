import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ThemeProvider } from "@mui/material";
import { getActivities, loginJWT } from "./Redux/actions";
import Log from "./Components/log/Log";
import Navbar from "./Components/Navbar";
import Metrics from "./Components/Metrics/Metrics";
import EditLayout from "./Components/Edit/EditLayout";
import AuthRoute from "./Components/AuthRoute";
import Login from "./Components/Login";
import SignUp from "./Components/SignUp";
import Settings from "./Components/Settings";
import Loading from "./Components/Loading";
import { theme } from "./theme";
import "./App.css";

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const handleLoginAttempt = async (e) => {
    dispatch(loginJWT(localStorage.getItem("JWT_AUTH_TOKEN")));
  };

  useEffect(() => {
    if (localStorage.getItem("JWT_AUTH_TOKEN") !== null) {
      handleLoginAttempt().then(()=>dispatch(getActivities()).then(()=>setLoading(false)));
    }
    else{
      setLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  return loading?<Loading/>:(
    <ThemeProvider theme={theme}>
      <Router basename="/activity-tracker/">
        <Switch>
          <Route exact path="/login" component={Login} />
          <Route exact path="/signup" component={SignUp} />
          <AuthRoute exact path="/" component={Log} />
          <AuthRoute exact path="/edit" component={EditLayout} />
          <AuthRoute exact path="/metrics" component={Metrics} />
          <AuthRoute exact path="/settings" component={Settings} />
        </Switch>
        <Navbar />
      </Router>
    </ThemeProvider>
  );
}

export default App;
