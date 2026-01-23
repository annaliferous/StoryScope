import { Box, Grid, Slider } from "@mui/material";
import { Timeline } from "./Timeline";
import { type Screenplay } from "../../hooks/useScreenplay";
import { useContext, useRef } from "react";
import type { SceneInfo } from "../../hooks/useTimeline";
import { PushPin } from "@mui/icons-material";
import { getCharacterColor, setCharacterColor } from "../../utils/colors";
import { CounterContext } from "../../utils/counter";
import { scrollToScene } from "../../utils/scroll";

interface SceneOverviewProps {
    screenplay?: Screenplay
    height: number,
    onClick?: (scene: SceneInfo) => void
    onScroll?: (scene: SceneInfo) => void
}

function valuetext(value: number) {
  return `x ${value}`;
}

function changeZoom(value: number) {
    const slider = document.querySelector('input[aria-label="Zoom"]') as HTMLInputElement;
    if (slider) {
        slider.value = value.toString();
        
    }
}

export function TimelineView({ screenplay, height, onClick, onScroll }: SceneOverviewProps) {
    // Force update!
    const { counter, setCounter } = useContext(CounterContext);
    const namesRef = useRef<HTMLDivElement>(null);
    return (
        <Box color="#1a237e">
            <Grid container spacing={0.3}>
                <Grid size={2} bgcolor="#e8eaf6" display="flex" flexDirection="column" height={height}>
                    <Box
                        paddingLeft={3}
                        marginBottom={0.3}
                        minHeight="88px"
                        margin={0}
                        alignContent="center"
                    >
                        Scene Overview
                        
                    </Box>
                    <hr style={{ width: "100%", border: "2px solid #c5cae9", margin: 0 }} />
                    <div style={{
                        height: "40px",
                        padding: "2px 0 2px 0",
                        display: "flex",
                        alignItems: "center",
                        borderBottom: "solid 1px #c5cae9",
                        fontSize: "12px",
                        margin: 0,
                    }}>
                        <PushPin style={{ margin: "10px 15px", }} />
                        Scenes 
                    </div>
                    <div style={{
                        height: `calc(${height}px - 49px)`,
                        overflow: "auto",
                        scrollbarWidth: "none",
                    }}
                        ref={namesRef}
                    >
                        {Array.from(screenplay?.characters ?? []).map(character => {
                            return <div key={character} style={{
                                height: "40px",
                                padding: "2px 0 2px 0",
                                display: "flex",
                                alignItems: "center",
                                fontSize: "12px",
                                borderBottom: "solid 1px #c5cae9",
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
                                scrollToScene(scene.id, "editor");
                                if (onClick)
                                    onClick(scene);
                            }}
                            onScroll={(scene) => {
                                scrollToScene(scene.id, "editor");
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