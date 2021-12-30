import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../Redux/actions";
import { Button, Container, Grid, Paper, TextField, Typography } from "@mui/material";

export default function Settings() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user)
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);

  const handleChange = (e, setter) => {
    setter(e.target.value);
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ marginTop: "25px", padding: '12.5px 0', height: '85vh', color: 'white', backgroundColor: '#303030',}}>
        <Grid container >
          <Grid container item xs={12} sx={{ justifyContent: 'center', padding: '12.5px' }}>
            <Grid container item xs={5}>
              <Typography variant="h4" >Settings</Typography>
            </Grid>
            <Grid container item xs={5} style={{ justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={() => dispatch(logoutUser())}>Logout</Button>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid container item xs={12} style={{ justifyContent: 'center' }}>
              <TextField value={email} onChange={(e) => handleChange(e, setEmail)} label="E-mail" />
            </Grid>
            <Grid container item xs={12} style={{ justifyContent: 'center' }}>
              <TextField value={firstName} onChange={(e) => handleChange(e, setFirstName)} label="First Name" />
            </Grid>
            <Grid container item xs={12} style={{ justifyContent: 'center' }}>
              <TextField value={lastName} onChange={(e) => handleChange(e, setLastName)} label="Last Name" />
            </Grid>
            <Grid container item xs={12} style={{ justifyContent: 'center' }} spacing={1}>
              <Grid item >
                <Button variant="contained" onClick={() => null}>Cancel</Button>
              </Grid>
              <Grid item >
                <Button variant="contained" onClick={() => null}>Save</Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
