
import { createStore, combineReducers } from 'redux';


const defaultState = {
    user: {
        isLoggedIn: false,
        username: null
    },
    channels: {
        currentChannel: null,
        connected: false,
    }
};

function userReducer(state = defaultState.user, action) {
    if (typeof state === 'undefined') {
        return {};
    }

    switch (action.type) {
        case 'LOGIN': {
            return {...state, isLoggedIn: true, username: action.payload };
        }
        case 'LOGOUT': {
            return {...state, isLoggedIn: false, username: null };
        }
        default:
            return state;
    }
}

export default createStore(
    combineReducers({
        userReducer
    })
);
