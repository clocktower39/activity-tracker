import React, { useState } from "react";
import { Container, Grid, TextField } from "@mui/material";
import { BarChart, Bar, Tooltip, XAxis, YAxis } from "recharts";
import { useSelector } from "react-redux";
import { useWindowSize } from '../../Hooks/useWindowSize';

export const renderChart = (goal, width, height, startDate, endDate) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const history = goal.history
    .sort((a, b) => new Date(a.date) > new Date(b.date))
    .filter(day => new Date(day.date) >= new Date(startDate) && new Date(day.date) <= new Date(endDate))
    .map(day => {
      day.dateDay = days[new Date(day.date).getDay()];
      return day;
    })

  const RenderToolTip = ({ payload }) => {
    return (
      <div style={{ padding: '5px', borderRadius: '15px', backgroundColor: '#000', opacity: '.75'}}>
        <p style={{color: 'white'}}>{payload[0] && payload[0].payload.date}</p>
        <p style={{color: 'white'}}>Achieved: {payload[0] && payload[0].payload.achieved}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <BarChart width={width * 0.8} height={height * 0.5} data={history}>
        <Tooltip content={<RenderToolTip />} />
        <Bar dataKey="achieved" fill="#8884d8" />
        <XAxis dataKey="dateDay" />
        <YAxis />
      </BarChart>
    </div>
  );
};

const adjustDays = (date, days) => {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// format a Date object like ISO in local timezone
const dateToISOLikeButLocal = (date) => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const msLocal = date.getTime() - offsetMs;
  const dateLocal = new Date(msLocal);
  const iso = dateLocal.toISOString();
  const isoLocal = iso.slice(0, 19);
  return isoLocal;
};

export default function Metrics() {
  const goals = useSelector((state) => state.goals);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [startDate, setStartDate] = useState(dateToISOLikeButLocal(adjustDays(new Date(), -7)).substr(0, 10));
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
                onChange={(e) => handleDateChange(e, setStartDate)}
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
                onChange={(e) => handleDateChange(e, setEndDate)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      </Container>
      {renderChart(goals[selectedTaskIndex], sizes.width, sizes.height, startDate, endDate)}
    </>
  );
}
