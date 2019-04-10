import React from 'react';

import { Text, Appbar, Button, Portal, Divider, Surface, ActivityIndicator, withTheme, List, Title, Subheading } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';

import { MainView } from './common';

class ProjectComponent extends React.Component {
    state = {
        project: null,
        task: null,
        isLoading: true,
        expandProjectsList: false,
        expandTasksList: false,
        projects: [
            {
                id: 'abc123',
                name: 'My cool project',
                tasks: [{
                    id: 'task123',
                    name: 'Some task'
                }]
            }
        ],
    }

    async componentDidMount() {
        console.log(this.props);
        this.setState({isLoading: false})
    }
    
    render() {
        const { navigation, theme } = this.props,
            { groupID, username } = navigation.state.params,
            { project, task, projects } = this.state;

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
                </Appbar.Header>
                <MainView theme={theme}>
                    <List.Section>
                        <List.Accordion
                            title={project ? project.name : 'Choose project...'}
                            expanded={this.state.expandProjectsList}
                            onPress={() => this.setState({ expandProjectsList: !this.state.expandProjectsList})}
                            left={() => <List.Icon color={project ? theme.colors.accent : theme.colors.text} icon="work" />}
                        >
                            {projects.map((p) => (
                                <List.Item
                                    key={p.id}
                                    title={p.name}
                                    color={project && project.id === p.id ? theme.colors.accent : theme.colors.text}
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
                                expanded={this.state.expandTasksList}
                                onPress={() => this.setState({ expandTasksList: !this.state.expandTasksList})}
                                left={() => <List.Icon color={task ? theme.colors.accent : theme.colors.text} icon="event" />}
                            >
                                {project.tasks.map((t) => (
                                    <List.Item
                                        key={t.id}
                                        title={t.name}
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
                            <View>
                                <Surface style={styles.surface}>
                                    <Text>0</Text>
                                </Surface>
                                <Surface style={styles.surface}>
                                    <Text>1</Text>
                                </Surface>
                            </View>
                        </View>
                    }
                </MainView>
            </Portal>
        )
    }
}

const styles = StyleSheet.create({
    surface: {
      padding: 8,
      height: 80,
      width: 80,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
  });

export const Project = withTheme(ProjectComponent);
