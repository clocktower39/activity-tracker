import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router";
import { Button, Container, Grid, Paper, TextField, Typography } from "@mui/material";
import { loginUser, getActivities } from "../Redux/actions";

export const Login = (props) => {
  const dispatch = useDispatch();
  const [error, setError] = useState(false);
  const [email, setEmail] = useState(
    localStorage.getItem("email") ? localStorage.getItem("email") : ""
  );
  const [password, setPassword] = useState("");
  const [disableButtonDuringLogin, setDisableButtonDuringLogin] = useState(false);
  const user = useSelector((state) => state.user);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLoginAttempt(e);
    }
  };
  const handleLoginAttempt = (e) => {
    if (email && password) {
      setDisableButtonDuringLogin(true);
      dispatch(loginUser(JSON.stringify({ email: email, password: password }))).then((res) => {
        if (res.error) {
          setError(true);
        }
        setDisableButtonDuringLogin(false);
      })
      .then(()=>dispatch(getActivities()))
      .then(()=>setDisableButtonDuringLogin(false));
      localStorage.setItem("email", email);
    } else {
      setDisableButtonDuringLogin(false);
      setError(true);
    }
  };

  const loginAsGuest = () => {
    setDisableButtonDuringLogin(true);
    dispatch(loginUser(JSON.stringify({ email: "DEMO@FAKEACCOUNT.COM", password: "GUEST" }))).then(
      (res) => {
        if (res.error) {
          setError(true);
        }
        setDisableButtonDuringLogin(false);
      }
    )
    .then(()=>dispatch(getActivities()))
    .then(()=>setDisableButtonDuringLogin(false));
  };

  if (user.email) {
    return <Navigate to={{ pathname: "/" }} />;
  }
  return (
    <Container maxWidth="md" >
      <Paper sx={{ backgroundColor: '#303030', marginTop: "25px", padding: '12.5px 0', textAlign: 'center', height: '85vh', }}>
        <Grid container spacing={2} >
          <Grid size={12}>
            <Typography variant="h4" gutterBottom>
              Log in
            </Typography>
          </Grid>
          <Grid size={12}>
            <TextField
              error={error === true ? true : false}
              helperText={error === true ? "Please enter your email" : false}
              label="Email"
              value={email}
              onKeyDown={(e) => handleKeyDown(e)}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              error={error === true ? true : false}
              helperText={error === true ? "Please enter your password" : false}
              label="Password"
              value={password}
              type="password"
              onKeyDown={(e) => handleKeyDown(e)}
              onChange={(e) => {
                setPassword(e.target.value);
                e.target.value === "" ? setError(true) : setError(false);
              }}
            />
          </Grid>
          <Grid container size={12} spacing={2} justifyContent="center" >
            <Grid size={12}>
              <Button
                variant="contained"
                onClick={(e) => handleLoginAttempt(e)}
                disabled={disableButtonDuringLogin}
              >
                Login
              </Button>
            </Grid>

            <Grid size={12}>
              <Button
                variant="contained"
                color="secondary"
                onClick={(e) => loginAsGuest(e)}
                disabled={disableButtonDuringLogin}
              >
                Login as a Guest
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Login;
