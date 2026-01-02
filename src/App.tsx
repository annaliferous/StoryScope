import { useRef, useState } from "react";
import { useScreenplay } from "./hooks/useScreenplay";
import WelcomeDialog from "./components/WelcomeDialog";
import { Grid, Stack } from "@mui/material";
import { StoryEditor } from "./components/StoryEditor";
import React from "react";
import './index.css';
import { Header } from "./components/Header";
import { VisualisationGroup } from "./components/VisualisationGroup";
import type { SceneInfo } from "./hooks/useTimeline";
import { TimelineView } from "./layouts/TimelineView";

const TIMELINE_HEIGHT = 240;
const APPBAR_HEIGHT = 48;

function App() {
  const [fdxFileUrl, setFdxFileUrl] = useState<string>();
  const [, setEditorOffset] = useState(0);
  // Needed for hijacking scrolling behaviour of the StoryEditor
  const editorRef = useRef<HTMLDivElement>(null);
  const screenplay = useScreenplay(fdxFileUrl); // use this for information processing
  const [currentScene, setCurrentScene] = useState<SceneInfo>();

  const [welcomeDialogOpen, setWelcomeDialogOpen] = React.useState(true);

  return (
    <>
      <WelcomeDialog isOpen={welcomeDialogOpen} onChange={(url) => { setFdxFileUrl(url); setWelcomeDialogOpen(false); }} />
      <Stack>
        <Header onActionClick={() => {
          setWelcomeDialogOpen(true);
        }} />
        <Stack bgcolor="#242424">
          <Grid container height={`calc(100vh - ${TIMELINE_HEIGHT}px - ${APPBAR_HEIGHT}px)`}>
            <Grid size={6}>
              <VisualisationGroup screenplay={screenplay} editorRef={editorRef} currentScene={currentScene} />
            </Grid>
            <Grid size={6} height={`calc(100vh - ${TIMELINE_HEIGHT}px - ${APPBAR_HEIGHT}px)`}>
              {screenplay && <StoryEditor ref={editorRef} doc={screenplay.document} onChange={console.log} onScroll={setEditorOffset} />}
            </Grid>
          </Grid>
        </Stack>
        <Grid size={12} padding={0}>
          <TimelineView screenplay={screenplay} height={TIMELINE_HEIGHT} editorRef={editorRef} onSceneChange={setCurrentScene} />
        </Grid>
      </Stack>
    </>
  );
}

export default App;
