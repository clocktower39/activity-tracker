export const UPDATE_ACTIVITY = 'UPDATE_ACTIVITY';

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
                fetch('http://192.168.0.205:8000/update', {
                    method: 'POST', // *GET, POST, PUT, DELETE, etc.
                    mode: 'cors', // no-cors, *cors, same-origin
                    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                    credentials: 'same-origin', // include, *same-origin, omit
                    headers: {
                        'Content-Type': 'application/json'
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
        newState.goals = await fetch('http://192.168.0.205:8000/').then(res => res.json());

        return dispatch({
            type: UPDATE_ACTIVITY,
            newState
        })
    }
}

export function EditActivity(index, newTarget) {
    return async (dispatch, getState) => {
        const newState = { ...getState() };
        newState.goals.map((goal, i) => {
            if (i === index) {
                goal.task = newTarget.task;
                goal.category = newTarget.category;
                goal.defaultTarget = newTarget.defaultTarget;
                fetch('http://192.168.0.205:8000/update', {
                    method: 'POST', // *GET, POST, PUT, DELETE, etc.
                    mode: 'cors', // no-cors, *cors, same-origin
                    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                    credentials: 'same-origin', // include, *same-origin, omit
                    headers: {
                        'Content-Type': 'application/json'
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
        fetch('http://192.168.0.205:8000/addGoal', {
                    method: 'POST', // *GET, POST, PUT, DELETE, etc.
                    mode: 'cors', // no-cors, *cors, same-origin
                    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                    credentials: 'same-origin', // include, *same-origin, omit
                    headers: {
                        'Content-Type': 'application/json'
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