import React, { useState, useEffect } from "react";
import { Container, TextField } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { useSelector } from "react-redux";

const renderLineChart = (goal, width, height) => {
  let dates = [];
  goal.history.forEach((day) => {
    if (!dates.includes(day.date)) {
      dates.push(day.date);
    }
  });

  return (
    <BarChart width={width * 0.8} height={height * 0.5} data={goal.history}>
      <Bar dataKey="achieved" fill="#8884d8" />
      <XAxis dataKey="date" />
      <YAxis />
    </BarChart>
  );
};

const useWindowSize = () => {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
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
  const sizes = useWindowSize();

  return (
    <>
      <Container maxWidth="md">
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
      </Container>
      <div style={{display: 'flex', justifyContent: 'center',}}>
      {renderLineChart(goals[selectedTaskIndex], sizes.width, sizes.height)}
      </div>
    </>
  );
}
