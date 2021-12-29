import React, { useState, useEffect } from "react";
import { Container, Grid, TextField } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { useSelector } from "react-redux";

const renderChart = (goal, width, height) => {
  const history = goal.history.map(day => {
    return day;
  })
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <BarChart width={width * 0.8} height={height * 0.5} data={history}>
        <Bar dataKey="achieved" fill="#8884d8" />
        <XAxis dataKey="date" />
        <YAxis />
      </BarChart>
    </div>
  );
};


// format a Date object like ISO in local timezone
const dateToISOLikeButLocal = (date) => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const msLocal = date.getTime() - offsetMs;
  const dateLocal = new Date(msLocal);
  const iso = dateLocal.toISOString();
  const isoLocal = iso.slice(0, 19);
  return isoLocal;
};

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize;
};

export default function Metrics() {
  const goals = useSelector((state) => state.goals);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [startDate, setStartDate] = useState(dateToISOLikeButLocal(new Date()).substr(0, 10));
  const [endDate, setEndDate] = useState(dateToISOLikeButLocal(new Date()).substr(0, 10));
  const sizes = useWindowSize();

  const handleDateChange = (e, setter) => {
    setter(new Date(e.target.value).toISOString().substr(0, 10))
  }

  return (
    <>
      <Container maxWidth="md" sx={{ paddingBottom: '25px' }}>
        <Grid container>
          <Grid item container xs={12} >
            <TextField
              label="Type"
              select
              SelectProps={{ native: true }}
              fullWidth
              value={selectedTaskIndex}
              onChange={(e) => setSelectedTaskIndex(Number(e.target.value))}
              style={{ margin: "25px 0px" }}
            >
              {goals.map((goal, index) => (
                <option key={`option-${index}`} value={index}>
                  {goal.task}
                </option>
              ))}
            </TextField>
          </Grid>

          <Grid item container xs={12} >
            <Grid item container xs={6} sx={{ justifyContent: 'center' }}>
              <TextField
                label="Start Date"
                value={startDate}
                type="date"
                variant="standard"
                onChange={(e)=>handleDateChange(e, setStartDate)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item container xs={6} sx={{ justifyContent: 'center' }}>
              <TextField
                label="End Date"
                value={endDate}
                type="date"
                variant="standard"
                onChange={(e)=>handleDateChange(e, setEndDate)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      </Container>
      {renderChart(goals[selectedTaskIndex], sizes.width, sizes.height)}
    </>
  );
}
