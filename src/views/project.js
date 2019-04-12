import React from 'react';

import { Text, Appbar, Button, Portal, Divider, Surface, ActivityIndicator, withTheme, List, Title, Subheading, HelperText, TextInput } from 'react-native-paper';
import { Dimensions, StyleSheet, View } from 'react-native';
import QRCode from 'react-qr-code';

import { MainView, CommonStyles, Spacer } from './common';
import { ScrollView } from 'react-native-gesture-handler';

import Pusher from 'pusher-js/react-native';

Pusher.logConsole = true;

const { width: WIDTH, height: HEIGHT } = Dimensions.get("window");

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

        showCode: false,

        shouldEstimate: false,

        estimationStats: null,

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
                }
            }
            this.setState({ 
                project: {...project}, 
                projects: [...this.state.projects.map(p => p.id !== project.id ? p : {...project})], 
                isProjectLoading: false,
                isTaskLoading: false
            });
        });
        this._groupChannel.bind('project-added', (data) => {
            const { project } = data;
            this.setState({ project: null, projects: [...this.state.projects, project], isProjectLoading: false });
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
        this._groupChannel.trigger(event, {...data, username, organizationId: groupID });
    }

    chooseProject(projectId) {
        this._projectTrigger('client-join-project', { projectId });
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
        this.setState({ task: (project.tasks || []).find(t => t.id === taskId )});
    }

    render() {
        const { navigation, theme } = this.props,
            {
                groupID, groupName, username ,
                project, task, projects, expandProjectsList, expandTasksList,
                isLoading, isProjectLoading, isTaskLoading
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
                    <Appbar.Action icon="code" onPress={() => this.setState({ showCode: !this.state.showCode })} />
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
                                    fgColor={theme.colors.primary}/>
                                <Text style={{ fontSize: 32, fontFamily: theme.fonts.medium, textAlign: 'center' }}>{groupID}</Text>
                            </View>
                        }
                        {isProjectLoading 
                            ? <ActivityIndicator animating={true} size="large" color={theme.colors.primary}/>
                            :
                            <List.Section>
                            <List.Accordion
                                title={project ? `Project: ${project.projectName}` : 'Choose project...'}
                                expanded={projects.length === 0 || expandProjectsList}
                                onPress={() => this.setState({ expandProjectsList: !expandProjectsList })}
                                left={() => <List.Icon color={expandProjectsList ? theme.colors.primary : (project ? theme.colors.accent : theme.colors.text)} icon="assignment" />}
                            >
                                {projects.map((p) => (
                                    <List.Item
                                        key={p.id}
                                        title={`${p.projectName} (${p.users.length} user${p.users.length !== 1 ? 's' : ''})`}
                                        color={project && project.id === p.id ? theme.colors.accent : theme.colors.text}
                                        left={() => <List.Icon
                                            color={project && project.id === p.id ? theme.colors.primary : theme.colors.text}
                                            icon={p.allTasksEstimated ? 'assignment-turned-in' : (p.users.includes(username) ? 'assignment-ind' : 'assignment')} />
                                        }
                                        onPress={() => this.chooseProject(p.id)}
                                    />
                                ))}

                                <List.Item color={theme.colors.accent}
                                    title="New project..."
                                    onPress={() => this.setState({ creatingProject: true })}
                                    left={() => <List.Icon color={theme.colors.accent} icon="add-circle" />}
                                />
                            </List.Accordion>
                            {this.state.creatingProject &&
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
                                    left={() => <List.Icon color={expandTasksList ? theme.colors.primary : (project ? theme.colors.accent : theme.colors.text)} icon="event-note" />}
                                >
                                    {project.tasks.map((t) => (
                                        <List.Item
                                            key={t.id}
                                            title={t.name}
                                            left={() => <List.Icon
                                                color={task && task.id === t.id ? theme.colors.primary : theme.colors.text}
                                                icon={t.finalEstimate ? 'event-available' : 'event'} />
                                            }
                                            right={() => task && task.id === t.id && this.state.currentEstimate !== null ? <List.Icon icon="check" color={theme.colors.accent} /> : null}
                                            color={task && task.id === t.id ? theme.colors.accent : theme.colors.text}
                                            onPress={() => this.setState({ task: t, expandTasksList: false })}
                                        />
                                    ))}

                                    <List.Item color={theme.colors.accent}
                                        title="New task..."
                                        onPress={() => this.setState({ creatingTask: true })}
                                        left={() => <List.Icon color={theme.colors.accent} icon="add-circle" />}
                                    />
                                </List.Accordion>
                                {this.state.creatingTask &&
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
                            <View style={CommonStyles.sidePadding}>
                                <Title>
                                    Task: {task.name}
                                </Title>
                                <Subheading>
                                    Actions
                                </Subheading>
                                {this.state.shouldEstimate ?
                                    <Surface>
                                        <View style={[CommonStyles.sidePadding, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                                            {project.validEstimates.map((v, i) =>
                                                <Button
                                                    style={styles.estimateButton}
                                                    color={v === this.state.currentEstimate ? theme.colors.primary : theme.colors.text}
                                                    mode="contained"
                                                    key={'estimate-' + i} value={v}
                                                    onPress={() => this.setState({ currentEstimate: v })}>
                                                    <Text style={{ fontSize: 18, fontFamily: theme.fonts.medium, color: theme.colors.background }}>
                                                        {v < 0 ? '?' : v}
                                                    </Text>
                                                </Button>
                                            )}
                                        </View>
                                        <Spacer height={2} />
                                        <Button disabled={this.state.currentEstimate === null} mode="contained" icon="gavel" color={theme.colors.primary}>
                                            Send estimate
                                        </Button>
                                        <Spacer height={2} />
                                    </Surface>
                                    :
                                    <Surface>
                                        <View style={[CommonStyles.sidePadding, CommonStyles.vertPadding]}>
                                            <Button mode="contained" icon="gavel" color={theme.colors.accent}>
                                                Start estimation
                                            </Button>
                                            <HelperText type="info">
                                                Sends an alert to all active users, giving you two minutes to complete this round of estimation. 
                                            </HelperText>
                                        </View>
                                    </Surface>
                                }
                            </View>
                        }
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
