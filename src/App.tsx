import { useRef, useState } from "react";
import { useScreenplay } from "./hooks/useScreenplay";
import WelcomeDialog from "./components/WelcomeDialog";
import { Grid, Stack, Typography } from "@mui/material";
import { scrollStoryEditorTo, StoryEditor } from "./components/StoryEditor";
import { Timeline } from "./components/Timeline";
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import React from "react";
import StackedChart from "./components/StackedChart";
import { deepPurple, indigo } from '@mui/material/colors';
import './index.css';
import { Header } from "./components/Header";

const TIMELINE_HEIGHT = 80;

function App() {
  const [fdxFileUrl, setFdxFileUrl] = useState<string>();
  const [editorOffset, setEditorOffset] = useState(0);
  // Needed for hijacking scrolling behaviour of the StoryEditor
  const editorRef = useRef<HTMLDivElement>(null);
  const screenplay = useScreenplay(fdxFileUrl); // use this for information processing
  const [currentScene, setCurrentScene] = useState<SceneInfo>();

  const [value, setValue] = React.useState('1');
  const [welcomeDialogOpen, setWelcomeDialogOpen] = React.useState(true);

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <>
      <WelcomeDialog isOpen={welcomeDialogOpen} onChange={(url) => { setFdxFileUrl(url); setWelcomeDialogOpen(false); }} />
      <Stack>
        <Header onActionClick={() => {
          setWelcomeDialogOpen(true);
        }} />
        <Grid size={12} padding={0} height={TIMELINE_HEIGHT * 1.6 + "px"} sx={{ overflowX: 'auto', overflowY: 'hidden', background: indigo[50] }}>
          <Typography marginLeft={3} paddingTop={1}>
            Scene Overview
          </Typography>
          {screenplay && <Timeline doc={screenplay.document} height={TIMELINE_HEIGHT} onClick={(scene) => {
            scrollStoryEditorTo(editorRef, scene.id);
          }} />}
        </Grid>
        <Grid container height={`calc(100vh - ${TIMELINE_HEIGHT}px)`} overflow="auto">
          <Grid size={6} style={{ background: indigo[50], padding: 8 }}>
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <TabList
                  onChange={handleChange}
                  aria-label="lab API tabs example"
                  sx={{
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontFamily: 'Inter, Arial, sans-serif',
                      color: deepPurple[900],
                      fontWeight: 600,
                    },
                    '& .Mui-selected': {
                      color: `${deepPurple[900]} !important`,
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: deepPurple[900],
                    }
                  }}
                >
                  <Tab label="Relationship - Overview" value="1" />
                  <Tab label="Location - Overview" value="2" />
                </TabList>
              </Box>

              <TabPanel value="1" style={{ background: "#e0e0e0ff", height: "100%" }}>
                <p>Relationships</p>
              </TabPanel>

              <TabPanel value="2" style={{ background: "#e0e0e0ff", height: "100%", padding: 0 }}>
                <Grid size={12} padding={1} style={{ background: "white", width: "100%" }}>
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
