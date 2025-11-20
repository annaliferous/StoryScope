import { useEffect, useMemo, useRef, useState } from "react";
import { useScreenplay } from "./hooks/useScreenplay";
import WelcomeDialog from "./components/WelcomeDialog";
import { FormControl, Grid, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { scrollStoryEditorTo, StoryEditor } from "./components/StoryEditor";
import { Timeline } from "./components/Timeline";
import StackedChart from "./components/StackedChart";

const TIMELINE_HEIGHT = 64;

function App() {
  const [fdxFileUrl, setFdxFileUrl] = useState<string>();
  const [editorOffset, setEditorOffset] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState("");
  // Needed for hijacking scrolling behaviour of the StoryEditor
  const editorRef = useRef<HTMLDivElement>(null);
  const screenplay = useScreenplay(fdxFileUrl); // use this for information processing
  const locations = useMemo(
    () => (screenplay ? Array.from(screenplay.locations).sort() : []),
    [screenplay]
  );

  useEffect(() => {
    if (!screenplay) return;
    if (locations.length === 0) return;
    if (!selectedLocation || !locations.includes(selectedLocation)) {
      setSelectedLocation(locations[0]);
    }
  }, [locations, screenplay, selectedLocation]);

  return (
    <>
      <WelcomeDialog isOpen={!fdxFileUrl} onChange={setFdxFileUrl} />
      <Stack>
        <Grid size={12} padding={0} height={TIMELINE_HEIGHT + "px"} overflow="scroll">
          {screenplay && <Timeline doc={screenplay.document} height={TIMELINE_HEIGHT} onClick={(scene) => {
            scrollStoryEditorTo(editorRef, scene.id);
          }} />}
        </Grid>
        <Grid container height={`calc(100vh - ${TIMELINE_HEIGHT}px)`} overflow="scroll">
          <Grid size={6} padding={2}>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                You've read {(editorOffset * 100).toFixed(2)}% of the script.
              </Typography>

              <FormControl fullWidth size="small" disabled={locations.length === 0}>
                <InputLabel id="location-select-label">Location</InputLabel>
                <Select
                  labelId="location-select-label"
                  label="Location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  {locations.map((location) => (
                    <MenuItem key={location} value={location}>
                      {location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {screenplay && selectedLocation ? (
                <StackedChart doc={screenplay.document} location={selectedLocation} />
              ) : (
                <Typography variant="body2">
                  Load a screenplay and choose a location to see who speaks there.
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
