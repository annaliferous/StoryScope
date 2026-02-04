import { useMemo, useState, useCallback } from "react";
import { useScreenplay } from "./hooks/useScreenplay";
import WelcomeDialog from "./components/WelcomeDialog";
import { Grid, Icon, Stack } from "@mui/material";
import { StoryEditor } from "./components/StoryEditor";
import React from "react";
import "./index.css";
import { Header } from "./components/Header";
import { VisualisationGroup } from "./components/VisualisationGroup";
import type { SceneInfo } from "./hooks/useTimeline";
import { TimelineView } from "./components/timeline/TimelineView";
import { CounterContext } from "./utils/counter";
import { scrollToScene } from "./utils/scroll";
import { MoreHoriz } from "@mui/icons-material";

const APPBAR_HEIGHT = 48;
const BLANK_FDX_FILE_URL = `${import.meta.env.BASE_URL}Blank_Screenplay.fdx`;

function App() {
  const [counter, setCounter] = useState(0);
  const [fdxFileUrl, setFdxFileUrl] = useState<string>();
  const [, setEditorOffset] = useState(0);
  const screenplay = useScreenplay(fdxFileUrl); // use this for information processing

  // scene which is currently active / focused by scroll or click
  const [currentScene, setCurrentScene] = useState<SceneInfo>();
  // scenes which are selected (multi-selection)
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);
  //active scene is used only when no scenes are selected

  const [timelineHeight, setTimelineHeight] = useState(300);

  const effectiveSelection = useMemo(() => {
    if (selectedSceneIds.length > 0) {
      return selectedSceneIds;
    }
    // Wenn nichts manuell gewählt ist, nimm die ID der aktuellen Scroll-Szene
    return currentScene?.id ? [currentScene.id] : [];
  }, [selectedSceneIds, currentScene]);

  // Handle clicks from the Editor
  const handleSceneClick = useCallback((id: string, isMulti: boolean) => {
    if (isMulti) {
      setSelectedSceneIds(
        (prev) =>
          prev.includes(id)
            ? prev.filter((sid) => sid !== id) // Remove if already selected
            : [...prev, id], // Add to selection
      );
    } else {
      // Normal click: toggle or just select
      setSelectedSceneIds([id]);
    }
  }, []);

  const [welcomeDialogOpen, setWelcomeDialogOpen] = React.useState(true);

  function printDoc(doc: XMLDocument) {
    console.log("Updated document:", doc);
  }

  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setTimelineHeight(window.innerHeight - e.clientY);
    };

    const onMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, setTimelineHeight]);

  return (
    <CounterContext.Provider value={{ counter, setCounter }}>
      <WelcomeDialog
        isOpen={welcomeDialogOpen}
        onChange={(url) => {
          setFdxFileUrl(url);
          setWelcomeDialogOpen(false);
        }}
      />
      <Stack>
        <Header
          onNewScriptClick={() => {
            setFdxFileUrl(BLANK_FDX_FILE_URL);
            setWelcomeDialogOpen(false);
          }}
          onUploadClick={() => {
            setWelcomeDialogOpen(true);
          }}
        />
        <Stack bgcolor="#e8eaf6">
          <Grid
            container
            height={`calc(100vh - ${timelineHeight}px - ${APPBAR_HEIGHT}px)`}
          >
            <Grid size={6} height="100%">
              <VisualisationGroup
                screenplay={screenplay}
                currentScene={currentScene}
                selectedSceneIds={effectiveSelection}
              />
            </Grid>
            <Grid size={6} height="100%">
              {screenplay?.document && (
                <StoryEditor
                  key={fdxFileUrl || "initial"}
                  doc={screenplay.document}
                  onChange={printDoc}
                  onScroll={setEditorOffset}
                  onSyncTimeline={(id) => {
                    scrollToScene(id, "timeline");
                  }}
                  onSceneClick={handleSceneClick}
                  selectedSceneIds={selectedSceneIds}
                />
              )}
            </Grid>
          </Grid>
        </Stack>
        <Grid
          size={12}
          sx={{ padding: 0, backgroundColor: "#e8eaf6", zIndex: 50 }}
        >
          <div
            className="resizer"
            style={{
              height: 8,
              cursor: "row-resize",
              userSelect: "none",
            }}
            onMouseDown={() => setIsDragging(true)}
          />
          <TimelineView
            screenplay={screenplay}
            height={timelineHeight - 8}
            onClick={(scene, isMulti) => {
              handleSceneClick(scene.id, !!isMulti);
              setCurrentScene(scene);
            }}
            onScroll={setCurrentScene}
            selectedSceneIds={effectiveSelection}
          />
        </Grid>
      </Stack>
    </CounterContext.Provider>
  );
}

export default App;
