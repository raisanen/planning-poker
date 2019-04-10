import React from 'react';

import { Appbar, TextInput, Button, ToggleButton, withTheme, Portal } from 'react-native-paper';
import { View } from 'react-native';

import { SecureStore } from 'expo';

import { Navbar } from './partials/navbar';
import { MainView } from './common';

export class HomeComponent extends React.Component {
    state = {
        groupID: '',
        username: '',
        isLoading: true,
        creatingGroup: false
    };

    async componentDidMount() {
        const prevGroupID = await SecureStore.getItemAsync('groupID'),
            prevUserName = await SecureStore.getItemAsync('username');

        this.setState({ isLoading: false, username: prevUserName || '', groupID: prevGroupID || '' });
    }

    createOrOpenGroup = async () => {
        const { navigation } = this.props,
            { groupID, username, creatingGroup } = this.state;

        if (!creatingGroup) {
            await SecureStore.setItemAsync('groupID', groupID);
        }
        await SecureStore.setItemAsync('username', username);
        
        navigation.push('Project', { groupID: creatingGroup ? null : groupID, username });
    };

    render() {
        const isCreating = this.state.creatingGroup,
            formComplete = !!this.state.username && (!!this.state.groupID || isCreating),
            { theme } = this.props,
            { colors } = theme,
            navBar = [
                { 
                    label: 'Join group', 
                    icon: 'group', 
                    isActive: !isCreating, 
                    onPress: () => this.setState({ creatingGroup: false})
                },
                {
                    label: 'Create new group', 
                    icon: 'group-add', 
                    isActive: isCreating, 
                    onPress: () => this.setState({ creatingGroup: true })
                }
            ];

        return (
            <Portal>
                <Appbar.Header>
                    <Appbar.Content
                        title="Planning poker"
                        subtitle="Join or create group"
                    />
                </Appbar.Header>
                <MainView theme={theme}>
                    <Navbar theme={theme} items={navBar}/>
                    <TextInput
                        label='Your name'
                        value={this.state.username}
                        onChangeText={username => this.setState({ username })}
                    />
                    {this.state.creatingGroup ||
                        <TextInput
                            label='Group ID'
                            value={this.state.groupID}
                            onChangeText={groupID => this.setState({ groupID })}
                        />
                    }

                    <Button icon="link" mode="contained" color={colors.primary}
                        disabled={!formComplete}
                        onPress={this.createOrOpenGroup}>
                        {isCreating ? 'Create' : 'Connect'}
                    </Button>

                </MainView>
            </Portal>
        )
    }
}

export const Home = withTheme(HomeComponent);
