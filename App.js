import React from 'react';
import { Provider, connect } from 'react-redux';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { createAppContainer, createStackNavigator } from 'react-navigation';

import store from './redux/store';
import { logIn, logOut } from './redux/actions';

import { Home } from './src/views/home.js';

/// Material-config:
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
  }
};

const mapStateToProps = state => {
  return { 
    user: state.user 
  }
};
const mapDispatchToProps = {
  logIn, logOut
};

/// Router-config:
const RootStack = createStackNavigator({
  Home: connect(mapStateToProps, mapDispatchToProps)(Home)
});
const AppNavigation = createAppContainer(RootStack);


export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <PaperProvider theme={theme}>
          <AppNavigation/>
        </PaperProvider>
      </Provider>
    );
  }
}
