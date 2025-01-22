import { jwtDecode as jwt } from "jwt-decode";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(advancedFormat);

export const UPDATE_ACTIVITY = "UPDATE_ACTIVITY";
export const UPDATE_CATEGORIES = "UPDATE_CATEGORIES";
export const LOGIN_USER = "LOGIN_USER";
export const LOGOUT_USER = "LOGOUT_USER";
export const SIGNUP_USER = "SIGNUP_USER";
export const DELETE_GOAL = "DELETE_GOAL";
export const ERROR = "ERROR";

// dev server
// const currentIP = window.location.href.split(":")[1];
// const serverURL = `http:${currentIP}:8000`;

// live server
const serverURL = "https://myactivitytracker.herokuapp.com";

export function updateActivityProgress(goalId, achieved, date) {
  return async (dispatch, getState) => {
    const bearer = `Bearer ${localStorage.getItem("JWT_AUTH_TOKEN")}`;
    const newState = { ...getState() };
    let targetHistoryItem = null;

    // Find the target goal
    const goal = newState.goals.find((goal) => goal._id === goalId);
    if (!goal) {
      console.error("Goal not found");
      return Promise.reject(new Error("Goal not found"));
    }

    const formattedDate = dayjs(date).format("YYYY-MM-DD");

    // Check if the entry exists in the goal history
    const existingEntry = goal.history.find(
      (day) => dayjs(day.date).add(1, "day").format("YYYY-MM-DD") === formattedDate
    );

    if (existingEntry) {
      targetHistoryItem = existingEntry;
      if (!existingEntry._id) {
        console.error("Existing entry does not have an _id");
        return Promise.reject(new Error("Invalid entry: missing _id"));
      }

      // Update existing entry
      existingEntry.achieved += achieved;

      // Send to the server
      try {
        await fetch(`${serverURL}/updateHistoryItem`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: bearer,
          },
          body: JSON.stringify({ goalId, historyItem: existingEntry }),
        });
      } catch (error) {
        console.error("Failed to update history item:", error);
        return Promise.reject(error);
      }
    } else {
      // Add a new entry
      const newHistoryItem = {
        date: new Date(date).toISOString(),
        targetPerDuration: goal.defaultTarget,
        achieved,
      };

      // Optimistically add the new item to the history
      goal.history.push(newHistoryItem);

      try {
        const response = await fetch(`${serverURL}/newHistoryItem`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: bearer,
          },
          body: JSON.stringify({ goalId, historyItem: newHistoryItem }),
        });
        const result = await response.json();

        // Update the _id for the new item
        if (result.newHistoryItem._id) {
          targetHistoryItem = result.newHistoryItem;
          newHistoryItem._id = result.newHistoryItem._id;
        } else {
          console.error("Failed to retrieve new ID from server");
          return Promise.reject(new Error("Failed to retrieve new ID"));
        }
      } catch (error) {
        console.error("Failed to add new history item:", error);
        return Promise.reject(error);
      }
    }

    // Dispatch the updated state
    dispatch({
      type: UPDATE_ACTIVITY,
      newState,
    });

    return { promise: Promise.resolve(), historyItem: targetHistoryItem};
  };
}

export function deleteGoal(goalId) {
  return async (dispatch, getState) => {
    const bearer = `Bearer ${localStorage.getItem("JWT_AUTH_TOKEN")}`;
    fetch(`${serverURL}/deleteGoal`, {
      method: "post",
      dataType: "json",
      body: JSON.stringify({ goalId }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: bearer,
      },
    });
    return dispatch({
      type: DELETE_GOAL,
      goalId,
    });
  };
}

export function getActivities(selectedDate) {
  return async (dispatch, getState) => {
    const newState = { ...getState() };
    const bearer = `Bearer ${localStorage.getItem("JWT_AUTH_TOKEN")}`;
    const data = await fetch(`${serverURL}/`, {
      method: "post",
      dataType: "json",
      body: JSON.stringify({ selectedDate }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: bearer,
      },
    }).then((res) => res.json());

    return dispatch({
      type: UPDATE_ACTIVITY,
      newState: {
        ...newState,
        goals: data.goals,
        categories: data.categories,
      },
    });
  };
}

export function EditActivity(goalId, newTarget) {
  return async (dispatch, getState) => {
    const newState = { ...getState() };
    const bearer = `Bearer ${localStorage.getItem("JWT_AUTH_TOKEN")}`;
    newState.goals.map((goal, i) => {
      if (goal._id === goalId) {
        goal.task = newTarget.task;
        goal.category = newTarget.category;
        goal.defaultTarget = newTarget.defaultTarget;
        goal.order = newTarget.order;
        fetch(`${serverURL}/update`, {
          method: "POST", // *GET, POST, PUT, DELETE, etc.
          mode: "cors", // no-cors, *cors, same-origin
          cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
          credentials: "same-origin", // include, *same-origin, omit
          headers: {
            "Content-Type": "application/json",
            Authorization: bearer,
          },
          referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
          body: JSON.stringify({ goalId, goal }),
        });
      }
      return goal;
    });
    return dispatch({
      type: UPDATE_ACTIVITY,
      newState,
    });
  };
}

export function AddNewActivity(newActivity) {
  return async (dispatch, getState) => {
    const newState = { ...getState() };
    newActivity.interval = "daily";
    newActivity.history = [];
    const bearer = `Bearer ${localStorage.getItem("JWT_AUTH_TOKEN")}`;
    fetch(`${serverURL}/addGoal`, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        Authorization: bearer,
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(newActivity), // body data type must match "Content-Type" header
    });
    newState.goals.push(newActivity);
    return dispatch({
      type: UPDATE_ACTIVITY,
      newState,
    });
  };
}

export function updateCategories(categories) {
  return async (dispatch) => {
    const bearer = `Bearer ${localStorage.getItem("JWT_AUTH_TOKEN")}`;
    fetch(`${serverURL}/updateCategories`, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        Authorization: bearer,
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify({ categories }), // body data type must match "Content-Type" header
    });
    return dispatch({
      type: UPDATE_CATEGORIES,
      categories,
    });
  };
}

export function updateThemeMode(mode) {
  return async (dispatch) => {
    const bearer = `Bearer ${localStorage.getItem("JWT_AUTH_TOKEN")}`;
    const response = await fetch(`${serverURL}/updateUser`, {
      method: "post",
      dataType: "json",
      body: JSON.stringify({ themeMode: mode }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: bearer,
      },
    });
    const data = await response.json();
    if (data.error) {
      return dispatch({
        type: ERROR,
        error: data.error,
      });
    }
    const accessToken = data.accessToken;
    const decodedAccessToken = jwt(accessToken);

    localStorage.setItem("JWT_AUTH_TOKEN", accessToken);
    return dispatch({
      type: LOGIN_USER,
      user: decodedAccessToken,
    });
  };
}

export function signupUser(user) {
  return async (dispatch, getState) => {
    const response = await fetch(`${serverURL}/signup`, {
      method: "post",
      dataType: "json",
      body: user,
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    });
    const data = await response.json();
    if (data.error) {
      return dispatch({
        type: ERROR,
        error: data.error,
      });
    }

    return dispatch(loginUser(user));
  };
}

export function loginUser(user) {
  return async (dispatch, getState) => {
    const response = await fetch(`${serverURL}/login`, {
      method: "post",
      dataType: "json",
      body: user,
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    });
    const data = await response.json();
    if (data.error) {
      return dispatch({
        type: ERROR,
        error: data.error,
      });
    }
    const accessToken = data.accessToken;
    const decodedAccessToken = jwt(accessToken);

    localStorage.setItem("JWT_AUTH_TOKEN", accessToken);
    return dispatch({
      type: LOGIN_USER,
      user: decodedAccessToken,
    });
  };
}

export const loginJWT = (token) => {
  return async (dispatch, getState) => {
    const bearer = `Bearer ${localStorage.getItem("JWT_AUTH_TOKEN")}`;

    const response = await fetch(`${serverURL}/checkAuthToken`, {
      headers: {
        Authorization: bearer,
      },
    });

    const text = await response.text().then((item) => item);
    if (text === "Authorized") {
      const decodedAccessToken = jwt(token);
      return dispatch({
        type: LOGIN_USER,
        user: decodedAccessToken,
      });
    } else {
      localStorage.removeItem("JWT_AUTH_TOKEN");
      return dispatch({
        type: LOGOUT_USER,
      });
    }
  };
};

export function logoutUser() {
  return async (dispatch, getState) => {
    localStorage.removeItem("JWT_AUTH_TOKEN");
    return dispatch({
      type: LOGOUT_USER,
    });
  };
}

export function changePassword(currentPassword, newPassword) {
  return async (dispatch, getState) => {
    const bearer = `Bearer ${localStorage.getItem("JWT_AUTH_TOKEN")}`;

    const response = await fetch(`${serverURL}/changePassword`, {
      method: "post",
      dataType: "json",
      body: JSON.stringify({ currentPassword, newPassword }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: bearer,
      },
    });
    const data = await response.json();
    if (data.error) {
      return dispatch({
        type: ERROR,
        error: data.error,
      });
    }
    const accessToken = data.accessToken;
    const decodedAccessToken = jwt(accessToken);

    localStorage.setItem("JWT_AUTH_TOKEN", accessToken);
    return dispatch({
      type: LOGIN_USER,
      agent: decodedAccessToken,
    });
  };
}
