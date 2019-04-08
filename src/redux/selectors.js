
export const getUserState = store => store.user;
export const getUserIsLoggedIn = store => getUserState(store) ? getUserState(store).isLoggedIn : false;
export const getUserName = store => getUserState(store) ? getUserState(store).username : null;
