import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
    Button,
    Container,
    Grid,
    Paper,
    TextField,
    Typography
} from "@mui/material";

export default function AccountSettings() {
    const user = useSelector(state => state.user)
    const [email, setEmail] = useState(user.email);
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName, setLastName] = useState(user.lastName);

    const handleChange = (e, setter) => {
        setter(e.target.value);
    }

    return (
        <Container maxWidth="md" style={{ height: "100%" }}>
            <Grid container item xs={12} style={{ padding: "15px" }}>
                <Typography variant="h5" gutterBottom style={{ color: "#fff" }}>
                    My Account
                </Typography>
            </Grid>
            <Paper sx={{ backgroundColor: '#1B1B1B' }}>
                <Grid container spacing={2} sx={{ padding: "15px" }}>
                    <Grid container item xs={12} style={{ justifyContent: 'center' }}>
                        <TextField
                            value={firstName}
                            onChange={(e) => handleChange(e, setFirstName)}
                            label="First Name"
                            fullWidth
                        />
                    </Grid>
                    <Grid container item xs={12} style={{ justifyContent: 'center' }}>
                        <TextField
                            value={lastName}
                            onChange={(e) => handleChange(e, setLastName)}
                            label="Last Name"
                            fullWidth
                        />
                    </Grid>
                    <Grid container item xs={12} style={{ justifyContent: 'center' }}>
                        <TextField
                            value={email}
                            onChange={(e) => handleChange(e, setEmail)}
                            label="E-mail"
                            fullWidth
                        />
                    </Grid>
                    <Grid container item xs={12} style={{ justifyContent: 'center' }} spacing={1}>
                        <Grid item >
                            <Button variant="contained" onClick={() => null}>Cancel</Button>
                        </Grid>
                        <Grid item >
                            <Button variant="contained" onClick={() => null}>Save</Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    )
}
