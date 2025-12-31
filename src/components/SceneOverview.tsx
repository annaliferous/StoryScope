import { Typography } from "@mui/material";
import { Timeline } from "./Timeline";
import type { Screenplay } from "../hooks/useScreenplay";
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
            {
                screenplay && <Timeline doc={screenplay.document} height={height} onClick={(scene) => {
                    scrollStoryEditorTo(editorRef, scene.id);
                    if (onClick)
                        onClick(scene);
                }} />
            }
        </>
    );
}