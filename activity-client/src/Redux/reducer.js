import { UPDATE_ACTIVITY } from './actions';
import { goals } from './states';

export let reducer = (state = { goals }, action) => {
    switch (action.type) {

    case UPDATE_ACTIVITY:
        return { 
            goals: [...action.newState.goals]
        }

    default:
        return state
    }
}

