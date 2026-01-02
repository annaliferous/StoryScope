import { Box, Grid, Typography } from "@mui/material";
import { Timeline } from "./Timeline";
import { type Screenplay } from "../hooks/useScreenplay";
import { scrollStoryEditorTo } from "./StoryEditor";
import type { RefObject } from "react";
import type { SceneInfo } from "../hooks/useTimeline";
import { DragIndicator, PushPin } from "@mui/icons-material";

interface SceneOverviewProps {
    screenplay?: Screenplay
    height: number,
    editorRef: RefObject<HTMLDivElement | null>
    onClick?: (scene: SceneInfo) => void
}

export function SceneOverview({ screenplay, height, editorRef, onClick }: SceneOverviewProps) {
    return (
        <Box color="#8d8c8fff">
            <Grid container spacing={0.3} >
                <Grid size={2} bgcolor="#1b1a1d" display="flex" flexDirection="column">
                    <Typography paddingLeft={3} paddingTop={1} paddingBottom={1} marginBottom={0.3}>
                        Scene Overview
                    </Typography>
                    <hr style={{ width: "100%", border: "2px solid #0c0c0c", margin: 0 }} />
                    <div style={{
                        height,
                        padding: "2px 0 2px 0",
                        display: "flex",
                        alignItems: "center",
                        borderBottom: "solid 1px #363636ff",
                        fontSize: "12px"
                    }}>
                        <PushPin style={{ margin: "10px", }} />
                        SCENES
                    </div>
                    {Array.from(screenplay?.characters ?? []).map(character => {
                        return <div style={{
                            height,
                            padding: "2px 0 2px 0",
                            display: "flex",
                            alignItems: "center",
                            fontSize: "12px",
                            borderBottom: "solid 1px #363636ff",
                        }}
                            title={character}>
                            <DragIndicator style={{ margin: "0 10px", cursor: "grab" }} />
                            <span style={{
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}>{character}</span>
                        </div>;
                    })}
                </Grid>
                <Grid size={10} overflow="hidden">
                    <div id='indicator' style={{
                        position: "relative",
                        float: "left",
                        border: "solid 1px white",
                        width: 0,
                        height: "5000%", // Dunno why, but this somehow works without overflowing.
                        left: "50%",
                        transform: "translate(-50%, -50%)"
                    }}>

                    </div>
                    {
                        screenplay && <Timeline
                            screenplay={screenplay}
                            height={height}
                            onClick={(scene) => {
                                scrollStoryEditorTo(editorRef, scene.id);
                                if (onClick)
                                    onClick(scene);
                            }}
                            onScroll={(scene) => {
                                scrollStoryEditorTo(editorRef, scene.id);
                            }}
                        />
                    }
                </Grid>
            </Grid>
        </Box>
    );
}