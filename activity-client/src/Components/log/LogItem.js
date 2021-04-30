import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress, Grid, IconButton, Typography } from '@material-ui/core';
import { updateActivity } from '../../Redux/actions';

export default function LogItem(props) {
    const dispatch = useDispatch();
    const handleActivityUpdate = (task) => {
        dispatch(updateActivity(task))
    }
    return (
      <Grid container item xs={12} variant={"h3"}>
        <Grid item xs={4}>
            {props.goal.task}
        </Grid>
        <Grid item xs={4}>
            {props.goal.interval}
        </Grid>
        <Grid item xs={4}>
            <IconButton
                onClick={()=>handleActivityUpdate(props.goal.task)}
            >
                <Box position="relative" display="inline-flex">
                    <CircularProgress variant="determinate" value={Number(props.goal.achieved/props.goal.targetPerDuration*100)} />
                    <Box
                        top={0}
                        left={0}
                        bottom={0}
                        right={0}
                        position="absolute"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Typography variant="caption" component="div" color="textSecondary">
                            {`${Math.round(Number(props.goal.achieved/props.goal.targetPerDuration*100))}%`}
                        </Typography>
                    </Box>
                </Box>
            </IconButton>
            {props.goal.achieved}/{props.goal.targetPerDuration}
        </Grid>
      </Grid>
    );
}
