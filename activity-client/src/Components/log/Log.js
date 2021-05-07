import React from 'react';
import { useSelector } from 'react-redux';
import { Grid } from '@material-ui/core';
import LogItem from './LogItem';

export const Log = (props) => {
    const goals = useSelector(state => state.goals);
    return (
        <Grid container>
            {goals.map((goal, index) => <LogItem goal={goal} achieved={goal.achieved} index={index} key={index} />)}
        </Grid>
    )
}

export default Log
