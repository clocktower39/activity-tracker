import React from "react";
import { useDispatch } from "react-redux";
import { logoutUser } from "../Redux/actions";
import { Button, Container, Paper, Typography } from "@mui/material";

export default function Settings() {
  const dispatch = useDispatch();

  return (
    <Container component={Paper} style={{height: '100vh'}}>
      <Typography variant="h4" >Settings</Typography>
      <Button onClick={()=>dispatch(logoutUser())}>Logout</Button>
    </Container>
  );
}
