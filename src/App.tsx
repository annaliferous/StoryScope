import { useRef, useState } from "react";
import { useScreenplay } from "./hooks/useScreenplay";
import WelcomeDialog from "./components/WelcomeDialog";
import { Grid, Stack, Typography } from "@mui/material";
import { scrollStoryEditorTo, StoryEditor } from "./components/StoryEditor";
import { Timeline } from "./components/Timeline";
import StackedChart from "./components/StackedChart";
import NetworkGraph from "./components/NetworkGraph";

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
        <Grid
          size={12}
          padding={0}
          height={TIMELINE_HEIGHT + "px"}
          overflow="scroll"
        >
          {screenplay && (
            <Timeline
              doc={screenplay.document}
              height={TIMELINE_HEIGHT}
              onClick={(scene) => {
                scrollStoryEditorTo(editorRef, scene.id);
              }}
            />
          )}
        </Grid>
        <Grid
          container
          height={`calc(100vh - ${TIMELINE_HEIGHT}px)`}
          overflow="scroll"
        >
          <Grid size={6} padding={2}>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                You've read {(editorOffset * 100).toFixed(2)}% of the script.
              </Typography>

              {screenplay ? (
                <div>
                  <StackedChart
                    doc={screenplay.document}
                    locations={screenplay.locations}
                    characters={screenplay.characters}
                    onSceneClick={(sceneId) =>
                      scrollStoryEditorTo(editorRef, sceneId)
                    }
                  />
                  <NetworkGraph
                    doc={screenplay.document}
                    locations={screenplay.locations}
                    characters={screenplay.characters}
                  />
                </div>
              ) : (
                <Typography variant="body2">
                  Load a screenplay to explore dialogue.
                </Typography>
              )}
            </Stack>
          </Grid>
          <Grid size={6} height={`calc(100vh - ${TIMELINE_HEIGHT}px)`}>
            {screenplay && (
              <StoryEditor
                ref={editorRef}
                doc={screenplay.document}
                onChange={console.log}
                onScroll={setEditorOffset}
              />
            )}
          </Grid>
        </Grid>
      </Stack>
    </>
  );
}

export default App;
