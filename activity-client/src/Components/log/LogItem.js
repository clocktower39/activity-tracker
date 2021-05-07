import React from 'react';
import { useDispatch } from 'react-redux';
import { Box, CircularProgress, Grid, IconButton, Typography } from '@material-ui/core';
import { AddCircle, RemoveCircle } from '@material-ui/icons';
import { updateActivity } from '../../Redux/actions';

export default function LogItem(props) {
    let circularProgressPercent = Number(props.achieved/props.goal.targetPerDuration*100);
    if(circularProgressPercent>100){
        circularProgressPercent = 100;
    }
    else if(circularProgressPercent<0){
        circularProgressPercent = 0;
    }
    const dispatch = useDispatch();
    const handleActivityUpdate = (taskIndex, newAchieved) => {
        dispatch(updateActivity(taskIndex, newAchieved))
    }
    return (
      <Grid container item xs={12} variant={"h3"}>
        <Grid container item xs={4} alignItems={'center'}>
            <Typography variant={'h5'} >{props.goal.task}</Typography>
        </Grid>
        <Grid item xs={8} container alignItems={'center'}>
            <IconButton
                onClick={()=>(props.goal.achieved>0)?handleActivityUpdate(props.index, (props.goal.achieved - 1)):null}
            >
                <RemoveCircle/>
            </IconButton>
            <Box position="relative" display="inline-flex" alignItems={'center'}>
                <CircularProgress variant="determinate" value={circularProgressPercent} size={100}/>
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
            
            <IconButton
                onClick={()=>handleActivityUpdate(props.index, (props.goal.achieved + 1))}
            >
                <AddCircle/>
            </IconButton>
            <Typography variant={'caption'}>{props.goal.achieved}/{props.goal.targetPerDuration}</Typography>
        </Grid>
      </Grid>
    );
}
