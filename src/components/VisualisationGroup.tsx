import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Backdrop, Box, Grid, Tab, Typography } from "@mui/material";
import { useState } from "react";
import StackedChart from "./StackedChart";
import type { Screenplay } from "../hooks/useScreenplay";
import { CharacterHeatmap } from "./CharacterHeatmap";
import type { SceneInfo } from "../hooks/useTimeline";
import {
  Diversity1,
  LocationPin,
  SentimentDissatisfied,
  DocumentScanner,
  BurstMode
} from "@mui/icons-material";
import { scrollToScene } from "../utils/scroll";
import NetworkGraph from "./NetworkGraph";
import "../index.css";

enum VisGroup {
  relationship,
  location,
  sentiment,
}

export function VisualisationGroup({
  currentScene,
  screenplay,
}: {
  currentScene?: SceneInfo;
  screenplay?: Screenplay;
}) {
  const [activeGroup, setActiveGroup] = useState(VisGroup.location);

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveGroup(Number(newValue));
  };

  return (
    <TabContext value={String(activeGroup)}>
      <Grid container height="100%">
        {/* Sidebar */}
        <Grid
          width={88}
          height="100%"
          bgcolor="#e8eaf6"
          color="#1a237e"
          display="flow"
          justifyContent="center"
          
        >
          <TabList
            textColor="inherit"
            orientation="vertical"
            onChange={handleChange}
            aria-label="Category Selection"
            sx={{ paddingTop: 2 }}
          >
            <Tab unselectable="on" icon={<DocumentScanner width={20}></DocumentScanner>} disabled>
            </Tab>
            <Tab value={String(VisGroup.location)} icon={<LocationPin ></LocationPin>} style={{background:'#ffffff', borderRadius: '8px'}} ></Tab>
            <Tab unselectable="on" icon={<BurstMode></BurstMode>} disabled></Tab>
            <Tab value={String(VisGroup.relationship)} icon={<Diversity1></Diversity1>} style={{background:'#ffffff', borderRadius: '8px', borderBottomLeftRadius:'0px', borderBottomRightRadius:'0px'}}></Tab>
            <Tab value={String(VisGroup.sentiment)} icon={<SentimentDissatisfied></SentimentDissatisfied>} style={{background:'#ffffff', borderRadius: '8px', borderTopLeftRadius:'0px', borderTopRightRadius:'0px'}}></Tab>
          </TabList>
        </Grid>
            {/* {[
              {
                icon: <LocationPin />,
                value: VisGroup.location,
                label: "Locations",
              },
              {
                icon:<BurstMode/>,
                label: "Applied to Scenes"
              },
              {
                icon: <Diversity1 />,
                value: VisGroup.relationship,
                label: "Relationships",
              },
              {
                icon: <SentimentDissatisfied />,
                value: VisGroup.sentiment,
                label: "Scene Sentiment",
              },
            ].map(({ icon, value, label }) => (
              <Tab
                key={value}
                aria-label={label}
                icon={icon}
                value={String(value)}
                sx={{
                  minWidth: 64,
                  height: 40
                }}
              />
            ))}
          </TabList>
        </Grid> */}

        {/* Content */}
        <Grid
          flex={1}
          color="white"
          bgcolor="#ffffff"
          borderRadius={"8px"}
          margin={"4px"}
        >
          <TabPanel value={String(VisGroup.relationship)}>
            <Typography fontWeight="bold" color="#1a237e">Relationship Graph</Typography>
            <hr style={{ border: "solid 1px #e8eaf6" }} />
            {screenplay ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <NetworkGraph
                  //characters={screenplay.characters}
                  //edges={screenplay.edges!}
                  scene={currentScene}
                  screenplay={screenplay}
                />
              </div>
            ) : (
              <Typography variant="body2">
                Load a screenplay to explore dialogue.
              </Typography>
            )}
          </TabPanel>

          <TabPanel value={String(VisGroup.location)}>
            <Typography fontWeight="bold" color="#1a237e">Location Occurrences</Typography>
            <hr style={{ border: "solid 1px #e8eaf6" }} />
            <Box p={1}>
              {screenplay ? (
                <StackedChart
                  doc={screenplay.document}
                  locations={screenplay.locations}
                  characters={screenplay.characters}
                  onSceneClick={(sceneId) => {
                    scrollToScene(sceneId);
                  }}
                />
              ) : (
                <Typography variant="body2">
                  Load a screenplay to explore dialogue.
                </Typography>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={String(VisGroup.sentiment)}>
            <Typography fontWeight="bold" color="#1a237e">Sentiment Matrix</Typography>
            <hr style={{ border: "solid 1px #e8eaf6" }} />
            <CharacterHeatmap scene={currentScene} screenplay={screenplay} />
          </TabPanel>
        </Grid>
      </Grid>
    </TabContext>
  );
}
