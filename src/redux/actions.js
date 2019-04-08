/// User
export const logIn = username => ({
    type: 'LOGIN',
    payload: username
})

export const logOut = () => ({type: 'LOGOUT'});
