import { useTimeline, type SceneInfo } from '../hooks/useTimeline';
import { createTheme } from '@mui/material/styles';
import { deepPurple, indigo, teal } from '@mui/material/colors';
import type { Screenplay } from '../hooks/useScreenplay';
import { getCharacterColor } from '../utils/colors';
import { useEffect, useRef } from 'react';

interface TimelineProps {
    screenplay: Screenplay
    height: number
    width?: number
    onClick: (scene: SceneInfo) => void
    onScroll: (scene: SceneInfo) => void
}

export function Timeline({ screenplay, height, onClick, onScroll }: TimelineProps) {
    const data = useTimeline(screenplay);
    // call hook inside component
    const theme = createTheme({
        palette: {
            primary: {
                main: indigo[500],
                light: indigo[300],
                dark: indigo[700],
            },
            secondary: {
                main: teal[300],
                light: teal[100],
                dark: teal[500],
            },
            info: {
                main: deepPurple[300],
                light: deepPurple[100],
                dark: deepPurple[500],
            }

        },
    });
    const palette = [theme.palette.primary.main, theme.palette.primary.light, theme.palette.primary.dark, theme.palette.secondary.main, theme.palette.secondary.light, theme.palette.secondary.dark];

    const series = data.scenes.map((scene, idx) => ({
        label: scene.name,
        data: [(scene.length / data.sceneTotals) * 100],
        scene: scene,
        color: palette[idx % palette.length],
        valueFormatter: (v: number | null) => (v !== null ? v.toFixed(2) + '%' : ''),
    }));

    const scenePadding = "4px";
    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ref = divRef.current;

        const scrollHandler = () => {
            if (!ref) return;
            const currentScrollOffset = ref.scrollLeft;
            let offset = 0;
            for (const s of series) {
                offset += (s.data[0] * 1000) + 4 // scene padding
                if (offset >= currentScrollOffset) {
                    onScroll(s.scene)
                    break;
                }
            }
        }
        ref?.addEventListener("scroll", scrollHandler)

        // Destructor
        return () => { ref?.removeEventListener("scroll", scrollHandler) }
    }, [onScroll, series])

    return <div
        style={{
            overflow: "auto",
            paddingLeft: "50%",
        }}
        ref={divRef}>
        <div style={{
            height,
            marginBottom: scenePadding,
            padding: 1,
            backgroundColor: "#1b1a1d",
            width: series.reduce((prev, curr) => prev + curr.data[0] * 1000 + 4, 0) + "px",
        }}>
            Timeline
        </div>
        <div style={{
            display: "flex",
            whiteSpace: "nowrap",
        }}>
            {series.map((item, index) => {
                return <div style={{
                    height,
                    width: `${item.data[0] * 1000}px`,
                    backgroundColor: item.color,
                    textAlign: "center",
                    flexShrink: 0,
                    borderRadius: "8px",
                    marginRight: scenePadding,
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer"
                }}
                    title={item.label}
                    onClick={() => {
                        onClick(data.scenes[index])
                    }}
                >
                    <span style={{
                        display: "block",
                        textOverflow: "ellipsis",
                        width: "100%",
                        overflow: "hidden",
                        color: "#0c0c0c",
                        userSelect: "none",
                    }}>
                        {item.label}
                    </span>
                </div>;
            })}
        </div>

        {Object.keys(data.dialogLengthByCharacter).map(character => {
            return <div style={{
                display: "flex",
                whiteSpace: "nowrap",
                marginTop: 4,
                flexShrink: 0,
                borderBottom: "solid 1px transparent"
            }}>
                {data.dialogLengthByCharacter[character].map((scene, sceneIndex) => {
                    return <div style={{
                        display: "flex",
                        width: series[sceneIndex].data[0] * 1000 + "px",
                        marginRight: scenePadding,
                        borderRadius: "8px",
                        flexShrink: 0,
                    }}>
                        {scene.map(dialog => {
                            return <div style={{
                                height,
                                width: dialog.length * (series[sceneIndex].data[0] * 1000) + "px",
                                backgroundColor: dialog.isSpeaking ? getCharacterColor(character) : "transparent",
                                borderRadius: "8px",
                                flexShrink: 0,
                            }}>
                                {/* {character} */}
                            </div>;
                        })}
                    </div>;
                })}
            </div>
        })}
    </div>;

}
