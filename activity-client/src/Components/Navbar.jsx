import React, { useState, useEffect } from 'react';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Home, Settings } from '@mui/icons-material';
import { Link, useLocation } from 'react-router';

const classes = {
  root: {
    position: 'fixed',
    bottom: 0,
    width: '100%',
  },
};

export default function Navbar() {
  const location = useLocation();
  const [value, setValue] = useState(location.pathname);
  const [disableNav, setDisableNav] = useState(false);

  const handleChange = (event, newValue) => {
    setDisableNav(true);
    setValue(newValue);
      setDisableNav(false);
  };


useEffect(()=>{
  handleChange(null, location.pathname);
},[location.pathname])

  return (
    <BottomNavigation value={value} onChange={handleChange} sx={classes.root}>
      <BottomNavigationAction disabled={disableNav} label="Log" value="/" to='/' icon={<Home />} component={Link} />
      <BottomNavigationAction disabled={disableNav} label="Settings" value="/settings" to='/settings' icon={<Settings />} component={Link} />
    </BottomNavigation>
  );
}