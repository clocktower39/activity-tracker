export const UPDATE_ACTIVITY = 'UPDATE_ACTIVITY';

export function updateActivity(activity){
    return ({
        type: UPDATE_ACTIVITY,
        activity,
    })
}

export function getActivities(){
    return async (dispatch, getState) => {
        return dispatch({
            type: UPDATE_ACTIVITY,
        })
    }
}