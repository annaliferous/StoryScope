import { useState } from "react";
import { useScreenplay } from "./hooks/useScreenplay";
import WelcomeDialog from "./components/WelcomeDialog";
import { Grid } from "@mui/material";
import { StoryEditor } from "./components/StoryEditor";

function App() {
  const [fdxFileUrl, setFdxFileUrl] = useState<string>();
  const screenplay = useScreenplay(fdxFileUrl); // use this for information processing

  return (
    <>
      <WelcomeDialog isOpen={!fdxFileUrl} onChange={setFdxFileUrl} />
      <Grid container spacing={2} height="100vh" overflow="scroll">
        <Grid size={12} position="sticky" top={0}>
          <div>
            {JSON.stringify(screenplay)}
          </div>
        </Grid>
        <Grid size={6}>
          <div>
            size=6
          </div>
        </Grid>
        <Grid size={6}>
          {screenplay && <StoryEditor doc={screenplay.document} onChange={console.log} />}
        </Grid>
      </Grid>
    </>
  );
}

export default App;
