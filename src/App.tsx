import { useRef, useState } from "react";
import { useScreenplay } from "./hooks/useScreenplay";
import WelcomeDialog from "./components/WelcomeDialog";
import { Fab, Grid, Stack, Typography } from "@mui/material";
import { scrollStoryEditorTo, StoryEditor } from "./components/StoryEditor";
import { Timeline } from "./components/Timeline";
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import React from "react";
// import LocationVis from "./pages/LocationVis";
import StackedChart from "./components/StackedChart";
import FilterListIcon from '@mui/icons-material/FilterList';


const TIMELINE_HEIGHT = 64;

function App() {
  const [fdxFileUrl, setFdxFileUrl] = useState<string>();
  const [editorOffset, setEditorOffset] = useState(0);
  // Needed for hijacking scrolling behaviour of the StoryEditor
  const editorRef = useRef<HTMLDivElement>(null);
  const screenplay = useScreenplay(fdxFileUrl); // use this for information processing

  const [value, setValue] = React.useState('1');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

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
          <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Fab color="primary" aria-label="add" sx={{ mr: 1 }} size="small" style={{left:8}}>
                  <FilterListIcon />
                </Fab>
                <TabList onChange={handleChange} aria-label="lab API tabs example">
                  <Tab label="Relationship - Overview" value="1" />
                  <Tab label="Location - Overview" value="2" />
                </TabList>
              </Box>

              <TabPanel value="1" style={{background:"#e0e0e0ff", height:"100%"}}>
                <p>Relationships</p>
              </TabPanel>
              
              <TabPanel value="2" style={{background:"#e0e0e0ff", height:"100%"}}>
                  <Grid size={12}>
                    <div id="content-background" style={{background:"#e0e0e0ff", height:"90%"}}>
                      <Stack spacing={2} style={{background:"white", padding:24, margin:56}}>
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
                    </div>
                  </Grid>
              </TabPanel>
            </TabContext>
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
