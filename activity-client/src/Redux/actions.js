export const UPDATE_ACTIVITY = 'UPDATE_ACTIVITY';

export function updateActivityProgress(index, achieved, date) {
    return async (dispatch, getState) => {
        const newState = { ...getState() };
        newState.goals.map((goal, i) => {
            if (i === index) {
                goal.history.map(day => {
                    if (day.date === date) {
                        day.achieved = day.achieved + achieved;
                    }
                    return day;
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

export function getActivities() {
    return async (dispatch, getState) => {
        return dispatch({
            type: UPDATE_ACTIVITY,
        })
    }
}