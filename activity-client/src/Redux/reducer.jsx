import { APPLY_CACHED_ACTIVITY, LOGIN_USER, LOGOUT_USER, ERROR, UPDATE_ACTIVITY, UPDATE_CATEGORIES, DELETE_GOAL, SET_ACTIVITY_LOADING, SET_SELECTED_DATE } from './actions';
import { goals, categories, user } from './states';

export let reducer = (state = { goals, categories, user, activityLoaded: false, activityByDate: {}, activityLoadingByDate: {}, selectedDate: null, activeDate: null }, action) => {
    switch (action.type) {
    case LOGIN_USER:
        return {
            ...state,
            user: {
                ...action.user,
            },
        }
    case LOGOUT_USER:
        return {
            ...state,
            goals: [],
            categories: [],
            activityLoaded: false,
            activityByDate: {},
            activityLoadingByDate: {},
            selectedDate: null,
            activeDate: null,
            user: {
                themeMode: 'dark',
            },
        }
    case UPDATE_ACTIVITY:
        {
        const dateKey = action.selectedDate || state.selectedDate;
        const nextActivityByDate = dateKey
            ? {
                ...state.activityByDate,
                [dateKey]: {
                    goals: [...action.newState.goals],
                    categories: [...action.newState.categories],
                },
            }
            : state.activityByDate;
        return {
            ...state,
            goals: [...action.newState.goals],
            categories: [...action.newState.categories],
            activityLoaded: true,
            activityByDate: nextActivityByDate,
            activeDate: dateKey || state.activeDate,
        }
        }
    case UPDATE_CATEGORIES:
        return {
            ...state,
            categories: [...action.categories],
        }
    case APPLY_CACHED_ACTIVITY: {
        const cached = state.activityByDate[action.selectedDate];
        if (!cached) return state;
        return {
            ...state,
            goals: [...cached.goals],
            categories: [...cached.categories],
            activityLoaded: true,
            activeDate: action.selectedDate,
        };
    }
    case SET_ACTIVITY_LOADING:
        return {
            ...state,
            activityLoadingByDate: {
                ...state.activityLoadingByDate,
                [action.selectedDate]: action.loading,
            },
        };
    case SET_SELECTED_DATE:
        return {
            ...state,
            selectedDate: action.selectedDate,
        };
    case DELETE_GOAL:
        return {
            ...state,
            goals: [ ...state.goals.filter(goal => goal._id !== action.goalId) ]
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
