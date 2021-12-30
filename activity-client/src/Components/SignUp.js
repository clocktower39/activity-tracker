import React, { useState } from 'react';
import { Button, Container, Grid, Paper, TextField, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { signupUser } from '../Redux/actions';


export const SignUp = (props) => {
    const dispatch = useDispatch();
    const [error, setError] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const user = useSelector(state => state.user);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (firstName && lastName && email && password && confirmPassword) {
                handleSignupAttempt();
            }
        }
    }
    const handleSignupAttempt = (e) => {
        if (email && password) {
            dispatch(signupUser(JSON.stringify({ firstName, lastName, email, password })));
            localStorage.setItem('email', email);
        }
    }
    if (user.email) {
        return (<Redirect to={{ pathname: '/' }} />)
    }

    return (
        <Container maxWidth="md" >
            <Paper sx={{ backgroundColor: '#303030', marginTop: "25px", padding: '12.5px 0', textAlign: 'center', height: '85vh', }}>
                <Grid container spacing={2} >
                    <Grid item xs={12}><Typography variant="h4" gutterBottom >Sign Up</Typography></Grid>
                    <Grid item xs={12}>
                        <TextField
                            error={error === true ? true : false}
                            helperText={error === true ? "Please enter your first name" : false}
                            label="First Name"
                            value={firstName}
                            onKeyDown={(e) => handleKeyDown(e)}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            error={error === true ? true : false}
                            helperText={error === true ? "Please enter your last name" : false}
                            label="Last Name"
                            value={lastName}
                            onKeyDown={(e) => handleKeyDown(e)}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            error={error === true ? true : false}
                            helperText={error === true ? "Please enter your email" : false}
                            label="Email"
                            value={email}
                            onKeyDown={(e) => handleKeyDown(e)}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            error={error === true ? true : false}
                            helperText={(error === true) ? "Please enter your password" : false}
                            label="Password"
                            value={password}
                            type="password"
                            onKeyDown={(e) => handleKeyDown(e)}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                (e.target.value === '') ? setError(true) : setError(false);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            error={error === true ? true : false}
                            helperText={(error === true) ? "Please enter your password" : false}
                            label="Confirm Password"
                            value={confirmPassword}
                            type="password"
                            onKeyDown={(e) => handleKeyDown(e)}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                (e.target.value === '') ? setError(true) : setError(false);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            onClick={handleSignupAttempt}
                        >
                            Sign Up
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    )
}

export default SignUp
