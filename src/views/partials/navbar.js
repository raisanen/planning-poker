import React from 'react';

import { Button, withTheme } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';

class NavbarItemComponent extends React.Component {
    render() {
        const { label, icon, isActive, theme, onPress } = this.props,
            { colors } = theme;

        return (
            <Button icon={icon} mode="text"
                style={[style.navButton, isActive ? {borderColor: colors.accent} : {}]}
                color={isActive ? colors.accent : colors.text}
                onPress={onPress}>
                {label}
            </Button>
        )
    }
}

export const NavbarItem = withTheme(NavbarItemComponent);

class NavbarComponent extends React.Component {
    render() {
        const { items, theme } = this.props;
        return (
            <View style={style.navBar}>
                {items.map((item, i) => {
                    return <NavbarItem 
                        key={'navbar-item-' + i}
                        theme={theme} 
                        label={item.label}
                        onPress={item.onPress}
                        isActive={item.isActive}
                    />
                })}
            </View>
        )
    }
}


const style = StyleSheet.create({
    navBar: {
        flex: 0,
        flexDirection: 'row'
    },
    navButton: {
        width: '50%',
        borderColor: 'transparent',
        borderWidth: 0,
        borderBottomWidth: 5,
        borderRadius: 0,
        padding: 5,
        paddingTop: 10
    }
});

export const Navbar = withTheme(NavbarComponent);
