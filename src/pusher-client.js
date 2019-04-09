import Pusher from 'pusher-js/react-native';

Pusher.logConsole = true;

const config = require('../pusher.json');

class PusherClient {
    _channels = {};
    _events = {};
    _pusher = null;

    constructor() {
        this._pusher = new Pusher(config.key, { ...config });
    }

    addChannel(channelId) {
        this._channels[channelId] = this._pusher.subscribe(channelId);
    }

    addEvent(channelId, eventId, subscriber) {
        if (!this._channels[channelId]) {
            this.addChannel(channelId);
        }
        this._channels[channelId].bind(eventId, subscriber);
    }
}

export default new PusherClient();
