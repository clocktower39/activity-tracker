import jwt from 'jwt-decode';

export const UPDATE_ACTIVITY = 'UPDATE_ACTIVITY';
export const LOGIN_USER = 'LOGIN_USER';
export const LOGOUT_USER = 'LOGOUT_USER';
export const SIGNUP_USER = 'SIGNUP_USER';
export const ERROR = 'ERROR';

// const CURRENT_IP = window.location.href.split(":")[1];

export function updateActivityProgress(index, achieved, date) {
    return async (dispatch, getState) => {
        const newState = { ...getState() };
        newState.goals.map((goal, i) => {
            if (i === index) {
                (goal.history.some(day => day.date === date)) ?
                    goal.history.map(day => {
                        if (day.date === date) {
                            day.achieved = day.achieved + achieved;
                        }
                        return day;
                    }) :
                    goal.history.push({
                        date,
                        targetPerDuration: goal.defaultTarget,
                        achieved,
                    })
                const bearer = `Bearer ${localStorage.getItem('JWT_AUTH_TOKEN')}`;
                fetch(`https://myactivitytracker.herokuapp.com/update`, {
                    method: 'POST', // *GET, POST, PUT, DELETE, etc.
                    mode: 'cors', // no-cors, *cors, same-origin
                    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                    credentials: 'same-origin', // include, *same-origin, omit
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": bearer,
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                    body: JSON.stringify(goal) // body data type must match "Content-Type" header
                })
            }
            return goal;
        })
        return dispatch({
            type: UPDATE_ACTIVITY,
            newState,
        })
    }
}

export function addDateToHistory(index, historyObject) {
    return async (dispatch, getState) => {
        const newState = { ...getState() };
        newState.goals.map((goal, i) => {
            if (i === index) {
                goal.history.push({ historyObject })
            }

            return goal;
        })
        return dispatch({
            type: UPDATE_ACTIVITY,
            newState,
        })
    }
}

export function getActivities() {
    return async (dispatch, getState) => {
        const newState = { ...getState() };
        const bearer = `Bearer ${localStorage.getItem('JWT_AUTH_TOKEN')}`;
        newState.goals = await fetch(`https://myactivitytracker.herokuapp.com/`, {
            headers: {
                'Authorization': bearer,
            }
        }).then(res => res.json());

        return dispatch({
            type: UPDATE_ACTIVITY,
            newState
        })
    }
}

export function EditActivity(index, newTarget) {
    return async (dispatch, getState) => {
        const newState = { ...getState() };
        const bearer = `Bearer ${localStorage.getItem('JWT_AUTH_TOKEN')}`;
        newState.goals.map((goal, i) => {
            if (i === index) {
                goal.task = newTarget.task;
                goal.category = newTarget.category;
                goal.defaultTarget = newTarget.defaultTarget;
                fetch(`https://myactivitytracker.herokuapp.com/update`, {
                    method: 'POST', // *GET, POST, PUT, DELETE, etc.
                    mode: 'cors', // no-cors, *cors, same-origin
                    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                    credentials: 'same-origin', // include, *same-origin, omit
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': bearer,
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                    body: JSON.stringify(goal) // body data type must match "Content-Type" header
                })
            }
            return goal;
        })
        return dispatch({
            type: UPDATE_ACTIVITY,
            newState,
        })
    }
}

export function AddNewActivity(newActivity) {
    return async (dispatch, getState) => {
        const newState = { ...getState() };
        newActivity.interval = 'daily';
        newActivity.history = [];
        const bearer = `Bearer ${localStorage.getItem('JWT_AUTH_TOKEN')}`;
        fetch(`https://myactivitytracker.herokuapp.com/addGoal`, {
                    method: 'POST', // *GET, POST, PUT, DELETE, etc.
                    mode: 'cors', // no-cors, *cors, same-origin
                    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                    credentials: 'same-origin', // include, *same-origin, omit
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': bearer,
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                    body: JSON.stringify(newActivity) // body data type must match "Content-Type" header
                })
        newState.goals.push(newActivity);
        return dispatch({
            type: UPDATE_ACTIVITY,
            newState,
        })
    }
}
export function signupUser(user) {
    return async (dispatch, getState) => {
        const response = await fetch(`https://myactivitytracker.herokuapp.com/signup`, {
            method: 'post',
            dataType: 'json',
            body: user,
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        const data = await response.json();
        if (data.error) {
            return dispatch({
                type: ERROR,
                error: data.error
            });
        }

        return dispatch(loginUser(user));
    }
}

export function loginUser(user) {
    return async (dispatch, getState) => {
        const response = await fetch(`https://myactivitytracker.herokuapp.com/login`, {
            method: 'post',
            dataType: 'json',
            body: user,
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        const data = await response.json();
        if (data.error) {
            return dispatch({
                type: ERROR,
                error: data.error
            });
        }
        const accessToken = data.accessToken;
        const decodedAccessToken = jwt(accessToken);

        localStorage.setItem('JWT_AUTH_TOKEN', accessToken);
        return dispatch({
            type: LOGIN_USER,
            user: decodedAccessToken,
        });
    }
}

export const loginJWT = (token) => {
    return async (dispatch, getState) => {
        const bearer = `Bearer ${localStorage.getItem('JWT_AUTH_TOKEN')}`;

        const response = await fetch(`https://myactivitytracker.herokuapp.com/checkAuthToken`, {
            headers: {
                "Authorization": bearer,
            }
        })

        const text = await response.text().then(item=>item);
        if(text === "Authorized"){
            const decodedAccessToken = jwt(token);
            return dispatch({
                type: LOGIN_USER,
                user: decodedAccessToken,
            });
        }
        else {
            localStorage.removeItem('JWT_AUTH_TOKEN');
            return dispatch({
                type: LOGOUT_USER
            })
        }
    }
}

export function logoutUser() {
    return async (dispatch, getState) => {
        localStorage.removeItem('JWT_AUTH_TOKEN');
        return dispatch({
            type: LOGOUT_USER
        })
    }
}