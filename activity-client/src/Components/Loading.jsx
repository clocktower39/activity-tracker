import React from "react";
import { LinearProgress, } from "@mui/material";

const classes = {
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },
};

export default function Loading() {
  return (
    <div className={classes.root}>
      <LinearProgress />
    </div>
  );
}
