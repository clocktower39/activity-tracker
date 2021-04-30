import React from 'react';
import { useDispatch } from 'react-redux';
import { Box, CircularProgress, Grid, IconButton, Typography } from '@material-ui/core';
import { updateActivity } from '../../Redux/actions';

export default function LogItem(props) {
    const circularProgressPercent = Number(props.achieved/props.goal.targetPerDuration*100)>100?100:Number(props.achieved/props.goal.targetPerDuration*100);
    const dispatch = useDispatch();
    const handleActivityUpdate = (taskIndex, newAchieved) => {
        dispatch(updateActivity(taskIndex, newAchieved))
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
                onClick={()=>handleActivityUpdate(props.index, (props.goal.achieved + 1))}
            >
                <Box position="relative" display="inline-flex">
                    <CircularProgress variant="determinate" value={circularProgressPercent} />
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
