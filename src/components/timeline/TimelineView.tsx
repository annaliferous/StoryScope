import { Box, Grid } from "@mui/material";
import { Timeline } from "./Timeline";
import { type Screenplay } from "../../hooks/useScreenplay";
import { scrollStoryEditorTo } from "../StoryEditor";
import { useContext, useRef, type RefObject } from "react";
import type { SceneInfo } from "../../hooks/useTimeline";
import { PushPin } from "@mui/icons-material";
import { getCharacterColor, setCharacterColor } from "../../utils/colors";
import { CounterContext } from "../../utils/counter";

interface SceneOverviewProps {
    screenplay?: Screenplay
    height: number,
    editorRef: RefObject<HTMLDivElement | null>
    onClick?: (scene: SceneInfo) => void
    onScroll?: (scene: SceneInfo) => void
}

export function TimelineView({ screenplay, height, editorRef, onClick, onScroll }: SceneOverviewProps) {
    // Force update!
    const { counter, setCounter } = useContext(CounterContext);
    const namesRef = useRef<HTMLDivElement>(null);
    return (
        <Box color="#8d8c8fff">
            <Grid container spacing={0.3} >
                <Grid size={2} bgcolor="#1b1a1d" display="flex" flexDirection="column" height={height}>
                    <Box
                        paddingLeft={3}
                        marginBottom={0.3}
                        minHeight="40px"
                        margin={0}
                        alignContent="center"
                    >
                        Scene Overview
                    </Box>
                    <hr style={{ width: "100%", border: "2px solid #0c0c0c", margin: 0 }} />
                    <div style={{
                        height: "40px",
                        padding: "2px 0 2px 0",
                        display: "flex",
                        alignItems: "center",
                        borderBottom: "solid 1px #363636ff",
                        fontSize: "12px",
                        margin: 0,
                    }}>
                        <PushPin style={{ margin: "10px 15px", }} />
                        SCENES
                    </div>
                    <div style={{
                        height: `calc(${height}px - 49px)`,
                        overflow: "auto",
                        scrollbarWidth: "none",
                    }}
                        ref={namesRef}
                    >
                        {Array.from(screenplay?.characters ?? []).map(character => {
                            return <div style={{
                                height: "40px",
                                padding: "2px 0 2px 0",
                                display: "flex",
                                alignItems: "center",
                                fontSize: "12px",
                                borderBottom: "solid 1px #363636ff",
                            }}
                                title={character}>
                                <div style={{
                                    margin: "0 15px",
                                    minWidth: 20,
                                    height: 20,
                                    backgroundColor: getCharacterColor(character),
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                                    onClick={() => {
                                        const $input = document.createElement("input");
                                        $input.value = getCharacterColor(character);
                                        $input.type = "color";
                                        document.body.append($input);
                                        $input.click();

                                        $input.onchange = () => {
                                            setCharacterColor(character, $input.value);
                                            $input.remove();
                                            setCounter(counter + 1);
                                        }
                                    }}
                                />
                                <span style={{
                                    display: "block",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}>{character}</span>
                            </div>;
                        })}
                    </div>
                </Grid>
                <Grid size={10} overflow="hidden" height={height}>
                    <div id='indicator' style={{
                        position: "relative",
                        float: "left",
                        border: "solid 1px white",
                        width: 0,
                        height: "5000%", // Dunno why, but this somehow works without overflowing.
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                    }}>

                    </div>
                    {
                        screenplay && <Timeline
                            namesRef={namesRef}
                            screenplay={screenplay}
                            height={height}
                            onClick={(scene) => {
                                scrollStoryEditorTo(editorRef, scene.id);
                                if (onClick)
                                    onClick(scene);
                            }}
                            onScroll={(scene) => {
                                scrollStoryEditorTo(editorRef, scene.id);
                                if (onScroll)
                                    onScroll(scene);
                            }}
                        />
                    }
                </Grid>
            </Grid>
        </Box>
    );
}