import React from 'react';
import { StyleSheet, View } from 'react-native';
import { withTheme } from 'react-native-paper';

class MainViewComponent extends React.Component {
    render() {
        return (
            <View style={{
                flex: 1,
                alignContent: 'flex-start',
                backgroundColor: this.props.theme.colors.background,
                margin: 0 
            }}>
                {this.props.children}
            </View>
        )
    }
}

export const MainView = withTheme(MainViewComponent);
