import React from "react";
import { useLongPress } from "react-use";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
} from "@material-ui/core";
import { updateActivity } from "../../Redux/actions";

export const Log = () => {
  const dispatch = useDispatch();
  const goals = useSelector((state) => state.goals);

  let categories = [];

  goals.forEach((goal) => {
    if (!categories.includes(goal.category)) {
      categories.push(goal.category);
    }
  });

  const handleActivityUpdate = (taskIndex, newAchieved) => {
    dispatch(updateActivity(taskIndex, newAchieved));
  };

  const onLongPress = () => {
    console.log('calls callback after long pressing 300ms');
  };
  const defaultOptions = {
    isPreventDefault: true,
    delay: 300,
  };
  const longPressEvent = useLongPress(onLongPress, defaultOptions);

  return (
    <Grid container justify="center">
      {categories.map((category) => {
        return (
          <Grid container item xs={12} justify={"center"}>
            <Grid item xs={12}>
              <Typography variant="body2">{category}</Typography>
            </Grid>
            {goals.map((goal, index) => {
              let circularProgressPercent = Number(
                (goal.achieved / goal.targetPerDuration) * 100
              );
              if (circularProgressPercent > 100) {
                circularProgressPercent = 100;
              } else if (circularProgressPercent < 0) {
                circularProgressPercent = 0;
              }

              return goal.category === category ? (
                <Grid container item xs={3}>
                    <Grid container item xs={12} justify="center">
                  {/* <IconButton
                    onClick={() =>
                      goal.achieved > 0
                        ? handleActivityUpdate(index, goal.achieved - 1)
                        : null
                    }
                  >
                    <RemoveCircle />
                  </IconButton> */}
                  <IconButton
                    {...longPressEvent}
                    onClick={() =>
                        handleActivityUpdate(index, goal.achieved + 1)
                      }
                    >
                  <Box
                    position="relative"
                    display="inline-flex"
                    alignItems={"center"}
                  >
                    <CircularProgress
                      variant="determinate"
                      value={circularProgressPercent===0? 100: circularProgressPercent}
                      size={50}
                      style={
                        circularProgressPercent===0? {color: '#ccc'}: {color: 'green'}
                      }
                    />
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
                      <Typography
                        variant="caption"
                        component="div"
                        color="textSecondary"
                      >
                        {`${Math.round(
                          Number((goal.achieved / goal.targetPerDuration) * 100)
                        )}%`}
                      </Typography>
                    </Box>
                  </Box>
                  </IconButton>
                  </Grid>
                    <Grid container item xs={12} justify="center" >
                        <Typography variant="body2" style={{fontSize: '10px',}} >{goal.task}</Typography>
                    </Grid>
                    
                </Grid>
              ) : (
                <></>
              );
            })}
          </Grid>
        );
      })}
    </Grid>
  );
};

export default Log;
