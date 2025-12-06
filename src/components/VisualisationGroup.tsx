import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Tab, Typography } from "@mui/material";
import { deepPurple } from "@mui/material/colors";
import { useState, type RefObject } from "react";
import StackedChart from "./StackedChart";
import type { Screenplay } from "../hooks/useScreenplay";
import { scrollStoryEditorTo } from "./StoryEditor";
import { CharacterHeatmap } from "./CharacterHeatmap";
import type { SceneInfo } from "../hooks/useTimeline";

enum VisGroup {
    relationship,
    location,
    sentiment,
}

export function VisualisationGroup({ currentScene, screenplay, editorRef }: { currentScene: SceneInfo, screenplay?: Screenplay, editorRef: RefObject<HTMLDivElement | null> }) {
    const [activeGroup, setActiveGroup] = useState(VisGroup.relationship);

    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        setActiveGroup(parseInt(newValue));
    };

    return (
        <TabContext value={activeGroup}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <TabList
                    onChange={handleChange}
                    aria-label="Category Selection"
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontFamily: 'Inter, Arial, sans-serif',
                            color: deepPurple[900],
                            fontWeight: 600,
                        },
                        '& .Mui-selected': {
                            color: `${deepPurple[900]} !important`,
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: deepPurple[900],
                        }
                    }}
                >
                    <Tab label="Relationships" value={VisGroup.relationship} />
                    <Tab label="Locations" value={VisGroup.location} />
                    <Tab label="Scene Sentiment" value={VisGroup.sentiment} />
                </TabList>
            </Box>

            <Box p={0} m={0} bgcolor="#e0e0e0ff" height="100%">
                <TabPanel value={VisGroup.relationship}>
                    <p>Relationships</p>
                </TabPanel>

                <TabPanel value={VisGroup.location} style={{ padding: 0 }}>
                    <Box padding={1} bgcolor="white">
                        {screenplay ? (
                            <StackedChart
                                doc={screenplay.document}
                                locations={screenplay.locations}
                                characters={screenplay.characters}
                                onSceneClick={(sceneId) => scrollStoryEditorTo(editorRef, sceneId)}
                            />
                        ) : (
                            <Typography variant="body2">
                                Load a screenplay to explore dialogue.
                            </Typography>
                        )}
                    </Box>
                </TabPanel>

                <TabPanel value={VisGroup.sentiment}>
                    <CharacterHeatmap scene={currentScene} screenplay={screenplay} />
                </TabPanel>
            </Box>
        </TabContext>
    );
}