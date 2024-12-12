import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { loginJWT } from "./Redux/actions";
import LogContainer from "./Components/Log/LogContainer";
import Navbar from "./Components/Navbar";
import AuthRoute from "./Components/AuthRoute";
import Login from "./Components/Login";
import SignUp from "./Components/SignUp";
import Settings from "./Components/Settings/Settings";
import AccountSettings from "./Components/Settings/AccountSettings";
import ThemeSettings from "./Components/Settings/ThemeSettings";
import NotFoundPage from "./Components/NotFoundPage";
import Loading from "./Components/Loading";
import { theme } from "./theme";
import "./App.css";

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const themeMode = useSelector(state => state.user.themeMode);
  const [themeSelection, setThemeSelection] = useState(theme());

  const handleLoginAttempt = async (e) => {
    dispatch(loginJWT(localStorage.getItem("JWT_AUTH_TOKEN")));
  };

  useEffect(()=>{
    setThemeSelection(theme());
  },[themeMode])

  useEffect(() => {
    if (localStorage.getItem("JWT_AUTH_TOKEN") !== null) {
      handleLoginAttempt().then(() => setLoading(false));
    }
    else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  return loading ? <Loading /> : (
    <ThemeProvider theme={themeSelection}>
      <CssBaseline enableColorScheme />
      <Router basename="/activity-tracker/">
        <Routes>
          <Route exact path="/login" element={<Login />} />
          <Route exact path="/signup" element={<SignUp />} />
          <Route path="*" element={<NotFoundPage />} />

          <Route exact path="/" element={<AuthRoute />}>
            <Route exact path="/" element={<LogContainer />} />
          </Route>
          
          <Route exact path="/settings/*" element={<AuthRoute />}>
            <Route exact path="/settings/*/*" element={<Settings />} >
              <Route index={true} exact path="" element={<AccountSettings />} />
              <Route index={true} exact path="theme" element={<ThemeSettings />} />
            </Route>
          </Route>

        </Routes>
        <Navbar />
      </Router>
    </ThemeProvider>
  )
}

export default App
