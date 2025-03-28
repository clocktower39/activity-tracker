import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { EditActivity } from '../../Redux/actions';
import {
    Button,
    Checkbox,
    Container,
    Grid,
    Paper,
    Typography
} from "@mui/material";

export default function HiddenSettings() {
    const goals = useSelector(state => state.goals);

    return (
        <Container maxWidth="md" sx={{ height: "100%" }}>
            <Grid container item xs={12} sx={{ padding: "15px" }}>
                <Typography variant="h5" gutterBottom >
                    Hidden
                </Typography>
            </Grid>
            <Paper >
                <Grid container spacing={2} sx={{ padding: "15px" }}>
                    <Grid container item xs={12} sx={{ justifyContent: 'center' }}>
                        {goals.filter((goal) => goal.hidden).map((goal) => <HiddenGoal goal={goal} />)}
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    )
}

const HiddenGoal = ({ goal }) => {
    const dispatch = useDispatch();
    const [hidden, setHidden] = useState(goal.hidden);

    const handleChange = () => {
        setHidden(prev => {
            dispatch(
                EditActivity(goal._id, {
                    ...goal,
                    hidden: !prev,
                })
            );
            return !prev
        }
        )
    }

    return (
        <Grid container item xs={12} alignItems="center">
            <Checkbox onChange={handleChange} checked={hidden} />
            <Typography variant="caption">{goal.task}</Typography>
        </Grid>
    );
}