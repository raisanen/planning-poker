import React from 'react';

import { Text, TextInput, Button, Divider } from 'react-native-paper';
import { View } from 'react-native';

import { SecureStore } from 'expo';

export default class Home extends React.Component {
    state = {
        channelId: '',
        username: '',
        isLoading: true,
        creatingChannel: false
    };

    async componentDidMount() {
        const prevChannelId = await SecureStore.getItemAsync('channelId'),
            prevUserName = await SecureStore.getItemAsync('username');

        this.setState({ isLoading: false, username: prevUserName, channelId: prevChannelId });
    }

    openChannel = () => {

    };

    render() {
        const isCreating = this.state.creatingChannel,
            toggleCreating = () => this.setState({ createChannel: !isCreating }),
            formComplete = !!this.state.username && (!!this.state.channelId || this.isCreating);

        return (
            <View style={{ flex: 1 }}>
                <TextInput
                    label='Your name'
                    value={this.state.username}
                    onChangeText={username => this.setState({ username })}
                />
                {this.state.creatingChannel ||
                    <TextInput
                        label='Id'
                        value={this.state.channelId}
                        onChangeText={channelId => this.setState({ channelId })}
                    />
                }

                <Button icon="link" mode="contained"
                    disabled={!formComplete}
                    value={isCreating ? 'Create' : 'Connect'}
                    onPress={this.openChannel} />

                <Divider/>
                
                <Text>or</Text>

                <Button icon="" mode="text"
                    value={isCreating ? 'Connect...' : 'Create new...'}
                    onPress={() => toggleCreating()}
                />
            </View>
        )
    }
}