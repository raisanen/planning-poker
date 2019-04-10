import React from 'react';

import { Text, Appbar, Button, Portal, Divider, Surface, ActivityIndicator, withTheme, List, Title, Subheading } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';

import { MainView, CommonStyles, Spacer } from './common';

class ProjectComponent extends React.Component {
    state = {
        project: null,
        task: null,
        isLoading: true,
        expandProjectsList: false,
        expandTasksList: false,
        currentEstimate: null,
        projects: [
            {
                id: 'abc123',
                name: 'My cool project',
                allTasksEstimated: false,
                validEstimates: [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100, -1],
                users: [],
                tasks: [{
                    id: 'task123',
                    name: 'Some task',
                    finalEstimate: null,
                    estimates: []
                }]
            }
        ],
        showCode: false
    }

    async componentDidMount() {
        this.setState({isLoading: false})
    }
    
    render() {
        const { navigation, theme } = this.props,
            { groupID, username } = navigation.state.params,
            { project, task, projects, expandProjectsList, expandTasksList } = this.state;

        return (
            <Portal style={{flex: 1, backgroundColor: theme.colors.background}}>
                <Appbar.Header>
                    <Appbar.BackAction
                        onPress={() => navigation.goBack()}
                    />
                    <Appbar.Content
                        title={`Planning poker - ${groupID || 'New group'}`}
                        subtitle="Projects and tasks"
                    />
                    <Appbar.Action icon="code" onPress={() => this.setState({showCode: !this.state.showCode})} />
                </Appbar.Header>
                <MainView theme={theme}>
                    {this.state.showCode &&
                        <View style={[CommonStyles.sidePadding, { padding: 64 }]}>
                            <Text style={{fontSize: 64, fontFamily: theme.fonts.medium, textAlign: 'center'}}>{groupID}</Text>
                        </View>
                    }
                    <List.Section>
                        <List.Accordion
                            title={project ? project.name : 'Choose project...'}
                            expanded={expandProjectsList}
                            onPress={() => this.setState({ expandProjectsList: !expandProjectsList})}
                            left={() => <List.Icon color={expandProjectsList ? theme.colors.primary : (project ? theme.colors.accent : theme.colors.text)} icon="work" />}
                        >
                            {projects.map((p) => (
                                <List.Item
                                    key={p.id}
                                    title={p.name}
                                    color={project && project.id === p.id ? theme.colors.accent : theme.colors.text}
                                    left={() => <List.Icon 
                                        color={project && project.id === p.id ? theme.colors.primary : theme.colors.text} 
                                        icon={p.allTasksEstimated ? 'check' : 'work'} />
                                    }
                                    onPress={() => this.setState({ project: p, expandProjectsList: false })}
                                />
                            ))}

                            <List.Item color={theme.colors.accent}
                                title="Create new project..."
                                left={() => <List.Icon color={theme.colors.accent} icon="add"/>}
                                />
                        </List.Accordion>
                    </List.Section>
                    {project &&
                        <List.Section>
                            <List.Accordion
                                title={task ? task.name : 'Choose task...'}
                                expanded={expandTasksList}
                                onPress={() => this.setState({ expandTasksList: !expandTasksList})}
                                left={() => <List.Icon color={expandTasksList ? theme.colors.primary : (project ? theme.colors.accent : theme.colors.text)} icon="assignment" />}
                            >
                                {project.tasks.map((t) => (
                                    <List.Item
                                        key={t.id}
                                        title={t.name}
                                        left={() => <List.Icon 
                                            color={task && task.id === t.id ? theme.colors.primary : theme.colors.text} 
                                            icon={t.finalEstimate ? 'assignment-turned-in' : 'assignment-ind'} />
                                        }
                                        right={() => task && task.id === t.id && this.state.currentEstimate !== null ? <List.Icon icon="check" color={theme.colors.accent}/> : null}
                                        color={task && task.id === t.id ? theme.colors.accent : theme.colors.text}
                                        onPress={() => this.setState({ task: t, expandTasksList: false })}
                                    />
                                ))}

                                <List.Item color={theme.colors.accent}
                                    title="Create new project..."
                                    left={() => <List.Icon color={theme.colors.accent} icon="add"/>}
                                />
                            </List.Accordion>
                        </List.Section>
                    }
                    <Divider/>
                    {project && task &&
                        <View>
                            <Title>
                                {task.name}
                            </Title>
                            <Subheading>
                                Estimate
                            </Subheading>
                            <View style={[CommonStyles.sidePadding, {flex: 1, justifyContent: 'space-around', flexDirection: 'row', flexWrap: 'wrap'}]}>
                                {project.validEstimates.map((v, i) => 
                                    <Button
                                        style={styles.estimateButton}
                                        color={v === this.state.currentEstimate ? theme.colors.primary : theme.colors.text}
                                        mode="contained" 
                                        key={'estimate-' + i} value={v}
                                        onPress={() => this.setState({ currentEstimate: v})}>
                                        <Text style={{fontSize: 18, fontFamily: theme.fonts.medium, color: theme.colors.background}}>
                                            {v < 0 ? '?' : v}
                                        </Text>
                                    </Button>
                                )}
                            </View>
                            <Spacer/>
                            <Button disabled={this.state.currentEstimate === null} mode="contained" icon="gavel" color={theme.colors.primary}>
                                Send estimate
                            </Button>
                        </View>
                    }
                </MainView>
            </Portal>
        )
    }
}

const styles = StyleSheet.create({
    estimateButton: {
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
