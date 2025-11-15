import { useState } from "react";
import "./App.css";
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
      {JSON.stringify(screenplay)}
      <Grid container spacing={2}>
        <Grid size={6}>
          <div>size=8</div>
        </Grid>
        <Grid size={6}>
          {screenplay && <StoryEditor doc={screenplay.document} onChange={console.log} />}
        </Grid>
      </Grid>
    </>
  );
}

export default App;
