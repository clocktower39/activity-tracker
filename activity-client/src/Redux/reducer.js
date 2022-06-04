import { LOGIN_USER, LOGOUT_USER, ERROR, UPDATE_ACTIVITY, UPDATE_CATEGORIES, UPDATE_THEME_MODE, } from './actions';
import { goals, categories, user, theme } from './states';

export let reducer = (state = { goals, categories, user, theme }, action) => {
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
            goals: [],
            user: {
            },
        }
    case UPDATE_ACTIVITY:
        return {
            ...state,
            goals: [...action.newState.goals],
            categories: [...action.newState.categories],
        }
    case UPDATE_CATEGORIES:
        return {
            ...state,
            categories: [...action.categories],
        }
    case UPDATE_THEME_MODE:
        return {
            ...state,
            theme: {
                ...state.theme,
                mode: action.mode,
            }
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

