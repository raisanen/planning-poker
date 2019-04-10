import React from 'react';
import { StyleSheet, View } from 'react-native';
import { withTheme } from 'react-native-paper';

const baseUnit = 8;

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

class CenteredViewComponent extends React.Component {
    render() {
        return (
            <View style={[CommonStyles.flexCentered, {
                backgroundColor: this.props.theme.colors.background,
            }, (this.props.style || {})]}>
                {this.props.children}
            </View>
        )
    }
}

export class Spacer extends React.Component {
    render() {
        return (
            <View style={{width: '100%', height: (this.props.height || 1) * baseUnit}}></View>
        )
    }
}

export const MainView = withTheme(MainViewComponent);
export const CenteredView = withTheme(CenteredViewComponent);

export const CommonStyles = StyleSheet.create({
    sidePadding: {
        paddingLeft: baseUnit * 5,
        paddingRight: baseUnit * 5
    },
    flexCentered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
