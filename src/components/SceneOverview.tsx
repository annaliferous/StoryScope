import { Grid, Typography } from "@mui/material";
import { Timeline } from "./Timeline";
import { useScreenplay, type Screenplay } from "../hooks/useScreenplay";
import { scrollStoryEditorTo } from "./StoryEditor";
import type { RefObject } from "react";
import type { SceneInfo } from "../hooks/useTimeline";

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
            <Grid container spacing={2}>
                <Grid size={1}>
                    <div style={{ height }}> Scenes </div>
                    {Array.from(screenplay?.characters ?? []).map(character => {
                        return <div style={{ height, marginTop: 4 }}>
                            {character}
                        </div>;
                    })}
                </Grid>
                <Grid size={11} overflow="auto">

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