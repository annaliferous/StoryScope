import { useMemo, useState, useCallback } from "react";
import { useScreenplay } from "./hooks/useScreenplay";
import WelcomeDialog from "./components/WelcomeDialog";
import { Grid, Stack } from "@mui/material";
import { StoryEditor } from "./components/StoryEditor";
import React from "react";
import "./index.css";
import { Header } from "./components/Header";
import { VisualisationGroup } from "./components/VisualisationGroup";
import PopupButton from "./components/PopupButton";
import type { SceneInfo } from "./hooks/useTimeline";
import { TimelineView } from "./components/timeline/TimelineView";
import { CounterContext } from "./utils/counter";
import { scrollToScene } from "./utils/scroll";

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

  // collapse/expand timneline
  const [isCollapsed, setIsCollapsed] = useState(false);
  // collapse/expand VisualisationGroup
  const [isVisCollapsed, setIsVisCollapsed] = useState(false);

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
        <Stack sx={{ p: 2, gap: 2, backgroundColor: "#e8eaf6" }}>
          <PopupButton screenplay={screenplay} />
          <Grid
            container
            height={`calc(100vh - ${isCollapsed ? 8 : timelineHeight}px - ${APPBAR_HEIGHT}px)`}
          >
            <Grid
              size={isVisCollapsed ? 0 : 6}
              height="100%"
              style={{
                overflow: "hidden",
                transition: "all 0.2s ease",
                position: "relative",
              }}
            >
              <VisualisationGroup
                screenplay={screenplay}
                currentScene={currentScene}
                selectedSceneIds={effectiveSelection}
              />
              <button
                onClick={() => setIsVisCollapsed(true)}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 1,
                  cursor: "pointer",
                  background: "#c5cae9",
                  border: "none",
                  borderRadius: "4px 0 0 4px",
                  padding: "8px 4px",
                  fontSize: "10px",
                }}
              >
                ◀
              </button>
            </Grid>
            <Grid
              size={isVisCollapsed ? 12 : 6}
              height="100%"
              style={{ transition: "all 0.2s ease", position: "relative" }}
            >
              {isVisCollapsed && (
                <button
                  onClick={() => setIsVisCollapsed(false)}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1,
                    cursor: "pointer",
                    background: "#c5cae9",
                    border: "none",
                    borderRadius: "0 4px 4px 0",
                    padding: "8px 4px",
                    fontSize: "10px",
                  }}
                >
                  ▶
                </button>
              )}
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
          {/* Resizer with collapse button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setIsCollapsed((prev) => !prev)}
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%) translateY(-50%)",
                top: "50%",
                zIndex: 1,
                cursor: "pointer",
                background: "#c5cae9",
                border: "none",
                borderRadius: "4px",
                padding: "0 8px",
                lineHeight: "16px",
                fontSize: "10px",
              }}
            >
              {isCollapsed ? "▲" : "▼"}
            </button>
            <div
              className="resizer"
              style={{
                height: 8,
                cursor: isCollapsed ? "default" : "row-resize",
                userSelect: "none",
                pointerEvents: isCollapsed ? "none" : "auto",
              }}
              onMouseDown={() => !isCollapsed && setIsDragging(true)}
            />
          </div>
          <div
            style={{
              height: isCollapsed ? 0 : timelineHeight - 8,
              overflow: "hidden",
              transition: "height 0.2s ease",
            }}
          >
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
          </div>
        </Grid>
      </Stack>
    </CounterContext.Provider>
  );
}

export default App;
