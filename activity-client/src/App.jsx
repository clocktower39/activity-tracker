import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router";
import { useSelector } from "react-redux";
import { ThemeProvider, CssBaseline } from "@mui/material";
import LogContainer from "./Components/Log/LogContainer";
import Navbar from "./Components/Navbar";
import AuthRoute from "./Components/AuthRoute";
import Login from "./Components/Login";
import SignUp from "./Components/SignUp";
import Settings from "./Components/Settings/Settings";
import AccountSettings from "./Components/Settings/AccountSettings";
import ThemeSettings from "./Components/Settings/ThemeSettings";
import HiddenSettings from "./Components/Settings/HiddenSettings";
import NotificationsSettings from "./Components/Settings/NotificationsSettings";
import NotFoundPage from "./Components/NotFoundPage";
import { theme } from "./theme";
import "./App.css";

function App() {
  const themeMode = useSelector(state => state.user.themeMode);
  const [themeSelection, setThemeSelection] = useState(theme());

  useEffect(()=>{
    setThemeSelection(theme());
  },[themeMode])

  return (
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
              <Route index={true} exact path="notifications" element={<NotificationsSettings />} />
              <Route index={true} exact path="hidden" element={<HiddenSettings />} />
            </Route>
          </Route>

        </Routes>
        <Navbar />
      </Router>
    </ThemeProvider>
  )
}

export default App
