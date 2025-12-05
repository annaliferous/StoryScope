// removed incorrect Palette import — using local `palette` array instead
import {
  Box,
  createTheme,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { deepPurple, indigo, teal } from "@mui/material/colors";
import { BarChart } from "@mui/x-charts/BarChart";
import { useEffect, useMemo, useState } from "react";

export type ChartMode = "location" | "character";

interface StackedChartProps {
  doc: XMLDocument;
  locations: Set<string>;
  characters: Set<string>;
  height?: number;
  onSceneClick?: (sceneId: string) => void;
}

interface StackedChartChartProps {
  doc: XMLDocument;
  mode: ChartMode;
  location?: string;
  character?: string;
  height?: number;
  onSceneClick?: (sceneId: string) => void;
}

type ChartDatum = {
  sceneIndex: number;
  sceneLabel: string;
  sceneId: string;
  [key: string]: string | number;
};

type SceneState = {
  currentSceneLocation?: string;
  currentSceneLabel: string;
  currentSceneIndex: number;
  currentSceneId: string;
  currentCounts: Map<string, number>;
};

function createScenePusher(
  dataset: ChartDatum[],
  bucketSet: Set<string>,
  shouldIncludeScene?: (state: SceneState) => boolean
) {
  return (state: SceneState) => {
    if (!state.currentSceneLocation) return;
    if (state.currentCounts.size === 0) return;
    if (shouldIncludeScene && !shouldIncludeScene(state)) return;

    const datum: ChartDatum = {
      sceneIndex: state.currentSceneIndex,
      sceneLabel: state.currentSceneLabel,
      sceneId: state.currentSceneId,
    };

    for (const [bucket, total] of state.currentCounts.entries()) {
      datum[bucket] = total;
      bucketSet.add(bucket);
    }

    dataset.push(datum);
  };
}

function normalizeCharacterName(raw: string | null | undefined) {
  if (!raw) return undefined;
  return raw.replace(/\(.*?\)/g, "").trim().toUpperCase();
}

function extractLocation(heading: string | null | undefined) {
  if (!heading) return undefined;
  const parts = heading.trim().split(/\. | - /);
  if (parts.length < 2) return undefined;
  return parts[1]?.trim();
}

function countWords(text: string | null | undefined) {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildLocationDataset(doc: XMLDocument, targetLocation: string) {
  const paragraphs = Array.from(doc.getElementsByTagName("Paragraph"));
  const dataset: ChartDatum[] = [];
  const characters = new Set<string>();

  let currentSceneLocation: string | undefined;
  let currentSceneLabel = "";
  let currentSceneIndex = 0;
  let currentSceneId = "";
  let currentSpeaker: string | undefined;
  let currentCounts = new Map<string, number>();

  const normalizedTarget = targetLocation.trim().toLowerCase();

  const pushSceneIfNeeded = createScenePusher(
    dataset,
    characters,
    ({ currentSceneLocation }) =>
      currentSceneLocation?.trim().toLowerCase() === normalizedTarget
  );
  const pushCurrentScene = () =>
    pushSceneIfNeeded({
      currentSceneLocation,
      currentSceneIndex,
      currentSceneLabel,
      currentSceneId,
      currentCounts,
    });

  for (const paragraph of paragraphs) {
    const type = paragraph.getAttribute("Type");

    if (type === "Scene Heading") {
      pushCurrentScene();
      currentSceneIndex += 1;
      currentSceneLabel = paragraph.textContent?.trim() || "";
      currentSceneId = paragraph.id || `scene-${currentSceneIndex}`;
      currentSceneLocation = extractLocation(currentSceneLabel);
      currentCounts = new Map<string, number>();
      currentSpeaker = undefined;
      continue;
    }

    // Skip everything until we have entered a scene.
    if (!currentSceneLocation) continue;

    if (type === "Character") {
      currentSpeaker = normalizeCharacterName(paragraph.textContent);
      continue;
    }

    if (type === "Dialogue") {
      if (!currentSpeaker) continue;
      if (currentSceneLocation.trim().toLowerCase() !== normalizedTarget)
        continue;

      const amount = countWords(paragraph.textContent);
      currentCounts.set(
        currentSpeaker,
        (currentCounts.get(currentSpeaker) || 0) + amount
      );
    }
  }

  pushCurrentScene();

  return {
    dataset,
    characters: Array.from(characters).sort(),
  };
}

function buildCharacterDataset(doc: XMLDocument, targetCharacter: string) {
  const paragraphs = Array.from(doc.getElementsByTagName("Paragraph"));
  const dataset: ChartDatum[] = [];
  const locations = new Set<string>();

  let currentSceneLocation: string | undefined;
  let currentSceneLabel = "";
  let currentSceneIndex = 0;
  let currentSceneId = "";
  let currentSpeaker: string | undefined;
  let currentCounts = new Map<string, number>();

  const normalizedTarget = normalizeCharacterName(targetCharacter);
  if (!normalizedTarget) {
    return { dataset: [], locations: [] };
  }

  const pushSceneIfNeeded = createScenePusher(dataset, locations);
  const pushCurrentScene = () =>
    pushSceneIfNeeded({
      currentSceneLocation,
      currentSceneIndex,
      currentSceneLabel,
      currentSceneId,
      currentCounts,
    });

  for (const paragraph of paragraphs) {
    const type = paragraph.getAttribute("Type");

    if (type === "Scene Heading") {
      pushCurrentScene();
      currentSceneIndex += 1;
      currentSceneLabel = paragraph.textContent?.trim() || "";
      currentSceneId = paragraph.id || `scene-${currentSceneIndex}`;
      currentSceneLocation = extractLocation(currentSceneLabel) || "Unknown";
      currentCounts = new Map<string, number>();
      currentSpeaker = undefined;
      continue;
    }

    if (!currentSceneLocation) continue;

    if (type === "Character") {
      currentSpeaker = normalizeCharacterName(paragraph.textContent);
      continue;
    }

    if (type === "Dialogue") {
      if (!currentSpeaker) continue;
      if (currentSpeaker !== normalizedTarget) continue;
      const amount = countWords(paragraph.textContent);
      currentCounts.set(
        currentSceneLocation,
        (currentCounts.get(currentSceneLocation) || 0) + amount
      );
    }
  }

  pushCurrentScene();

  return {
    dataset,
    locations: Array.from(locations).sort(),
  };
}

function StackedChartChart({
  doc,
  mode,
  location,
  character,
  height = 360,
  onSceneClick,
}: StackedChartChartProps) {
  const theme = createTheme({
          palette: {
              primary: {
              main: indigo[500],
              light: indigo[300],
              dark: indigo[700],
              },
              secondary: {
              main: teal[300],
              light: teal[100],
              dark: teal[500],
              },
              info:{
                  main: deepPurple[300],
                  light: deepPurple[400],
                  dark: deepPurple[600],
              }
              
          }
  });
  const palette = [theme.palette.primary.main, theme.palette.primary.light, theme.palette.primary.dark,theme.palette.secondary.main, theme.palette.secondary.light, theme.palette.secondary.dark,theme.palette.info.main, theme.palette.info.light, theme.palette.info.dark ];
  const { dataset, seriesKeys, emptyLabel } = useMemo(() => {
    if (mode === "character" && character) {
      const { dataset, locations } = buildCharacterDataset(doc, character);
      return {
        dataset,
        seriesKeys: locations,
        emptyLabel: `No dialogue found for ${character}`,
      };
    }
    if (mode === "location" && location) {
      const { dataset, characters } = buildLocationDataset(doc, location);
      return {
        dataset,
        seriesKeys: characters,
        emptyLabel: `No dialogue found for ${location}`,
      };
    }
    return { dataset: [], seriesKeys: [], emptyLabel: "" };
  }, [character, doc, location, mode]);

  const selectionLabel =
    mode === "location" ? location : mode === "character" ? character : undefined;

  if (!selectionLabel) {
    return (
      <Typography variant="body2">
        Pick a {mode === "location" ? "location" : "character"} to see the
        breakdown.
      </Typography>
    );
  }

  if (dataset.length === 0) {
    return <Typography variant="body2">{emptyLabel}.</Typography>;
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {mode === "location"
          ? `Dialogue per character at ${selectionLabel}`
          : `Locations for ${selectionLabel}`}
      </Typography>
      <BarChart
        dataset={dataset}
        yAxis={[
          {
            label: "Words",
          },
        ]}
        xAxis={[
          {
            dataKey: "sceneIndex",
            scaleType: "band",
            label: "Scene order",
            valueFormatter: (value) => `${Math.round(Number(value))}`,
          },
        ]}
        series={seriesKeys.map((key, idx) => ({
          dataKey: key,
          label: key,
          stack: "dialogue",
          color: palette[idx % palette.length],
        }))}
        height={height}
        slotProps={{
          tooltip: { trigger: "item" },
        }}
        onItemClick={(_, item) => {
          if (!onSceneClick) return;
          if (item.dataIndex == null) return;
          const scene = dataset[item.dataIndex];
          if (scene?.sceneId) onSceneClick(scene.sceneId);
        }}
      />
    </Box>
  );
}

export default function StackedChart({
  doc,
  locations,
  characters,
  height,
  onSceneClick,
}: StackedChartProps) {
  const [mode, setMode] = useState<ChartMode>("location");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState("");

  const locationOptions = useMemo(
    () => Array.from(locations).sort(),
    [locations]
  );
  const characterOptions = useMemo(
    () => Array.from(characters).sort(),
    [characters]
  );

  useEffect(() => {
    if (locationOptions.length === 0) return;
    if (
      !selectedLocation ||
      !locationOptions.includes(selectedLocation)
    ) {
      setSelectedLocation(locationOptions[0]);
    }
  }, [locationOptions, selectedLocation]);

  useEffect(() => {
    if (characterOptions.length === 0) return;
    if (
      !selectedCharacter ||
      !characterOptions.includes(selectedCharacter)
    ) {
      setSelectedCharacter(characterOptions[0]);
    }
  }, [characterOptions, selectedCharacter]);

  return (
    <Stack spacing={2}>
      <Tabs
        value={mode}
        onChange={(_, value) => setMode(value as ChartMode)}
        variant="fullWidth"
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
        <Tab value="location" label="By location" />
        <Tab value="character" label="By character" />
      </Tabs>

      {mode === "location" ? (
        <FormControl
          fullWidth
          size="small"
          disabled={locationOptions.length === 0}
        >
          <InputLabel id="location-select-label">Location</InputLabel>
          <Select
            labelId="location-select-label"
            label="Location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            {locationOptions.map((locationOption) => (
              <MenuItem key={locationOption} value={locationOption}>
                {locationOption}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <FormControl
          fullWidth
          size="small"
          disabled={characterOptions.length === 0}
        >
          <InputLabel id="character-select-label">Character</InputLabel>
          <Select
            labelId="character-select-label"
            label="Character"
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(e.target.value)}
          >
            {characterOptions.map((characterOption) => (
              <MenuItem key={characterOption} value={characterOption}>
                {characterOption}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <StackedChartChart
        doc={doc}
        mode={mode}
        location={mode === "location" ? selectedLocation : undefined}
        character={mode === "character" ? selectedCharacter : undefined}
        onSceneClick={onSceneClick}
        height={height}
      />
    </Stack>
  );
}
