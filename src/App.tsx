import { useRef, useState } from "react";
import { useScreenplay } from "./hooks/useScreenplay";
import WelcomeDialog from "./components/WelcomeDialog";
import { Grid, Stack } from "@mui/material";
import { StoryEditor } from "./components/StoryEditor";
import React from "react";
import { indigo } from '@mui/material/colors';
import './index.css';
import { Header } from "./components/Header";
import { SceneOverview } from "./components/SceneOverview";
import { VisualisationGroup } from "./components/VisualisationGroup";
import type { SceneInfo } from "./hooks/useTimeline";

const TIMELINE_HEIGHT = 80;

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
      <Stack bgcolor={indigo[50]}>
        <Header onActionClick={() => {
          setWelcomeDialogOpen(true);
        }} />
        <Grid size={12} padding={0}>
          <SceneOverview screenplay={screenplay} editorRef={editorRef} height={TIMELINE_HEIGHT} onClick={(scene) => {
            setCurrentScene(scene);
          }} />
        </Grid>
        <Grid container height={`calc(100vh - ${TIMELINE_HEIGHT}px)`} spacing={1}>
          <Grid size={6}>
            <VisualisationGroup screenplay={screenplay} editorRef={editorRef} currentScene={currentScene} />
          </Grid>
          <Grid size={6} height={`calc(100vh - ${TIMELINE_HEIGHT}px)`}>
            {screenplay && <StoryEditor ref={editorRef} doc={screenplay.document} onChange={console.log} onScroll={setEditorOffset} />}
          </Grid>
        </Grid>
      </Stack>
    </>
  );
}

export default App;
