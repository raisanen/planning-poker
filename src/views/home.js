import React from 'react';

import { Appbar, TextInput, Button, ToggleButton, withTheme, Portal } from 'react-native-paper';
import { View } from 'react-native';

import { SecureStore } from 'expo';

import { Navbar } from './partials/navbar';
import { CommonStyles, MainView, Spacer } from './common';

export class HomeComponent extends React.Component {
    state = {
        groupID: '',
        username: '',
        groupName: '',
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
            { groupID, groupName, username, creatingGroup } = this.state;

        if (!creatingGroup) {
            await SecureStore.setItemAsync('groupID', groupID);
        }
        await SecureStore.setItemAsync('username', username);
        
        navigation.push('Project', { 
            groupID: creatingGroup ? null : groupID,
            groupName: groupName,
            username
        });
    };

    render() {
        const isCreating = this.state.creatingGroup,
            formComplete = !!this.state.username && (isCreating ? !!this.state.groupName : !!this.state.groupID),
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
                    <View style={[CommonStyles.sidePadding]}>
                        <Spacer height={10}/>
                        <TextInput
                            label='Your name'
                            value={this.state.username}
                            onChangeText={username => this.setState({ username })}
                        />
                        <Spacer/>
                        {this.state.creatingGroup 
                            ? <TextInput
                                label='Group name'
                                value={this.state.groupName}
                                onChangeText={groupName => this.setState({ groupName })}
                              />
                            : <TextInput
                                label='Group ID'
                                value={this.state.groupID}
                                onChangeText={groupID => this.setState({ groupID })}
                            />
                        }
                        <Spacer height={2} />

                        <Button
                            style={{padding: 8}}
                            icon={isCreating ? 'group-add' : 'group'} mode="contained"
                            color={colors.primary}
                            disabled={!formComplete}
                            onPress={this.createOrOpenGroup}>
                            {isCreating ? 'Create' : 'Connect'}
                        </Button>

                        <Spacer height={5} />
                    </View>
                </MainView>
            </Portal>
        )
    }
}

export const Home = withTheme(HomeComponent);
