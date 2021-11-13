import React, { useState } from "react";
import { Container, TextField } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { useSelector } from "react-redux";

const renderLineChart = (goal) => (
  <BarChart width={window.innerWidth * 0.75} height={window.innerWidth * 0.25} data={goal.history}>
    <Bar dataKey="achieved" fill="#8884d8" />
    <XAxis dataKey="date" />
    <YAxis />
  </BarChart>
);
export default function Metrics() {
  const goals = useSelector((state) => state.goals);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);

  return (
    <Container maxWidth="md">
      <TextField
        label="Type"
        select
        SelectProps={{ native: true }}
        fullWidth
        value={selectedTaskIndex}
        onChange={(e) => setSelectedTaskIndex(Number(e.target.value))}
        style={{ margin: '25px 0px'}}
      >
        {goals.map((goal, index) => (
          <option key={`option-${index}`} value={index}>
            {goal.task}
          </option>
        ))}
      </TextField>
      {renderLineChart(goals[selectedTaskIndex])}
    </Container>
  );
}
