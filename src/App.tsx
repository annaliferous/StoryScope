import { useState } from "react";
import { useScreenplay } from "./hooks/useScreenplay";
import WelcomeDialog from "./components/WelcomeDialog";
import { Grid, Stack } from "@mui/material";
import { StoryEditor } from "./components/StoryEditor";
import React from "react";
import "./index.css";
import { Header } from "./components/Header";
import { VisualisationGroup } from "./components/VisualisationGroup";
import type { SceneInfo } from "./hooks/useTimeline";
import { TimelineView } from "./components/timeline/TimelineView";
import { CounterContext } from "./utils/counter";
import { scrollToScene } from "./utils/scroll";

const TIMELINE_HEIGHT = 300;
const APPBAR_HEIGHT = 48;

function App() {
  const [counter, setCounter] = useState(0);
  const [fdxFileUrl, setFdxFileUrl] = useState<string>();
  const [, setEditorOffset] = useState(0);
  const screenplay = useScreenplay(fdxFileUrl); // use this for information processing
  const [currentScene, setCurrentScene] = useState<SceneInfo>();

  const [welcomeDialogOpen, setWelcomeDialogOpen] = React.useState(true);

  function printDoc(doc: XMLDocument) {
    console.log("Updated document:");
  }

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
          onActionClick={() => {
            setWelcomeDialogOpen(true);
          }}
        />
        <Stack bgcolor="#e8eaf6">
          <Grid
            container
            height={`calc(100vh - ${TIMELINE_HEIGHT}px - ${APPBAR_HEIGHT}px)`}
          >
            <Grid size={6}>
              <VisualisationGroup
                screenplay={screenplay}
                currentScene={currentScene}
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
                />
              )}
            </Grid>
          </Grid>
        </Stack>
        <Grid size={12} sx={{ padding: 0, backgroundColor: "#e8eaf6" }}>
          <TimelineView
            screenplay={screenplay}
            height={TIMELINE_HEIGHT}
            onClick={setCurrentScene}
            onScroll={setCurrentScene}
          />
        </Grid>
      </Stack>
    </CounterContext.Provider>
  );
}

export default App;
