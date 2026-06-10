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
        <Container maxWidth="md" sx={{ height: "100%" }}>
            <Grid container size={12} sx={{ padding: "15px" }}>
                <Typography variant="h5" gutterBottom >
                    Account
                </Typography>
            </Grid>
            <Paper >
                <Grid container spacing={2} sx={{ padding: "15px" }}>
                    <Grid container size={12} sx={{ justifyContent: 'center' }}>
                        <TextField
                            value={firstName}
                            onChange={(e) => handleChange(e, setFirstName)}
                            label="First Name"
                            fullWidth
                        />
                    </Grid>
                    <Grid container size={12} sx={{ justifyContent: 'center' }}>
                        <TextField
                            value={lastName}
                            onChange={(e) => handleChange(e, setLastName)}
                            label="Last Name"
                            fullWidth
                        />
                    </Grid>
                    <Grid container size={12} sx={{ justifyContent: 'center' }}>
                        <TextField
                            value={email}
                            onChange={(e) => handleChange(e, setEmail)}
                            label="E-mail"
                            fullWidth
                        />
                    </Grid>
                    <Grid container size={12} sx={{ justifyContent: 'center' }} spacing={1}>
                        <Grid >
                            <Button variant="contained" onClick={() => null}>Cancel</Button>
                        </Grid>
                        <Grid >
                            <Button variant="contained" onClick={() => null}>Save</Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    )
}
