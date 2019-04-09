import React from 'react';
import { Text } from 'react-native';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { createAppContainer, createStackNavigator } from 'react-navigation';
import { Font } from 'expo';

import { Home } from './src/views/home';
import { Project } from './src/views/project';

/// Material-config:
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
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
  Home: Home,
  Project: Project
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
    return (
      <PaperProvider theme={theme}>
        {this.state.isLoading 
          ? <Text>Loading...</Text>
          : <AppNavigation/>
        }
      </PaperProvider>
    );
  }
}
