import { Grid, Typography } from "@mui/material";
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
        <>
            <Typography marginLeft={3} paddingTop={1}>
                Scene Overview
            </Typography>
            <Grid container spacing={0.3} color="#8d8c8fff">
                <Grid size={2} bgcolor="#242424" display="flex" flexDirection="column">
                    <div style={{
                        height, display: "flex", alignItems: "center", borderBottom: "solid 1px #363636ff", fontWeight: "bold",
                    }}>
                        <PushPin style={{ margin: "10px", }} />
                        Scenes
                    </div>
                    {Array.from(screenplay?.characters ?? []).map(character => {
                        return <div style={{
                            height,
                            padding: "2px 0 2px 0",
                            display: "flex",
                            alignItems: "center",
                            fontSize: "14px",
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
                <Grid size={10} overflow="auto">

                    {
                        screenplay && <Timeline screenplay={screenplay} height={height} onClick={(scene) => {
                            scrollStoryEditorTo(editorRef, scene.id);
                            if (onClick)
                                onClick(scene);
                        }} />
                    }
                </Grid>
            </Grid>
        </>
    );
}