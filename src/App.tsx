import { useRef, useState } from "react";
import { useScreenplay } from "./hooks/useScreenplay";
import WelcomeDialog from "./components/WelcomeDialog";
import { Button, Grid, Stack } from "@mui/material";
import FilterListIcon from '@mui/icons-material/FilterList';
import { scrollStoryEditorTo, StoryEditor } from "./components/StoryEditor";
import { Timeline } from "./components/Timeline";
import { FilterList, Padding } from "@mui/icons-material";
import {Typography } from "@mui/material";
import StackedChart from "./components/StackedChart";


const TIMELINE_HEIGHT = 64;

function App() {
  const [fdxFileUrl, setFdxFileUrl] = useState<string>();
  const [editorOffset, setEditorOffset] = useState(0);
  // Needed for hijacking scrolling behaviour of the StoryEditor
  const editorRef = useRef<HTMLDivElement>(null);
  const screenplay = useScreenplay(fdxFileUrl); // use this for information processing

  return (
    <>
      <WelcomeDialog isOpen={!fdxFileUrl} onChange={setFdxFileUrl} />
      <Stack>
        <Grid>
          <div style={{textAlign:"center", background:"#596490", margin:0,padding:1, color:"white"}}>
            <h1>StoryScope - Visualize Your Drama!</h1>
          </div>
        </Grid>
        <Grid size={12} padding={0} height={TIMELINE_HEIGHT*1.6 + "px"} overflow="scroll">
          <div style={{marginBottom:0, marginTop:0,background:"#BAC5EF"}}>
            <h2 style={{marginBottom:0, marginTop:0, fontSize:16,}}>Script Navigation</h2>
            {screenplay && <Timeline doc={screenplay.document} height={TIMELINE_HEIGHT} onClick={(scene) => {
              scrollStoryEditorTo(editorRef, scene.id);
            }} />}
          </div>
        </Grid>
        <Grid container height={`calc(100vh - ${TIMELINE_HEIGHT}px)`} overflow="scroll">
          <Grid size={6}>
            <div id="buttonHeader" style={{height:"10%"}}> 
              <h3>Drama - Visualization</h3>
              <Button variant="contained" startIcon={<FilterListIcon/>} size="large"></Button>
              <Button variant="contained">Relationship - Overview</Button>
              <Button variant="contained">Location - Overview</Button>
            </div>
            <div id="content" style={{background:"#e0e0e0ff", height:"90%"}}>
              Visualisations will be here soon!
              You've read {(editorOffset * 100).toFixed(2)}% of the script.
            </div>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                You've read {(editorOffset * 100).toFixed(2)}% of the script.
              </Typography>

              {screenplay ? (
                <StackedChart
                  doc={screenplay.document}
                  locations={screenplay.locations}
                  characters={screenplay.characters}
                  onSceneClick={(sceneId) => scrollStoryEditorTo(editorRef, sceneId)}
                />
              ) : (
                <Typography variant="body2">
                  Load a screenplay to explore dialogue.
                </Typography>
              )}
            </Stack>
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
