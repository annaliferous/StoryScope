import { useTimeline, type SceneInfo } from '../../hooks/useTimeline';
import { createTheme } from '@mui/material/styles';
import { deepPurple, indigo, teal } from '@mui/material/colors';
import type { Screenplay } from '../../hooks/useScreenplay';
import { useContext, useEffect, useRef, useState, type ChangeEvent, type RefObject } from 'react';
import { TimelineScene } from './TimelineScene';
import { TimelineCharacter } from './TimelineCharacter';
import { TimelineTime } from './TimelineTime';
import { CounterContext } from '../../utils/counter';
import { Slider } from '@mui/material';

interface TimelineProps {
    screenplay: Screenplay
    height: number
    onClick: (scene: SceneInfo) => void
    onScroll: (scene: SceneInfo) => void
    namesRef: RefObject<HTMLDivElement | null>
}

const marks = [
    {
        value: 1,
        label: 'x1',
    },
    {
        value: 2,
        label: 'x2',
    },
    {
        value: 3,
        label: 'x3',
    },
    {
        value: 4,
        label: 'x4',
    },
    {
        value: 5,
        label: 'x5',
    }
];  

function valuetext(value: number) {
  return `${value}%`;
}

export function Timeline({ screenplay, height, onClick, onScroll, namesRef }: TimelineProps) {
    const [zoomLevel, setZoomLevel] = useState(3);
    
    function changeZoomScene(e: ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setZoomLevel(Number(value) * 100);
        console.info('Slider changed! ', e.target.value);
    }

    // Rerender this component whenever counter is updated.
    useContext(CounterContext);

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
    const palette = [theme.palette.primary.light,  theme.palette.primary.main];

    const series = data.scenes.map((scene, idx) => ({
        label: scene.name,
        data: (scene.length / data.sceneTotals) * 100,
        scene: scene,
        color: palette[idx % palette.length],
    }));

    const SCENE_PADDING = 4; // px
    const SINGLE_TIMELINE_HEIGHT = 40; // px
    const PINNED_HEIGHT = 3.1* (SCENE_PADDING + SINGLE_TIMELINE_HEIGHT); //px

    const fixedDivRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const ref = namesRef.current;
        if (!ref) return;

        const handler = () => {
            if (timelineRef.current)
                timelineRef.current.scrollTop = ref.scrollTop;
        };

        ref.addEventListener("scroll", handler);

        return () => {
            ref.removeEventListener("scroll", handler);
        }
    }, [namesRef, timelineRef])

    useEffect(() => {
        const sceneEl = fixedDivRef.current;
        const charEl = timelineRef.current;

        if (!sceneEl || !charEl) return;

        const makeHandler = (source: HTMLDivElement, target: HTMLDivElement) =>
            () => {
                const scrollLeft = source.scrollLeft;
                target.scrollLeft = scrollLeft;

                // notify scene change
                let offset = 0;
                for (const s of series) {
                    offset += (s.data * 1000) + SCENE_PADDING;
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
    }, [series, onScroll, namesRef, timelineRef]); 

    return <div>
        <div style={{
            overflowX: "auto",
            paddingLeft: "50%",
            scrollbarWidth: "none",
            height: PINNED_HEIGHT + "px",
            backgroundColor:"#e8eaf6"
        }}
            ref={fixedDivRef}>
            <div style={{ width: 200, height: 48, position: "sticky", left: 360}}>
                <Slider
                    id='zoomSlider'
                    onChange={changeZoomScene}
                    defaultValue={3}
                    getAriaValueText={valuetext}
                    step={0.1}
                    min={0.05}
                    max={10}
                ></Slider>
            </div>
            <TimelineTime height={40} width={series.reduce((prev, curr) => prev + curr.data * zoomLevel + 4, 0)} scenePadding={SCENE_PADDING} />
            <TimelineScene name="timelineScenes" data={series} height={40} onClick={onClick} scenePadding={SCENE_PADDING} zoomLevel={zoomLevel} />
        </div>

        <div style={{
            height: `calc(${height}px - ${PINNED_HEIGHT}px)`,
            overflowX: "auto",
            // scrollbarWidth: "none",
        }}
            ref={timelineRef}
        >
            {Object.keys(data.dialogLengthByCharacter).map(character => {
                return <TimelineCharacter
                    key={character}
                    height={40}
                    zoomLevel={zoomLevel}
                    character={character}
                    dialogs={data.dialogLengthByCharacter[character]}
                    data={series}
                    onClick={onClick}
                    scenePadding={SCENE_PADDING} />;
            })}</div>
    </div>;

    }

