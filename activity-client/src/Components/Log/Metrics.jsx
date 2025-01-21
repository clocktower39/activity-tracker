import React, { useState } from "react";
import { Container, Grid, TextField } from "@mui/material";
import { BarChart, Bar, Tooltip, XAxis, YAxis } from "recharts";
import { useSelector } from "react-redux";
import { useWindowSize } from '../../Hooks/useWindowSize';
import dayjs from "dayjs";

export const renderChart = (goal, width, height, startDate, endDate) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const sortedExistingHistory = goal.history
    .sort((a, b) => new Date(a.date) > new Date(b.date))
    .filter(day => new Date(day.date) >= new Date(startDate) && new Date(day.date) <= new Date(endDate))
    .map(day => {
      day.dateDay = days[new Date(day.date).getDay()];
      return day;
    });

    const fillMissingDays = (history, startDate, endDate) => {
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dateSet = new Set(history.map(day => new Date(day.date).toISOString().split('T')[0]));
      const filledHistory = [];
    
      // Loop through each day in the date range
      for (let date = new Date(startDate); date <= new Date(endDate); date.setDate(date.getDate() + 1)) {
        const isoDate = new Date(date).toISOString().split('T')[0];
    
        // If the date exists in the history, add it to the result
        if (dateSet.has(isoDate)) {
          const existingDay = history.find(day => new Date(day.date).toISOString().split('T')[0] === isoDate);
          filledHistory.push({
            ...existingDay,
            dateDay: daysOfWeek[new Date(existingDay.date).getDay()],
          });
        } else {
          // If the date is missing, add a filler entry
          filledHistory.push({
            date: isoDate,
            targetPerDuration: 1,
            achieved: 0,
            dateDay: daysOfWeek[new Date(date).getDay()],
          });
        }
      }
    
      return filledHistory;
    };
    
    const history = fillMissingDays(sortedExistingHistory, startDate, endDate);

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
  const [startDate, setStartDate] = useState(dayjs(new Date()).subtract(7, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs(new Date()).format("YYYY-MM-DD"));
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
