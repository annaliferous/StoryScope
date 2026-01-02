import { useTimeline, type SceneInfo } from '../../hooks/useTimeline';
import { createTheme } from '@mui/material/styles';
import { deepPurple, indigo, teal } from '@mui/material/colors';
import type { Screenplay } from '../../hooks/useScreenplay';
import { useEffect, useRef, type RefObject } from 'react';
import { TimelineScene } from './TimelineScene';
import { TimelineCharacter } from './TimelineCharacter';

interface TimelineProps {
    screenplay: Screenplay
    height: number
    width?: number
    onClick: (scene: SceneInfo) => void
    onScroll: (scene: SceneInfo) => void
    namesRef: RefObject<HTMLDivElement | null>
}

export function Timeline({ screenplay, height, onClick, onScroll, namesRef }: TimelineProps) {
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
        data: (scene.length / data.sceneTotals) * 100,
        scene: scene,
        color: palette[idx % palette.length],
    }));

    const scenePadding = 4; // px
    const fixedDivRef = useRef<HTMLDivElement>(null);
    const characterDivRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ref = namesRef.current;
        if (!ref) return;

        const handler = () => {
            if (characterDivRef.current)
                characterDivRef.current.scrollTop = ref.scrollTop;
        };

        ref.addEventListener("scroll", handler);

        return () => {
            ref.removeEventListener("scroll", handler);
        }
    }, [namesRef])

    useEffect(() => {
        const sceneEl = fixedDivRef.current;
        const charEl = characterDivRef.current;

        if (!sceneEl || !charEl) return;

        const makeHandler = (source: HTMLDivElement, target: HTMLDivElement) =>
            () => {
                const scrollLeft = source.scrollLeft;
                target.scrollLeft = scrollLeft;

                // notify scene change
                let offset = 0;
                for (const s of series) {
                    offset += (s.data * 1000) + scenePadding;
                    if (offset >= scrollLeft) {
                        onScroll(s.scene);
                        break;
                    }
                }
            };

        const sceneHandler = makeHandler(sceneEl, charEl);
        const charHandler = makeHandler(charEl, sceneEl);

        sceneEl.addEventListener("scroll", sceneHandler);
        charEl.addEventListener("scroll", charHandler);
        charEl.addEventListener("scroll", () => {
            if (namesRef.current)
                namesRef.current.scrollTop = charEl.scrollTop;
        });

        return () => {
            sceneEl.removeEventListener("scroll", sceneHandler);
            charEl.removeEventListener("scroll", charHandler);
        };
    }, [series, onScroll, namesRef]);


    return <>
        <div style={{
            overflowX: "auto",
            paddingLeft: "50%",
            scrollbarWidth: "none",
        }}
            ref={fixedDivRef}
        >
            <div style={{
                height: "40px",
                marginBottom: scenePadding,
                backgroundColor: "#1b1a1d",
                width: series.reduce((prev, curr) => prev + curr.data * 1000 + 4, 0) + "px",
                backgroundImage: "url('/Indicator.svg')",
                backgroundSize: "auto 50%",
                backgroundRepeat: "repeat-x",
                backgroundPosition: "0 bottom",
            }}>
                Timeline
            </div>

            <TimelineScene data={series} height={40} onClick={onClick} scenePadding={scenePadding} />
        </div>

        <div style={{
            height,
            overflowX: "auto",
            scrollbarWidth: "none",
        }}
            ref={characterDivRef}
        >
            {Object.keys(data.dialogLengthByCharacter).map(character => {
                return <TimelineCharacter
                    key={character}
                    height={40}
                    character={character}
                    dialogs={data.dialogLengthByCharacter[character]}
                    data={series}
                    onClick={onClick}
                    scenePadding={scenePadding} />;
            })}</div>
    </>;

}
