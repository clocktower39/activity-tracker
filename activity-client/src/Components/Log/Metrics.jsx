import React, { useState } from "react";
import { Container, Grid, TextField } from "@mui/material";
import { BarChart, Bar, Tooltip, XAxis, YAxis } from "recharts";
import { useSelector } from "react-redux";
import { useWindowSize } from '../../Hooks/useWindowSize';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { addPeriod, getPeriodKey, getPeriodLabels, getPeriodStart, normalizeInterval } from "../../utils/intervals";

dayjs.extend(utc);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export const renderChart = (goal, width, height, startDate, endDate) => {
  if (!goal) return null;
  const interval = normalizeInterval(goal.interval);
  const rangeStart = getPeriodStart(interval, startDate);
  const rangeEnd = getPeriodStart(interval, endDate);

  const sortedExistingHistory = (goal.history || [])
    .map((day) => ({ ...day }))
    .sort((a, b) => (dayjs.utc(a.date).isAfter(dayjs.utc(b.date)) ? 1 : -1))
    .filter((day) =>
      dayjs.utc(getPeriodKey(interval, day.date)).isSameOrAfter(rangeStart) &&
      dayjs.utc(getPeriodKey(interval, day.date)).isSameOrBefore(rangeEnd)
    )
    .map((day) => {
      const labels = getPeriodLabels(interval, day.date);
      return {
        ...day,
        dateDay: labels.short,
        dateLabel: labels.long,
      };
    });

  const fillMissingPeriods = (history, start, end) => {
    if (interval === "none") return history;
    const dateSet = new Set(history.map((day) => getPeriodKey(interval, day.date)));
    const filledHistory = [];

    for (let date = start; date.isSameOrBefore(end); date = addPeriod(interval, date)) {
      const periodKey = date.format("YYYY-MM-DD");

      if (dateSet.has(periodKey)) {
        const existingDay = history.find((day) => getPeriodKey(interval, day.date) === periodKey);
        const labels = getPeriodLabels(interval, existingDay.date);
        filledHistory.push({
          ...existingDay,
          dateDay: labels.short,
          dateLabel: labels.long,
        });
      } else {
        const labels = getPeriodLabels(interval, date);
        filledHistory.push({
          date: periodKey,
          targetPerDuration: 1,
          achieved: 0,
          dateDay: labels.short,
          dateLabel: labels.long,
        });
      }
    }

    return filledHistory;
  };

  const history = fillMissingPeriods(sortedExistingHistory, rangeStart, rangeEnd);

  const RenderToolTip = ({ payload }) => {
    const label = payload?.[0]?.payload?.dateLabel;
    return (
      <div style={{ padding: '5px', borderRadius: '15px', backgroundColor: '#000', opacity: '.75' }}>
        <p style={{ color: 'white' }}>{label || (payload?.[0]?.payload?.date ?? "")}</p>
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
    setter(dayjs.utc(e.target.value, "YYYY-MM-DD").format("YYYY-MM-DD"))
  }

  return (
    <Grid container size={12} >
      <Grid container size={6} sx={{ justifyContent: 'center' }}>
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
      <Grid container size={6} sx={{ justifyContent: 'center' }}>
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
  const [startDate, setStartDate] = useState(dayjs.utc().subtract(7, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs.utc().format("YYYY-MM-DD"));
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const sizes = useWindowSize();

  return (
    <>
      <Container maxWidth="md" sx={{ paddingBottom: '25px' }}>
        <Grid container>
          <Grid container size={12} >
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
