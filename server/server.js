const express = require('express'),
    bodyParser = require('body-parser'),
    Pusher = require('pusher'),
    simpleid = require('simple-id'),
    stats = require('simple-statistics'),
    { DateTime } = require('luxon');

require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const pusher = new Pusher({
    appId: process.env.APP_ID,
    key: process.env.APP_KEY,
    secret: process.env.APP_SECRET,
    cluster: process.env.APP_CLUSTER,
});

const trigger = (projectId, event, data) => {
    pusher.trigger('private-project-' + projectId, event, data);
};

const users = [];

app.post('/pusher/auth', (req, res) => {
    const { socket_id, channel_name, username } = req;

    users.push(username); // temporarily store the username to be used later
    console.log(`${username} logged in`);

    const auth = pusher.authenticate(socket_id, channel_name);
    res.send(auth);
});

const projectIds = [];
const projects = {};

const pokerObject = () => ({ id: simpleid(4), created: DateTime.utc(), updated: DateTime.utc() });

const createProject = (username, estimates = null) => {
    const proj = {
        ...pokerObject(),
        users: [ username ],
        validEstimates: estimates || [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100, -1],
        tasks: {}
    };

    projects[proj.id] = { ...proj };
    projectIds.push(proj.id);

    return projects[id];
};

const createTask = (projectId, taskName) => {
    if (projects[projectId] && !projects[projectId].tasks[taskName]) {
        projects[projectId].tasks[taskName] = {
            ...pokerObject(),
            name: taskName,
            estimates: [],
            finalEstimate: null
        };
    }
    return projects[projectId].tasks[taskName];
};

const addEstimate = (projectId, taskName, username, estimate) => {
    if (projects[projectId] && projects[projectId].tasks[taskName]) {
        const proj = projects[projectId],
            task = proj.tasks[taskName];
        if (project.validEstimates.includes(estimate)) {
            const now = DateTime.utc();
            task.estimates = [
                ...projects[projectId].tasks[taskName].estimates.filter(e => e.username !== username),
                { username, estimate }
            ];
            proj.updated = task.updated = now;
            return true;
        }
    }
    return false;
};

const setFinalEstimate = (projectId, taskName, estimate) => {
    if (projects[projectId] && projects[projectId].tasks[taskName]) {
        const proj = projects[projectId],
            task = proj.tasks[taskName];

        task.finalEstimate = estimate;
    }   
};

const getStats = (projectId, taskName) => {
    if (projects[projectId] && projects[projectId].tasks[taskName]) {
        const project =  projects[projectId],
            task = project.tasks[taskName],
            estimates = task.estimates.map(e => e.estimate),
            allStats = {
                all: estimates,
                count: task.estimates.length,
                min: stats.min(estimates),
                max: stats.max(estimates),
                median: stats.median(estimates),
                mean: stats.mean(estimates),
                mode: stats.mode(estimates),
                stdev: stats.standardDeviation(estimates)
            },
            usersWith = (n) => task.estimates.filter(e => e.esitmate === n).map(e => e.username);

        return {
            estimates: {  ...allStats },
            users: {
                min: usersWith(allStats.min),
                max: usersWith(allStats.max),
                median: usersWith(allStats.median),
                mode: usersWith(allStats.mode)
            },
            completion: allStats.count / project.users.length,
            updated: task.updated
        };

    }
    return null;
};

app.post('/project', (req, res) => {
    const { username, estimates } = req.body;
    const proj = createProject(username, estimates);

    pusher.trigger('projects', 'created', proj);
    res.status(200).send({ ...proj });

});

app.post('/project/join', (req, res) => {
    const { projectId, username } = req.body;

    if (projects[project]) {
        projects[project].users.push(username);

        trigger(projectId, 'joined', { username });

        res.status(200).send();
    } else {
        res.status(400).send('Bad Request');
    }
});

app.post('/project/task', (req, res) => {
    const { taskName, projectId } = req.body;
    const task = createTask(projectId, taskName);

    trigger(projectId, 'task-created', { ...task });

    res.status(200).send();
});

app.post('/project/task/estimate', (req, res) => {
    const { projectId, taskName, username, estimate } = req.body;

    addEstimate(projectId, taskName, username, estimate);

    trigger(projectId, 'estimate-added', { taskName, username, estimate });
    trigger(projectId, 'stats-updated', { taskName, stats: getStats(projectId, taskName) });

    res.status(200).send();
});

app.post('/project/task/estimate/finalize', (req, res) => {
    const { projectId, taskName, estimate } = req.body;

    finalEstimate(projectId, taskName, estimate);



    trigger(projectId, 'task-finalized')
});
