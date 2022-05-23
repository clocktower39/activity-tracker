import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../Redux/actions";
import {
  Box,
  Button,
  Container,
  Grid,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Typography
} from "@mui/material";
import { Settings as SettingsIcon } from '@mui/icons-material';
import ChangePassword from './ChangePassword';

export default function Settings() {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const [passwordModal, setPasswordModal] = useState(false);
  const handlePasswordOpen = () => setPasswordModal(true);
  const handlePasswordClose = () => setPasswordModal(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => dispatch(logoutUser());

  return (
    <Container maxWidth="md">
      <Paper sx={{ marginTop: "25px", padding: '12.5px 0', height: '85vh', color: 'white', backgroundColor: '#303030', }}>
        <Grid container >
          <Grid container item xs={12} sx={{ justifyContent: 'space-between', padding: '0px 7.5px' }}>
            <Typography variant="h4" >Settings</Typography>
            <Button variant="contained" onClick={handleClick}><SettingsIcon /></Button>
          </Grid>
          <Grid container item xs={12} sm={4} >
            <Box component={Grid} display={{ xs: "none", sm: "flex" }}>
              <List>
                <ListItem button component={Link} to="/settings">
                  <ListItemText primary="My Account" style={{ color: "white" }} />
                </ListItem>
              </List>
            </Box>
          </Grid>
          <Grid container item xs={12} sm={8}>
            <Outlet />
          </Grid>
        </Grid>
        <Menu open={open} onClose={handleClose} anchorEl={anchorEl}>
          <MenuItem onClick={handlePasswordOpen}>Change password</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
        {passwordModal && open && (
          <ChangePassword open={open} handlePasswordClose={handlePasswordClose} />
        )}
      </Paper>
    </Container>
  );
}
