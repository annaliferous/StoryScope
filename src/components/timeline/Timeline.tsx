import { useTimeline, type SceneInfo } from "../../hooks/useTimeline";
import { createTheme } from "@mui/material/styles";
import { deepPurple, indigo, teal } from "@mui/material/colors";
import type { Screenplay } from "../../hooks/useScreenplay";
import { useContext, useEffect, useRef, useState, type RefObject } from "react";
import { TimelineScene } from "./TimelineScene";
import { TimelineCharacter } from "./TimelineCharacter";
import { TimelineTime } from "./TimelineTime";
import { CounterContext } from "../../utils/counter";
import { IconButton, Slider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import debounce from "lodash.debounce";

interface TimelineProps {
  screenplay: Screenplay;
  height: number;
  width?: number;
  onClick: (scene: SceneInfo, isMulti?: boolean) => void;
  onScroll: (scene: SceneInfo) => void;
  selectedSceneIds: string[];
  namesRef: RefObject<HTMLDivElement | null>;
}

function valuetext(value: number) {
  return `${value}%`;
}

export function Timeline({
  screenplay,
  height,
  onClick,
  onScroll,
  selectedSceneIds,
  namesRef,
}: TimelineProps) {
  const [zoomLevel, setZoomLevel] = useState(5);

  function changeZoomScene(_event: Event, value: number | number[]) {
    const val = value as number;
    setZoomLevel(val * 100);
    console.info("Slider changed! ", val);
  }

  // Rerender this component whenever counter is updated.
  useContext(CounterContext);

  const data = useTimeline(screenplay);
  // call hook inside component
  const theme = createTheme({
    palette: {
      primary: {
        main: indigo[200],
        light: indigo[100],
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
      },
    },
  });
  const palette = [theme.palette.primary.light, theme.palette.primary.main];

  const series = data.scenes.map((scene, idx) => ({
    label: scene.name,
    data: (scene.length / data.sceneTotals) * 100,
    scene: scene,
    color: palette[idx % palette.length],
  }));

  const SCENE_PADDING = 4; // px
  const SINGLE_TIMELINE_HEIGHT = 40; // px
  const PINNED_HEIGHT = (SCENE_PADDING + SINGLE_TIMELINE_HEIGHT) * 2; //px

  const fixedDivRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // information for drag to scroll
  const dragRef = useRef({
    hasClicked: false,
    startX: 0,
    startScrollLeft: 0,
  });
  const DRAG_THRESHOLD = 6; // px

  // handling of hold click events to allow drag to scroll timeline
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = e.currentTarget;
    dragRef.current.hasClicked = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startScrollLeft = el.scrollLeft;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const difference = e.clientX - dragRef.current.startX;
    if (dragRef.current.hasClicked) {
      if (Math.abs(difference) < DRAG_THRESHOLD) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      const el = e.currentTarget;
      el.scrollLeft = dragRef.current.startScrollLeft - difference;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.hasClicked = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    const ref = namesRef.current;
    if (!ref) return;

    const handler = () => {
      if (timelineRef.current) timelineRef.current.scrollTop = ref.scrollTop;
    };

    ref.addEventListener("scroll", handler);

    return () => {
      ref.removeEventListener("scroll", handler);
    };
  }, [namesRef, timelineRef]);

  const scrollDebounce = debounce((e: Event) => {
    let offset = 0;
    const target = e.target as HTMLElement | null;
    if (!target) return;

    for (const s of series) {
      offset += s.data * zoomLevel + (SCENE_PADDING + 4);
      if (offset >= target.scrollLeft) {
        onScroll(s.scene);
        break;
      }
    }
  }, 50, {
    leading: false,
    trailing: true,
  });

  useEffect(() => {
    const sceneEl = fixedDivRef.current;
    const charEl = timelineRef.current;

    if (!sceneEl || !charEl) return;

    const makeHandler =
      (source: HTMLDivElement, target: HTMLDivElement) => () => {
        const scrollLeft = source.scrollLeft;
        target.scrollLeft = scrollLeft;
      };

    const sceneHandler = makeHandler(sceneEl, charEl);
    const charHandler = makeHandler(charEl, sceneEl);

    sceneEl.addEventListener("scroll", sceneHandler);
    charEl.addEventListener("scroll", charHandler);
    charEl.addEventListener("scroll", () => {
      if (namesRef.current) namesRef.current.scrollTop = charEl.scrollTop;
    });

    sceneEl.addEventListener("scrollend", scrollDebounce);

    return () => {
      sceneEl.removeEventListener("scroll", sceneHandler);
      charEl.removeEventListener("scroll", charHandler);
    };
  }, [series, onScroll, namesRef, timelineRef, zoomLevel, scrollDebounce]);

  return (
    <div>
      <div
        style={{
          overflowX: "auto",
          paddingLeft: "50%",
          scrollbarWidth: "none",
          height: PINNED_HEIGHT + "px",
          backgroundColor: "#e8eaf6",
        }}
        ref={fixedDivRef}
      >
        <div
          style={{
            width: 200,
            height: 40,
            position: "fixed",
            right: 0,
            display: "flex",
            justifyItems: "center",
            backgroundColor: "#c5cae9dd",
          }}
        >
          <IconButton
            aria-label="zoom out"
            sx={{ color: "#1a237e" }}
            onClick={() => {
              const newValue = zoomLevel - 50;
              if (newValue < 0) return;
              setZoomLevel(zoomLevel - 50)
            }}
          >
            <RemoveIcon
            />
          </IconButton>
          <Slider
            id="zoomSlider"
            onChange={changeZoomScene}
            defaultValue={zoomLevel}
            getAriaValueText={valuetext}
            value={zoomLevel / 100}
            step={0.2}
            min={0.14}
            max={10}
            sx={{
              color: "primary.dark",
              marginY: "auto",
            }}
          ></Slider>
          <IconButton
            aria-label="zoom in"
            sx={{ color: "#1a237e" }}
            onClick={() => {
              const newValue = zoomLevel + 50;
              if (newValue > 1000) return;
              console.log("zoomLevel", zoomLevel)
              setZoomLevel(zoomLevel + 50)
            }}
          >
            <AddIcon
            />
          </IconButton>
        </div>
        <TimelineTime
          height={40}
          width={series.reduce(
            (prev, curr) => prev + curr.data * zoomLevel + SCENE_PADDING + 4,
            0,
          )}
          scenePadding={SCENE_PADDING}
        />
        <TimelineScene
          name="timelineScenes"
          data={series}
          height={40}
          onClick={onClick}
          scenePadding={SCENE_PADDING}
          selectedSceneIds={selectedSceneIds}
          zoomLevel={zoomLevel}
        />
      </div>

      <div
        style={{
          height: `calc(${height}px - ${PINNED_HEIGHT}px)`,
          overflowX: "auto",
          // scrollbarWidth: "none",
        }}
        ref={timelineRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {Object.keys(data.dialogLengthByCharacter).map((character) => {
          return (
            <TimelineCharacter
              key={character}
              height={40}
              zoomLevel={zoomLevel}
              character={character}
              dialogs={data.dialogLengthByCharacter[character]}
              data={series}
              onClick={onClick}
              scenePadding={SCENE_PADDING}
            />
          );
        })}
      </div>
    </div>
  );
}
