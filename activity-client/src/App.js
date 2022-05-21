import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ThemeProvider } from "@mui/material";
import { getActivities, loginJWT } from "./Redux/actions";
import Log from "./Components/Log/Log";
import Navbar from "./Components/Navbar";
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
      handleLoginAttempt().then(() => dispatch(getActivities()).then(() => setLoading(false)));
    }
    else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  return loading ? <Loading /> : (
    <ThemeProvider theme={theme}>
      <Router basename="/activity-tracker/">
        <Routes>
          <Route exact path="/login" element={Login} />
          <Route exact path="/signup" element={SignUp} />

          <Route exact path="/" element={<AuthRoute />}>
            <Route exact path="/" element={<Log />} />
          </Route>
          <Route exact path="/settings" element={<AuthRoute />}>
            <Route exact path="/settings" element={<Settings />} />
          </Route>

        </Routes>
        <Navbar />
      </Router>
    </ThemeProvider>
  );
}

export default App;
