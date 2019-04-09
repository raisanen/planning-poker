import React from 'react';

import { Text, TextInput, Button } from 'react-native-paper';
import { View } from 'react-native';

export default class Home extends React.Component {
    state = {
        channelId: '',
        username: ''
    }

    openChannel = () => {

    };

    createChannel = () => {

    };

    render() {
        return (
            <View style={{flex: 1}}>
                <TextInput
                    label='Your name'
                    value={this.state.username}
                    onChangeText={username => this.setState({ username})}
                />
                <TextInput
                    label='Id'
                    value={this.state.channelId}
                    onChangeText={channelId => this.setState({ channelId })}
                />
                
                <Button icon="link" mode="contained" onPress={this.openChannel}>
                    Connect
                </Button>

                <Text>or</Text>

                <Button icon="" mode="text"
                    value="Create new..."
                    onPress={this.createChannel}
                />
            </View>
        )
    }
}