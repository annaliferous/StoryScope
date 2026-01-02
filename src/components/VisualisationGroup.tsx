import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Divider, Grid, Tab, Typography } from "@mui/material";
import { useState, type RefObject } from "react";
import StackedChart from "./StackedChart";
import type { Screenplay } from "../hooks/useScreenplay";
import { scrollStoryEditorTo } from "./StoryEditor";
import { CharacterHeatmap } from "./CharacterHeatmap";
import type { SceneInfo } from "../hooks/useTimeline";
import { Diversity1, LocationPin, SentimentDissatisfied } from "@mui/icons-material";

enum VisGroup {
    relationship,
    location,
    sentiment,
}

export function VisualisationGroup({
    currentScene,
    screenplay,
    editorRef,
}: {
    currentScene?: SceneInfo;
    screenplay?: Screenplay;
    editorRef: RefObject<HTMLDivElement | null>;
}) {
    const [activeGroup, setActiveGroup] = useState(VisGroup.relationship);

    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        setActiveGroup(Number(newValue));
    };

    return (
        <TabContext value={String(activeGroup)}>
            <Grid container height="100%">
                {/* Sidebar */}
                <Grid
                    width={64}
                    height="100%"
                    bgcolor="#0c0c0c"
                    color="white"
                    display="flex"
                    justifyContent="center"
                >
                    <TabList
                        textColor="inherit"
                        orientation="vertical"
                        onChange={handleChange}
                        aria-label="Category Selection"
                    >
                        {[
                            { icon: <Diversity1 />, value: VisGroup.relationship, label: "Relationships" },
                            { icon: <LocationPin />, value: VisGroup.location, label: "Locations" },
                            { icon: <SentimentDissatisfied />, value: VisGroup.sentiment, label: "Scene Sentiment" },
                        ].map(({ icon, value, label }) => (
                            <Tab
                                key={value}
                                aria-label={label}
                                icon={icon}
                                value={String(value)}
                                sx={{
                                    minWidth: 64,
                                    height: 40,
                                }}
                            />
                        ))}
                    </TabList>
                </Grid>

                {/* Content */}
                <Grid flex={1} color="white" bgcolor="#0c0c0c" borderRadius={"8px"} margin={"4px"}>
                    <TabPanel value={String(VisGroup.relationship)}>
                        <Typography fontWeight="bold">
                            Relationship Graph
                        </Typography>
                        <hr style={{ border: "solid 1px #1f1f21" }} />
                    </TabPanel>

                    <TabPanel value={String(VisGroup.location)} sx={{ p: 0 }}>
                        <Box p={1} bgcolor="white">
                            {screenplay ? (
                                <StackedChart
                                    doc={screenplay.document}
                                    locations={screenplay.locations}
                                    characters={screenplay.characters}
                                    onSceneClick={(sceneId) =>
                                        scrollStoryEditorTo(editorRef, sceneId)
                                    }
                                />
                            ) : (
                                <Typography variant="body2">
                                    Load a screenplay to explore dialogue.
                                </Typography>
                            )}
                        </Box>
                    </TabPanel>

                    <TabPanel value={String(VisGroup.sentiment)}>
                        <CharacterHeatmap
                            scene={currentScene}
                            screenplay={screenplay}
                        />
                    </TabPanel>
                </Grid>
            </Grid>
        </TabContext>
    );
}
