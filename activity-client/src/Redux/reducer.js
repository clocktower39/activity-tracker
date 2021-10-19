import { LOGIN_USER, LOGOUT_USER, ERROR, UPDATE_ACTIVITY } from './actions';
import { goals, user } from './states';

export let reducer = (state = { goals, user }, action) => {
    switch (action.type) {
    case LOGIN_USER:
        return {
            ...state,
            user: {
                ...state.user,
                ...action.user,
            },
        }
    case LOGOUT_USER:
        return {
            ...state,
            user: {
            },
        }
    case UPDATE_ACTIVITY:
        return {
            ...state,
            goals: [...action.newState.goals]
        }
    case ERROR:
        return {
            ...state,
            error: { ...action.error }
        }

    default:
        return state
    }
}

