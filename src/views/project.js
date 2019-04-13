import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { 
    ActivityIndicator,
    Appbar,
    Button,
    Divider,
    FAB,
    HelperText,
    List,
    Paragraph,
    Portal,
    Title,
    Subheading,
    Surface,
    Text,
    TextInput,
    withTheme,
    Chip,
} from 'react-native-paper';
import { BarChart, XAxis } from 'react-native-svg-charts';
import { ScrollView, FlatList } from 'react-native-gesture-handler';
import QRCode from 'react-qr-code';

import { MainView, CommonStyles, Spacer } from './common';


import Pusher from 'pusher-js/react-native';

Pusher.logConsole = true;

const { width: WIDTH, height: HEIGHT } = Dimensions.get("window");
const defaultState = {
    expandProjectsList: false,
    expandTasksList: false,

    currentEstimate: null,
    estimateSent: false,

    estimationStatus: null,
    estimationTimeout: null,
    timeLeftString: '',
    timeoutStartedAt: 0,

    showCode: false,

    shouldEstimate: false,

    barChart: null,
    isProjectLoading: false,
    isTaskLoading: false,

    creatingProject: false,
    creatingTask: false,
    newProjectName: '',
    newTaskName: '',
};
class ProjectComponent extends React.Component {
    state = {
        groupID: null,
        groupName: null,
        username: null,

        group: null,
        projects: null,
        project: null,
        task: null,

        expandProjectsList: false,
        expandTasksList: false,

        currentEstimate: null,
        estimateSent: false,

        estimationStatus: null,
        estimationTimeout: null,
        timeLeftString: '',
        timeoutStartedAt: 0,

        showCode: false,

        shouldEstimate: false,

        barChart: null,

        isLoading: true,
        isProjectLoading: false,
        isTaskLoading: false,

        creatingProject: false,
        creatingTask: false,
        newProjectName: '',
        newTaskName: '',
    };
    _pusher = null;
    _userChannel = null;
    _groupChannel = null;

    _joinChannel = (suffix) => {
        if (this._pusher === null) {
            const pusherConfig = require('../../pusher.json');
            this._pusher = new Pusher(pusherConfig.key, { ...pusherConfig });
        }

        const channelName = `private-poker-${suffix}`;

        return new Promise((resolve, reject) => {
            const ch = this._pusher.subscribe(channelName);
            ch.bind('pusher:subscription_succeeded', () => resolve(ch));
        });
    };

    _updateTimeRemaining = () => {
        const { estimationTimeout, timeoutStartedAt, estimationStatus } = this.state,
            timeout = (estimationTimeout || 2) * 60000,
            now = new Date().getTime(),
            delta = now - timeoutStartedAt,
            timeLeft = Math.floor((timeout - delta) / 1000),
            minutes = Math.floor(timeLeft / 60),
            seconds = timeLeft - (minutes * 60);

        console.log(estimationTimeout, timeoutStartedAt, timeLeft);

        if (timeLeft > 0 && estimationStatus === 'started') {
            this.setState({ timeLeftString: `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}` });
            setTimeout(() => this._updateTimeRemaining(), 300);
        } else {
            this.setState({ timeLeftString: '00:00' });
        }
};

    _updateStats = () => {
        const { task, estimationStatus, username } = this.state;
        if (task && (estimationStatus === 'ended' || estimationStatus === 'final')) {
            const { estimates } = task.stats,
                { colors } = this.props.theme,
                userEstimate = task.estimates.find(e => e.user === username);
            this.setState({
                currentEstimate: userEstimate ? userEstimate.estimate : null,
                shouldEstimate: true,
                barChart: Object.keys(estimates.occurOfAll).map(k => {
                    const val = estimates.occurOfAll[k],
                        n = +k;

                    return {
                        value: val,
                        label: n >= 0 ? n : '?',
                        svg: {
                            fill: task.finalEstimate === n ? colors.accent : 
                                (estimates.mode === n ? colors.primary : colors.text)
                        }
                    };
                })
            });
            console.log(this.state.barChart);
        }
    };

    _addChannelEvents = () => {
        const checkIfLoaded = () => {
            if (this.state.projects && this.state.groupID && this.state.groupName) {
                this.setState({ isLoading: false });
            }
        };
        this._groupChannel.bind('organization-updated', (data) => {
            const { organization } = data;
            this.setState({ groupID: organization.id, groupName: organization.organizationName });
            checkIfLoaded();
        });
        this._groupChannel.bind('projects-fetched', (data) => {
            const { projects } = data;
            this.setState({ projects });
            checkIfLoaded();
        });
        this._groupChannel.bind('project-updated', (data) => {
            const { project } = data;
            if (this.state.project) {
                if (this.state.project.tasks.length < project.tasks.length) {
                    const newTask = project.tasks.find(t => this.state.project.tasks.findIndex(pt => pt.id === t.id) < 0);
                    this.setState({ task: newTask });
                    if (newTask.finalEstimate) {
                        this._updateStats();
                    }
                }
            }
            this.setState({
                project: { ...project },
                projects: [...this.state.projects.map(p => p.id !== project.id ? p : { ...project })],
                isProjectLoading: false,
                isTaskLoading: false
            });
        });
        this._groupChannel.bind('project-added', (data) => {
            const { project } = data;
            this.setState({ 
                project: project,
                task: null, 
                projects: [...this.state.projects, project], 
                isProjectLoading: false,
                shouldEstimate: false,
                estimationStatus: null
            });
        });

        this._groupChannel.bind('estimation-starting', (data) => {
            const { taskId, timeout } = data;
            const project = this.state.projects.find(p => p.tasks.findIndex(t => t.id === taskId) >= 0),
                task = project ? project.tasks.find(t => t.id === taskId) : null;
            if (task) {
                const { username, groupID } = this.state;
                this.setState({ estimationStatus: 'starting', isLoading: false, estimationTimeout: +timeout, task: task, project: project, shouldEstimate: true });
                this._groupChannel.trigger('client-acknowledge-estimation-starting', { organizationId: groupID, username, taskId })
            }
        });

        this._groupChannel.bind('estimation-started', (data) => {
            const { project, taskId } = data,
                task = project.tasks.find(t => t.id === taskId);
            if (task) {
                const now = new Date().getTime();
                this.setState({
                    estimationStatus: 'started',
                    task: task,
                    project: project,
                    shouldEstimate: true,
                    timeoutStartedAt: now,
                    isLoading: false
                });
            }
        });

        this._groupChannel.bind('estimation-ended', (data) => {
            const { project, taskId } = data,
                task = project.tasks.find(t => t.id === taskId);

            if (task && project) {
                this.setState({
                    estimationStatus: 'ended',
                    task: task,
                    project: project,
                    timeLeftString: '00:00',
                    isLoading: false
                });
            }
        });


        this._userChannel.bind('error', (data) => {
            console.warn('poker-error', data);
        });
    };

    _addGroupChannel = (id) => {
        this._joinChannel(id).then((groupChannel) => {
            this._groupChannel = groupChannel;
            this._addChannelEvents();
            this._groupChannel.trigger('client-join-organization', { organizationId: id, username: this.state.username });
        });
    };

    componentDidUpdate(prevProps, prevState) {
        if (prevState.estimationStatus !== this.state.estimationStatus) {
            if (this.state.estimationStatus === 'final' || this.state.estimationStatus === 'ended') {
                this._updateStats();
            } else if (this.state.estimationStatus === 'started') {
                this._updateTimeRemaining();
            }
        }
    }

    componentDidMount() {
        const { groupID, groupName, username } = this.props.navigation.state.params;
        this._joinChannel(username).then((userChannel) => {
            this._userChannel = userChannel;
            this.setState({ username });

            if (!groupID) {
                this._userChannel.bind('organization-added', (data) => {
                    const { organization } = data;
                    this.setState({ group: organization });
                    this._addGroupChannel(organization.id);
                    this._userChannel.unbind('organization-added');
                });
                this._userChannel.trigger('client-create-organization', { organizationName: groupName, username });
            } else {
                this._addGroupChannel(groupID);
            }
        });
    }

    componentWillUnmount() {
        if (this._pusher) {
            if (this._groupChannel) {
                this._groupChannel.unbind();
            }
            if (this._userChannel) {
                this._userChannel.unbind();
            }
            this._pusher.disconnect();
            this._pusher = null;
        }
    }

    _projectTrigger = (event, data) => {
        if (!this._groupChannel || this.state.isLoading) {
            return;
        }
        const { username, groupID } = this.state;
        this.setState({
            isProjectLoading: true,
            creatingTask: false,
            newTaskName: '',
            creatingProject: false,
            newProjectName: '',
            expandProjectsList: false,
            expandTasksList: false
        });
        this._groupChannel.trigger(event, { ...data, username, organizationId: groupID });
    }

    startEstimation() {
        this._projectTrigger('client-start-estimation', { taskId: this.state.task.id, timeout: 0.5 });
    }

    finalizeEstimate() {
        this._projectTrigger('client-finalize-estimate', { taskId: this.state.task.id, estimate: this.state.currentEstimate });
    }

    estimateTask() {
        this._projectTrigger('client-estimate-task', { taskId: this.state.task.id, estimate: this.state.currentEstimate });
        this.setState({
            estimateSent: true
        });
    }

    chooseProject(projectId) {
        const project = this.state.projects.find(p => p.id === projectId);
        if (!project.users.includes(this.state.username)) {
            this._projectTrigger('client-join-project', { projectId });
        } else {
            this.setState({ project, expandProjectsList: false });
        }
    }

    addProject(projectName) {
        this._projectTrigger('client-add-project', { projectName });
    }

    addTask(taskName) {
        this._projectTrigger('client-add-task', { taskName, projectId: this.state.project.id });
    }

    chooseTask(taskId) {
        const { project } = this.state;
        if (!project) {
            return;
        }
        const task = (project.tasks || []).find(t => t.id === taskId);
        this.setState({ task, expandTasksList: false });
        if (task.finalEstimate !== null) {
            this.setState({
                estimationStatus: 'final'
            });
        }
    }

    render() {
        const { navigation, theme } = this.props,
            {
                groupID, groupName, username,
                project, task, projects,
                expandProjectsList, expandTasksList,
                showCode,
                creatingProject, creatingTask,
                isLoading, isProjectLoading, 
                shouldEstimate, estimationStatus,
                barChart,
                currentEstimate,
                timeLeftString
            } = this.state;

        return (
            <Portal style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <Appbar.Header>
                    <Appbar.BackAction
                        onPress={() => navigation.goBack()}
                    />
                    <Appbar.Content
                        title={`Planning poker - ${groupName || 'Loading...'}`}
                        subtitle={project ? `Project: ${project.projectName}` + (task ? `(${task.name})` : '') : 'Projects and tasks'}
                    />
                    <Appbar.Action icon="code" onPress={() => this.setState({ showCode: !showCode })} />
                </Appbar.Header>
                <MainView theme={theme}>
                    {isLoading
                        ? <ActivityIndicator animating={true} size="large" color={theme.colors.accent} />
                        : <ScrollView>
                            {this.state.showCode &&
                                <View style={[{ backgroundColor: theme.colors.background, paddingTop: 20, paddingBottom: 20, flex: 1, flexDirection: 'column', justifyContent: 'center' }]}>
                                    <QRCode
                                        value={groupID}
                                        size={WIDTH}
                                        bgColor={theme.colors.background}
                                        fgColor={theme.colors.primary} />
                                    <Text style={{ fontSize: 32, fontFamily: theme.fonts.medium, textAlign: 'center' }}>{groupID}</Text>
                                </View>
                            }
                            {isProjectLoading
                                ? <ActivityIndicator style={{marginTop: 64}} animating={true} size="large" color={theme.colors.primary} />
                                :
                                <List.Section>
                                    <List.Accordion
                                        title={project ? `Project: ${project.projectName}` : 'Choose project...'}
                                        expanded={projects.length === 0 || expandProjectsList}
                                        onPress={() => this.setState({ expandProjectsList: !expandProjectsList })}
                                        right={() => <Text>{projects.length}</Text>}
                                        left={() => <List.Icon color={expandProjectsList ? theme.colors.primary : (project ? theme.colors.accent : theme.colors.text)} icon="assignment" />}
                                    >
                                        {projects.map((p) => (
                                            <List.Item
                                                key={p.id}
                                                title={`${p.projectName} (${p.users.length} user${p.users.length !== 1 ? 's' : ''})`}
                                                color={project && project.id === p.id ? theme.colors.accent : theme.colors.text}
                                                left={() => <List.Icon
                                                    color={project && project.id === p.id ? theme.colors.primary : theme.colors.text}
                                                    icon={(p.users.includes(username) ? 'assignment-ind' : 'assignment')} />
                                                }
                                                right={() => p.allTasksFinalized ? <List.Icon icon="done-all" color={theme.colors.accent} /> : null}
                                                onPress={() => this.chooseProject(p.id)}
                                            />
                                        ))}

                                        <List.Item color={theme.colors.accent}
                                            title="New project..."
                                            onPress={() => this.setState({ creatingProject: true })}
                                            left={() => <List.Icon color={theme.colors.accent} icon="add-circle" />}
                                        />
                                    </List.Accordion>
                                    {creatingProject &&
                                        <View style={CommonStyles.sidePadding}>
                                            <TextInput
                                                label="Project name"
                                                value={this.state.newProjectName}
                                                onChangeText={newProjectName => this.setState({ newProjectName })}
                                            />
                                            <Button
                                                style={{ padding: 8 }}
                                                icon={'add-circle'} mode="contained"
                                                color={theme.colors.primary}
                                                disabled={!this.state.newProjectName}
                                                onPress={() => this.addProject(this.state.newProjectName)}>
                                                Create...
                                        </Button>
                                        </View>
                                    }
                                </List.Section>
                            }
                            {project && !isProjectLoading &&
                                <List.Section>
                                    <List.Accordion
                                        title={task ? `Task: ${task.name}` : 'Choose task...'}
                                        expanded={project.tasks.length === 0 || expandTasksList}
                                        onPress={() => this.setState({ expandTasksList: !expandTasksList })}
                                        right={() => <Text>{project.tasks.length}</Text>}
                                        left={() => <List.Icon color={expandTasksList ? theme.colors.primary : (project ? theme.colors.accent : theme.colors.text)} icon="event-note" />}
                                    >
                                        {project.tasks.map((t) => (
                                            <List.Item
                                                key={t.id}
                                                title={t.name}
                                                left={() => <List.Icon
                                                    color={task && task.id === t.id ? theme.colors.primary : theme.colors.text}
                                                    icon="event" />
                                                }
                                                right={() => t.finalEstimate ? <List.Icon icon="done" color={theme.colors.accent} /> : null}
                                                color={task && task.id === t.id ? theme.colors.accent : theme.colors.text}
                                                onPress={() => this.chooseTask(t.id)}
                                            />
                                        ))}

                                        <List.Item color={theme.colors.accent}
                                            title="New task..."
                                            onPress={() => this.setState({ creatingTask: true })}
                                            left={() => <List.Icon color={theme.colors.accent} icon="add-circle" />}
                                        />
                                    </List.Accordion>
                                    {creatingTask &&
                                        <View style={CommonStyles.sidePadding}>
                                            <TextInput
                                                label="Task name"
                                                value={this.state.newTaskName}
                                                onChangeText={newTaskName => this.setState({ newTaskName })}
                                            />
                                            <Button
                                                style={{ padding: 8 }}
                                                icon={'add-circle'} mode="contained"
                                                color={theme.colors.primary}
                                                disabled={!this.state.newTaskName}
                                                onPress={() => this.addTask(this.state.newTaskName)}>
                                                Create...
                                            </Button>
                                        </View>
                                    }
                                </List.Section>
                            }
                            <Divider />
                            {project && task &&
                                <View style={{paddingLeft: 8, paddingRight: 8}}>
                                    <Title>
                                        Task: {task.name}
                                    </Title>
                                    <Subheading>
                                        Estimate
                                    </Subheading>
                                    {shouldEstimate ?
                                        <Surface>
                                            {estimationStatus === 'starting' &&
                                                <View>
                                                    <Paragraph>Estimation of this task started. Waiting for enough users to join...</Paragraph>
                                                </View>
                                            }
                                            {estimationStatus === 'started' &&
                                                <View>
                                                    <Chip icon="timer">{timeLeftString}</Chip>
                                                    <Spacer height={2}/>
                                                    {this.state.estimateSent
                                                    ? <View style={CommonStyles.sidePadding}>
                                                        <Text>Estimate sent. Waiting for estimation round to end...</Text>
                                                    </View>
                                                    : <View style={[CommonStyles.sidePadding, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                                                        {project.validEstimates.map((v, i) =>
                                                            <Button
                                                                style={styles.estimateButton}
                                                                color={v === currentEstimate ? theme.colors.primary : theme.colors.text}
                                                                mode="contained"
                                                                key={'estimate-' + i} value={v}
                                                                onPress={() => this.setState({ currentEstimate: v })}>
                                                                <Text style={{ fontSize: 18, fontFamily: theme.fonts.medium, color: theme.colors.background }}>
                                                                    {v < 0 ? '?' : v}
                                                                </Text>
                                                            </Button>
                                                        )}
                                                    </View>

                                                    }
                                                    <Spacer height={2} />
                                                    <Button disabled={currentEstimate === null || this.state.estimateSent} 
                                                        mode="contained" icon="gavel" 
                                                        color={theme.colors.primary}
                                                        onPress={() => this.estimateTask()}
                                                    >
                                                        Send estimate
                                                    </Button>
                                                </View>
                                            }
                                            {estimationStatus === 'ended' || estimationStatus === 'final' &&
                                                <View style={{padding: 8}}>
                                                    <Title>
                                                        Estimation of {task.name} has ended.
                                                    </Title>
                                                    <Subheading>
                                                        {task.stats.estimates.count} estimates recieved. ({Math.round(task.stats.completion * 100)}% of users).
                                                    </Subheading>
                                                    <Surface>
                                                        <BarChart
                                                            style={{ height: 200, marginTop: 8, marginBottom: 16, backgroundColor: theme.colors.background }}
                                                            data={barChart}  
                                                            contentInset={{ top: 20, bottom: 5, left: 8, right: 8 }}
                                                            yAccessor={({ item }) => item.value}
                                                        >
                                                            <XAxis
                                                                data={barChart}
                                                                contentInset={{ top: 5, bottom: 5, left: 8, right: 8 }}
                                                                formatLabel={(_, index) => barChart[index].label}
                                                            />
                                                        </BarChart>
                                                    </Surface>
                                                    <FlatList
                                                        data={[
                                                            `Mean: ${task.stats.estimates.mean} (std. dev ${task.stats.estimates.stdev})`,
                                                            `Max: ${task.stats.estimates.max} (${task.stats.users.max.join(', ')})`,
                                                            `Min: ${task.stats.estimates.min} (${task.stats.users.min.join(', ')})`,
                                                            `Mode: ${task.stats.estimates.mode} (${task.stats.users.mode.join(', ')})`,
                                                            `Median: ${task.stats.estimates.median} (${task.stats.users.median.join(', ')})`,
                                                        ]}
                                                        renderItem={({item}) => <Text>{item}</Text>}
                                                    />
                                                    <Spacer height={2}/>
                                                    <Divider/>
                                                    <Spacer height={2}/>
                                                    <FlatList
                                                        data={task.estimates}
                                                        renderItem={({item}) => <Text>
                                                            <Text style={{fontFamily: theme.fonts.medium}}>{item.username}</Text> 
                                                            <Text> {item.estimate}</Text>
                                                        </Text>}
                                                    />
                                                    {estimationStatus !== 'final' &&
                                                        <View style={[CommonStyles.sidePadding, CommonStyles.vertPadding]}>
                                                            <Button
                                                                onPress={() => this.startEstimation()} 
                                                                mode="contained" icon="refresh" color={theme.colors.primary}>
                                                                Restart
                                                            </Button>
                                                            <Button
                                                                onPress={() => this.finalizeEstimate()} 
                                                                mode="contained" icon="done" color={theme.colors.accent}>
                                                                Finalize
                                                            </Button>
                                                        </View>
                                                    }
                                                </View> 
                                            }
                                        </Surface>
                                        :
                                        <Surface>
                                            <View style={[CommonStyles.sidePadding, CommonStyles.vertPadding]}>
                                                <Button 
                                                    onPress={() => this.startEstimation()} 
                                                    mode="contained" icon="gavel" color={theme.colors.accent}>
                                                    Start estimation
                                                </Button>
                                                <HelperText type="info">
                                                    Sends an alert to all active users, giving you 30 seconds to complete this round of estimation.
                                                </HelperText>
                                            </View>
                                        </Surface>
                                    }
                                </View>
                            }
                            <Spacer height={10} />
                        </ScrollView>
                    }
                </MainView>
            </Portal>
        )
    }
}

const styles = StyleSheet.create({
    estimateButton: {
        display: 'flex',
        padding: 0,
        height: 80,
        width: 80,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        marginBottom: 8,
        marginRight: 16
    },
});

export const Project = withTheme(ProjectComponent);
