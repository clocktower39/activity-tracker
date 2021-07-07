import React, { useState } from "react";
import { useSelector } from "react-redux";
import { TextField } from "@material-ui/core";

export default function Progress() {
    const goals = useSelector(state => state.goals);
    const [search, setSearch] = useState('');

    const handleChange = (e) => {
        setSearch(e.target.value);
    }

    return (
        <div>
            <TextField label="Search" fullWidth value={search} onChange={handleChange} />

            {goals.filter(goal => search === '' ? true : goal.task === search).map((goal, index) => (
                <div>{goal.task}</div>
            ))}
        </div>
    )
}
