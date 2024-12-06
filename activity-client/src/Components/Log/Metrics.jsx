import React, { useState } from "react";
import { Container, Grid, TextField } from "@mui/material";
import { BarChart, Bar, Tooltip, XAxis, YAxis } from "recharts";
import { useSelector } from "react-redux";
import { useWindowSize } from '../../Hooks/useWindowSize';
import { dateToISOLikeButLocal, adjustDays } from './LogContainer';

export const renderChart = (goal, width, height, startDate, endDate) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const history = goal.history
    .sort((a, b) => new Date(a.date) > new Date(b.date))
    .filter(day => new Date(day.date) >= new Date(startDate) && new Date(day.date) <= new Date(endDate))
    .map(day => {
      day.dateDay = days[new Date(day.date).getDay()];
      return day;
    })

  const RenderToolTip = ({ payload }) => {
    return (
      <div style={{ padding: '5px', borderRadius: '15px', backgroundColor: '#000', opacity: '.75' }}>
        <p style={{ color: 'white' }}>{payload[0] && payload[0].payload.date}</p>
        <p style={{ color: 'white' }}>Achieved: {payload[0] && payload[0].payload.achieved}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: '15px', marginLeft: '-12.5%' }}>
      <BarChart width={width * 0.8} height={height * 0.5} data={history}>
        <Tooltip content={<RenderToolTip />} />
        <Bar dataKey="achieved" fill="#8884d8" />
        <XAxis dataKey="dateDay" />
        <YAxis />
      </BarChart>
    </div>
  );
};

export const DateRange = ({ startDate, setStartDate, endDate, setEndDate }) => {
  const handleDateChange = (e, setter) => {
    setter(new Date(e.target.value).toISOString().substr(0, 10))
  }

  return (
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
  )
}

export default function Metrics() {
  const goals = useSelector((state) => state.goals);
  const [startDate, setStartDate] = useState(dateToISOLikeButLocal(adjustDays(new Date(), -7)).substr(0, 10));
  const [endDate, setEndDate] = useState(dateToISOLikeButLocal(new Date()).substr(0, 10));
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const sizes = useWindowSize();

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
              sx={{ margin: "25px 0px" }}
            >
              {goals.map((goal, index) => (
                <option key={`option-${index}`} value={index}>
                  {goal.task}
                </option>
              ))}
            </TextField>
          </Grid >
          <DateRange startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
        </Grid>
      </Container>
      {renderChart(goals[selectedTaskIndex], sizes.width, sizes.height, startDate, endDate)}
    </>
  );
}
