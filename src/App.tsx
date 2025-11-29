import { useRef, useState } from "react";
import { useScreenplay } from "./hooks/useScreenplay";
import WelcomeDialog from "./components/WelcomeDialog";
import { Fab, Grid, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { scrollStoryEditorTo, StoryEditor } from "./components/StoryEditor";
import { Timeline } from "./components/Timeline";
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import React from "react";
import StackedChart from "./components/StackedChart";
import FilterListIcon from '@mui/icons-material/FilterList';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { deepPurple, indigo, teal } from '@mui/material/colors';
import './index.css';

const TIMELINE_HEIGHT = 80;

function App() {
  const [fdxFileUrl, setFdxFileUrl] = useState<string>();
  const [editorOffset, setEditorOffset] = useState(0);
  // Needed for hijacking scrolling behaviour of the StoryEditor
  const editorRef = useRef<HTMLDivElement>(null);
  const screenplay = useScreenplay(fdxFileUrl); // use this for information processing

  const [value, setValue] = React.useState('1');
  const [filterMenuAnchor, setFilterMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [selectedFilter, setSelectedFilter] = React.useState<string>('all');
  const [welcomeDialogOpen, setWelcomeDialogOpen] = React.useState(false);

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterMenuAnchor(null);
  };

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    handleFilterClose();
  };

  return (
    <>
      <WelcomeDialog isOpen={welcomeDialogOpen} onChange={(url) => { setFdxFileUrl(url); setWelcomeDialogOpen(false); }} />
      <Stack>
        <Grid>
          <div style={{textAlign:"center", background:indigo[900], margin:0,padding:2, color:"white"}}>
            <h1>StoryScope - Visualize Your Drama!</h1>
          </div>
        </Grid>
        <Grid>
          <div style={{background:indigo[100], margin:0,padding:16}}>
            <Fab variant="extended" aria-label="add" sx={{ mr: 1, bgcolor: teal[100], color: teal[900], left:'24px' }}  size="medium" onClick={() => setWelcomeDialogOpen(true)}>
              <UploadFileIcon sx={{mr:1}} /> Upload File
            </Fab>
          </div>
        </Grid>
        <Grid size={12} padding={0} height={TIMELINE_HEIGHT*1.6 + "px"} sx={{ overflowX: 'auto', overflowY: 'hidden'}}>
          <div style={{marginBottom:0, marginTop:0,paddingBottom:16, paddingTop:8, background:indigo[50], minWidth: '100%', display: 'flex', flexDirection: 'column'}}>
            <h3 style={{marginBottom:0, marginTop:0, fontSize:16, fontWeight: 'normal' }}>Scene Overview</h3>
            {screenplay && <Timeline doc={screenplay.document} height={TIMELINE_HEIGHT} width={2400} onClick={(scene) => {
              scrollStoryEditorTo(editorRef, scene.id);
            }} />}
          </div>
        </Grid>
        <Grid container height={`calc(100vh - ${TIMELINE_HEIGHT}px)`} overflow="scroll">
          <Grid size={6} style={{background:indigo[50], padding:8}}>
          <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Fab aria-label="add" sx={{ mr: 1, bgcolor: teal[100], color: teal[900] }} size="small" onClick={handleFilterClick}>
                  <FilterListIcon />
                </Fab>
                <Menu
                  anchorEl={filterMenuAnchor}
                  open={Boolean(filterMenuAnchor)}
                  onClose={handleFilterClose}
                >
                  <MenuItem selected={selectedFilter === 'all'} onClick={() => handleFilterSelect('all')} >All Scenes</MenuItem>
                  <MenuItem selected={selectedFilter === 'dialogue'} onClick={() => handleFilterSelect('dialogue')}>Dialogue Only</MenuItem>
                  <MenuItem selected={selectedFilter === 'action'} onClick={() => handleFilterSelect('action')}>Action Only</MenuItem>
                </Menu>
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
