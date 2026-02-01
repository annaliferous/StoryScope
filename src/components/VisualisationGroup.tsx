import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Grid, Tab, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import LocationDialogueShareChart from "./LocationDialogueShareChart";
import type { Screenplay } from "../hooks/useScreenplay";
import { CharacterHeatmap } from "./CharacterHeatmap";
import type { SceneInfo } from "../hooks/useTimeline";
import {
  Diversity1,
  LocationPin,
  SentimentDissatisfied,
  ImportContacts,
  AutoAwesomeMotion,
} from "@mui/icons-material";
import { scrollToScene } from "../utils/scroll";
import NetworkGraph from "./NetworkGraph";
import "../index.css";

// Enum to manage the different visualization tabs
enum VisGroup {
  relationship,
  location,
  sentiment,
}

export function VisualisationGroup({
  currentScene,
  screenplay,
  selectedSceneIds,
}: {
  currentScene?: SceneInfo;
  screenplay?: Screenplay;
  selectedSceneIds: string[];
}) {
  const [activeGroup, setActiveGroup] = useState(VisGroup.location);

  // Handle tab switching
  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveGroup(Number(newValue));
  };

  return (
    <TabContext value={String(activeGroup)}>
      <Grid container height="100%">
        {/* Sidebar Navigation */}
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
            {/* Global Story Analysis section (currently disabled) */}
            <Tooltip title="Applies to Story" placement="top" arrow>
              <span>
                <Tab
                  unselectable="on"
                  icon={<ImportContacts width={20}></ImportContacts>}
                  disabled
                ></Tab>
              </span>
            </Tooltip>
            <Tab
              value={String(VisGroup.location)}
              icon={<LocationPin></LocationPin>}
              style={{ background: "#ffffff", borderRadius: "8px" }}
            ></Tab>

            {/* Scene-specific Analysis section */}
            <Tooltip title="Applies to Scenes" placement="top" arrow>
              <span>
                <Tab
                  unselectable="on"
                  icon={<AutoAwesomeMotion></AutoAwesomeMotion>}
                  disabled
                ></Tab>
              </span>
            </Tooltip>
            <Tab
              value={String(VisGroup.relationship)}
              icon={<Diversity1></Diversity1>}
              style={{
                background: "#ffffff",
                borderRadius: "8px",
                borderBottomLeftRadius: "0px",
                borderBottomRightRadius: "0px",
              }}
            ></Tab>
            <Tab
              value={String(VisGroup.sentiment)}
              icon={<SentimentDissatisfied></SentimentDissatisfied>}
              style={{
                background: "#ffffff",
                borderRadius: "8px",
                borderTopLeftRadius: "0px",
                borderTopRightRadius: "0px",
              }}
            ></Tab>
          </TabList>
        </Grid>

        {/* Main Content Area */}
        <Grid
          flex={1}
          color="white"
          bgcolor="#ffffff"
          borderRadius={"8px"}
          margin={"4px"}
          sx={{ color: "text.primary" }}
        >
          {/* Relationship Network Graph Tab */}
          <TabPanel value={String(VisGroup.relationship)}>
            <Typography fontWeight="bold" color="#1a237e">
              Relationship Graph
            </Typography>
            <hr style={{ border: "solid 1px #e8eaf6" }} />
            {screenplay ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {/* Passes selectedSceneIds for multi-scene relationship analysis */}
                <NetworkGraph
                  sceneIds={selectedSceneIds}
                  screenplay={screenplay}
                />
              </div>
            ) : (
              <Typography variant="body2">
                Load a screenplay to explore dialogue.
              </Typography>
            )}
          </TabPanel>

          {/* Location Statistics Tab */}
          <TabPanel
            value={String(VisGroup.location)}
            style={{ height: "80%", overflowY: "auto" }}
          >
            <Typography fontWeight="bold" color="#1a237e">
              Location Occurrences
            </Typography>
            <hr style={{ border: "solid 1px #e8eaf6" }} />
            <Box p={1}>
              {screenplay ? (
                <LocationDialogueShareChart
                  doc={screenplay.document}
                  locations={screenplay.locations}
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

          {/* Sentiment Heatmap Tab */}
          <TabPanel value={String(VisGroup.sentiment)}>
            <Typography fontWeight="bold" color="#1a237e">
              Sentiment Matrix
            </Typography>
            <hr style={{ border: "solid 1px #e8eaf6" }} />
            {/* Note: Can be updated to support multiple scenes in the future */}
            <CharacterHeatmap scene={currentScene} screenplay={screenplay} />
          </TabPanel>
        </Grid>
      </Grid>
    </TabContext>
  );
}
