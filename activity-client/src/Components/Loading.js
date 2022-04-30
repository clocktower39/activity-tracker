import React from 'react';
import { CircularProgress, Typography } from '@mui/material';

const classes = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: 'white',
  },
};

export default function CircularIndeterminate() {

  return (
    <div sx={classes.root}>
        <Typography variant='h4'>Loading</Typography>
        <CircularProgress />
    </div>
  );
}