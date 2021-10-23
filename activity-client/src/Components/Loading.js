import React from 'react';
import { makeStyles } from '@mui/styles';
import { CircularProgress, Typography } from '@mui/material';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    '& > * + *': {
      // marginLeft: theme.spacing(2),
    },
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
}));

export default function CircularIndeterminate() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
        <Typography variant='h4'>Loading</Typography>
        <CircularProgress />
    </div>
  );
}