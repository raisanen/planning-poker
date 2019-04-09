const express = require('express');
const bodyParser = require('body-parser');
const Pusher = require('pusher');

require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const pusher = new Pusher({
  appId: process.env.APP_ID,
  key: process.env.APP_KEY,
  secret:  process.env.APP_SECRET,
  cluster: process.env.APP_CLUSTER,
});

const users = [];

app.post('/pusher/auth', (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  const username = req.body.username;

  users.push(username); // temporarily store the username to be used later
  console.log(`${username} logged in`);

  const auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

const channels = {};

const createChannel = (id, username) => {
    channels[id] = {
        users: [ username ],
        tasks: {}
    };

    return channels[id];
};

const createTask = (channelId, taskName) => {
    if (channels[channelId] && !channels[channelId].tasks[taskName]) {
        channels[channelId].tasks[taskName] = {
            name: taskName,
            estimates: []
        };
    }
    return channels[channelId].tasks[taskName];
}

app.get('/create/:id/:username', (req, res) => {
    const channelId = req.params.id,
        username = req.params.username;
    if (channels[channelId]) {
        res.status(400).send('Bad Request');
    } else {
        const chan = createChannel(channelId, username);
        pusher.trigger('ppoker', 'private-channeladded', {})
        res.status(200).send();
    }
});

app.get('/join/:id/:username', (req, res) => {
    const channel = req.params.id,
        username = req.params.username;
    if (channels[channel]) {
        channels[channel].users.push(username);
        res.status(200).send();
    } else {
        res.status(400).send('Bad Request');
    }
});