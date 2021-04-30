export const UPDATE_ACTIVITY = 'UPDATE_ACTIVITY';

export function updateActivity(index, achieved){
    return async (dispatch, getState) => {
        const newState = { ...getState() };
        newState.goals.map((goal,i)=>{
            if(i===index){
                goal.achieved = achieved;
            }
            return goal;
        })
        return dispatch({
            type: UPDATE_ACTIVITY,
            newState,
        })
    }
}

export function getActivities(){
    return async (dispatch, getState) => {
        return dispatch({
            type: UPDATE_ACTIVITY,
        })
    }
}