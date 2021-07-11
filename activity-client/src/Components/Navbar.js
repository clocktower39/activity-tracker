import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import { Home, Edit, Assessment } from '@material-ui/icons';
import { Link, useLocation } from 'react-router-dom';

const useStyles = makeStyles({
  root: {
    position: 'fixed',
    bottom: 0,
    width: '100%',
  },
});

export default function Navbar() {
  const classes = useStyles();
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
    <BottomNavigation value={value} onChange={handleChange} className={classes.root}>
      <BottomNavigationAction disabled={disableNav} label="Log" value="/" to='/' icon={<Home />} component={Link} />
      <BottomNavigationAction disabled={disableNav} label="Edit" value="/edit" to='/edit' icon={<Edit />} component={Link} />
      <BottomNavigationAction disabled={disableNav} label="Metrics" value="/metrics" to='/metrics' icon={<Assessment />} component={Link} />
    </BottomNavigation>
  );
}