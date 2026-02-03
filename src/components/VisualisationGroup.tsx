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
import { VisualisationGroupHeader } from "./VisualisationGroupHeader";

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
      <Grid container height="100%" sx={{ paddingX: "4px" }}>
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
            sx={{ marginY: 1 }}
          >
            {/* Global Story Analysis section (currently disabled) */}
            <Tooltip title="Location Occurrences (Applies to Script)" placement="right" arrow>
              <Tab
                value={String(VisGroup.location)}
                icon={<LocationPin></LocationPin>}
                style={{ background: "#ffffff", borderRadius: "8px" }}
              ></Tab>
            </Tooltip>
            <div style={{ height: 8 }} />

            {/* Scene-specific Analysis section */}
            <Tooltip title="Relationship Graph (Applies to Scene)" placement="right" arrow>
              <Tab
                value={String(VisGroup.relationship)}
                icon={<Diversity1 />}
                style={{
                  background: "#ffffff",
                  borderRadius: "8px 8px 0 0",
                }}
              ></Tab>
            </Tooltip>
            <Tooltip title="Character Heatmap (Applies to Scene)" placement="right" arrow>
              <Tab
                value={String(VisGroup.sentiment)}
                icon={<SentimentDissatisfied />}
                style={{
                  background: "#ffffff",
                  borderRadius: "0 0 8px 8px",
                }}
              ></Tab>
            </Tooltip>
          </TabList>
        </Grid>

        {/* Main Content Area */}
        <Grid
          height={"100%"}
          flex={1}
          color="white"
          bgcolor="#ffffff"
          borderRadius={"8px"}
          marginX={"4px"}
          sx={{ color: "text.primary" }}
        >
          {/* Relationship Network Graph Tab */}
          <TabPanel
            value={String(VisGroup.relationship)}
            style={{ height: "100%", padding: 0 }}>
            <VisualisationGroupHeader title="Relationship Graph" />
            {screenplay ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
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
            style={{ height: "100%", overflowY: "auto", padding: 0 }}
          >
            <VisualisationGroupHeader title="Location Occurrences" />
            <Box p={2}>
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
          <TabPanel
            value={String(VisGroup.sentiment)}
            style={{ height: "100%", overflowY: "auto", padding: 0 }}
          >
            <VisualisationGroupHeader title="Character Heatmap" />
            {/* Note: Can be updated to support multiple scenes in the future */}
            <CharacterHeatmap sceneIds={selectedSceneIds} scene={currentScene} screenplay={screenplay} />
          </TabPanel>
        </Grid>
      </Grid>
    </TabContext>
  );
}
