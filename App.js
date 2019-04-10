import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Colors, DarkTheme as DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { createAppContainer, createStackNavigator } from 'react-navigation';
import { Font } from 'expo';

import { Home } from './src/views/home';
import { Project } from './src/views/project';
import { MainView, CenteredView } from './src/views/common';

/// Material-config:
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.grey900,
    primary: Colors.lightBlue400,
    accent: Colors.amber800
  },
  fonts: {
    regular: 'sourcesans-regular',
    medium: 'sourcesans-semibold',
    light: 'sourcesans-light',
    thin: 'sourcesans-extralight'
  }
};

/// Router-config:
const RootStack = createStackNavigator({
  Home: { screen: Home },
  Project: { screen: Project}
}, {
  initialRouteName: 'Home'
});
const AppNavigation = createAppContainer(RootStack);


/// RootView:
export default class App extends React.Component {
  state = {
    isLoading: true
  }

  async componentDidMount() {
    await Font.loadAsync({
      'sourcesans-regular': require('./assets/fonts/sourcesans-regular.ttf'),
      'sourcesans-semibold': require('./assets/fonts/sourcesans-semibold.ttf'),
      'sourcesans-light': require('./assets/fonts/sourcesans-light.ttf'),
      'sourcesans-extralight': require('./assets/fonts/sourcesans-extralight.ttf'),
    });
    this.setState({ isLoading: false });
  }

  render() {
    return this.state.isLoading
      ? <CenteredView theme={DefaultTheme}>
          <ActivityIndicator animating={true} size="large" color={DefaultTheme.colors.accent} />
        </CenteredView>
      : <PaperProvider theme={theme}>
          <AppNavigation />
        </PaperProvider>
      ;
  }
}
