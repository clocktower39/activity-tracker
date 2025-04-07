import React, { useState } from "react";
import { Link, Outlet } from "react-router";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../Redux/actions";
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Typography
} from "@mui/material";
import { Settings as SettingsIcon, List as ListIcon } from '@mui/icons-material';
import ChangePassword from './ChangePassword';

export default function Settings() {
  const dispatch = useDispatch();
  const [openOutletList, setOpenOutletList] = useState(true);
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

  const handleOutletLists = () => setOpenOutletList(prev => !prev);

  const handleLogout = () => dispatch(logoutUser());

  const OutletList = () => {
    return (
      <List>
        <ListItem button component={Link} to="/settings">
          <ListItemText primary="Account" />
        </ListItem>
        <ListItem button component={Link} to="/settings/theme">
          <ListItemText primary="Theme" />
        </ListItem>
        <ListItem button component={Link} to="/settings/hidden">
          <ListItemText primary="Hidden" />
        </ListItem>
      </List>
    )
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ marginTop: "25px", padding: '12.5px 0', height: '85vh', backgroundColor: 'background.goalContainer', }}>
        <Grid container >
          <Grid container size={12} sx={{ justifyContent: 'space-between', padding: '0px 7.5px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', }}>
              <IconButton onClick={handleOutletLists} ><ListIcon /></IconButton>
              <Typography variant="h4" >Settings</Typography>
            </Box>
            <Button variant="contained" onClick={handleClick}><SettingsIcon /></Button>
          </Grid>
          <Grid container size={{ xs: 12, sm: 4, }} sx={{ display: openOutletList ? 'flex' : 'none', }}>
            <OutletList />
          </Grid>
          <Grid container size={{ xs: 12, sm: openOutletList ? 8 : 12,}} >
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
