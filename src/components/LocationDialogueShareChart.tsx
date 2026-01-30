import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { useContext, useEffect, useMemo, useState } from "react";
import { getCharacterColor } from "../utils/colors";
import { CounterContext } from "../utils/counter";

interface LocationDialogueShareChartProps {
  doc: XMLDocument;
  locations: Set<string>;
  height?: number;
  onSceneClick?: (sceneId: string) => void;
}

interface LocationDialogueSharePlotProps {
  index: DialogueIndex;
  location?: string;
  showRelative: boolean;
  height?: number;
  onSceneClick?: (sceneId: string) => void;
}

type ChartDatum = {
  sceneIndex: number;
  sceneLabel: string;
  sceneId: string;
  [key: string]: string | number;
};

type SceneDialogue = {
  sceneIndex: number;
  sceneLabel: string;
  sceneId: string;
  locationForCharacter: string;
  locationNormalized?: string;
  characterCounts: Map<string, number>;
};

type DialogueIndex = {
  scenes: SceneDialogue[];
  locationsWithDialogue: Set<string>;
};

const ALL_LOCATIONS_VALUE = "__ALL_LOCATIONS__";
const ALL_LOCATIONS_LABEL = "All locations";

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


// could be made to a single function now
function formatPercentage(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "";
  return `${Math.round(value)}%`;
}

function formatWordCount(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "";
  return `${Math.round(value)}`;
}


// goes through the XMLDocument and structures the dialogue data
function buildDialogueIndex(doc: XMLDocument): DialogueIndex {
  const paragraphs = Array.from(doc.getElementsByTagName("Paragraph"));
  const scenes: SceneDialogue[] = [];
  const locationsWithDialogue = new Set<string>();

  let currentSceneIndex = 0;
  let currentScene: SceneDialogue | null = null;
  let currentSpeaker: string | undefined;

  const pushSceneIfNeeded = () => {
    if (!currentScene) return;
    if (currentScene.characterCounts.size === 0) return;
    scenes.push(currentScene);
  };

  for (const paragraph of paragraphs) {
    const type = paragraph.getAttribute("Type");

    if (type === "Scene Heading") {
      pushSceneIfNeeded();
      currentSceneIndex += 1;

      const sceneLabel = paragraph.textContent?.trim() || "";
      const sceneId = paragraph.id || `scene-${currentSceneIndex}`;
      const location = extractLocation(sceneLabel);

      currentScene = {
        sceneIndex: currentSceneIndex,
        sceneLabel,
        sceneId,
        locationForCharacter: location || "Unknown",
        locationNormalized: location ? location.trim().toLowerCase() : undefined,
        characterCounts: new Map<string, number>(),
      };
      currentSpeaker = undefined;
      continue;
    }

    if (!currentScene) continue;

    if (type === "Character") {
      currentSpeaker = normalizeCharacterName(paragraph.textContent);
      continue;
    }

    if (type === "Dialogue") {
      if (!currentSpeaker) continue;
      const amount = countWords(paragraph.textContent);
      if (amount <= 0) continue;

      currentScene.characterCounts.set(
        currentSpeaker,
        (currentScene.characterCounts.get(currentSpeaker) || 0) + amount
      );
      if (currentScene.locationNormalized) {
        locationsWithDialogue.add(currentScene.locationNormalized);
      }
    }
  }

  pushSceneIfNeeded();

  return { scenes, locationsWithDialogue };
}


// extract the needed data (for choosen location) from the formated script data to display for the chart
function buildLocationDataset(
  index: DialogueIndex,
  targetLocation?: string,
  showRelative = true
) {
  const dataset: ChartDatum[] = [];
  const characters = new Set<string>();
  const normalizedTarget = targetLocation?.trim().toLowerCase();
  const filterByLocation = Boolean(normalizedTarget);

  for (const scene of index.scenes) {
    if (filterByLocation) {
      if (!scene.locationNormalized) continue;
      if (scene.locationNormalized !== normalizedTarget) continue;
    }
    if (scene.characterCounts.size === 0) continue;

    let totalWords = 0;
    if (showRelative) {
      for (const count of scene.characterCounts.values()) {
        totalWords += count;
      }
      if (totalWords <= 0) continue;
    }

    const datum: ChartDatum = {
      sceneIndex: scene.sceneIndex,
      sceneLabel: scene.sceneLabel,
      sceneId: scene.sceneId,
    };

    for (const [character, total] of scene.characterCounts.entries()) {
      datum[character] = showRelative ? (total / totalWords) * 100 : total;
      characters.add(character);
    }

    dataset.push(datum);
  }

  return { dataset, characters: Array.from(characters).sort() };
}


// Chart component
function LocationDialogueSharePlot({
  index,
  location,
  showRelative,
  height = 360,
  onSceneClick,
}: LocationDialogueSharePlotProps) {

  const { counter } = useContext(CounterContext);
  useEffect(() => {
    console.log("LocationDialogueSharePlot counter", counter);
  }, [counter]);

  // build the data baisis for the chart
  const { dataset, characterNames, emptyLabel } = useMemo(() => {
    const { dataset, characters } = buildLocationDataset(
      index,
      location,
      showRelative
    );
    return {
      dataset,
      characterNames: characters,
      emptyLabel: location
        ? `No dialogue found for ${location}`
        : "No dialogue found in the screenplay",
    };
  }, [index, location, showRelative]);

  //disply the right label for the location
  const selectionLabel = location ?? ALL_LOCATIONS_LABEL;

  const sceneLabelByIndex = useMemo(() => {
    const map = new Map<number, string>();
    for (const datum of dataset) {
      const index = Number(datum.sceneIndex);
      if (!Number.isFinite(index)) continue;
      const label = datum.sceneLabel?.trim();
      if (label) map.set(index, label);
    }
    return map;
  }, [dataset]);

  // character series for the legend
  const [series, setSeries] = useState<
    Array<{
      dataKey: string;
      label: string;
      stack: "dialogue";
      color: string;
      valueFormatter: (value: number | null | undefined) => string | null;
    }>
  >([]);

  useEffect(() => {
    setSeries(
      characterNames.map((key) => ({
        dataKey: key,
        label: key,
        stack: "dialogue",
        color: getCharacterColor(key),
        valueFormatter: (value) =>
          value == null
            ? null
            : showRelative
              ? formatPercentage(value)
              : formatWordCount(value),
      }))
    );
  }, [counter, characterNames, showRelative]);

  if (dataset.length === 0) {
    return <Typography variant="body2">{emptyLabel}.</Typography>;
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {showRelative
          ? location
            ? `Dialogue share per scene at ${selectionLabel}`
            : "Dialogue share per scene (all locations)"
          : location
            ? `Dialogue word count per scene at ${selectionLabel}`
            : "Dialogue word count per scene (all locations)"}
      </Typography>
      <BarChart
        sx={{ "& .MuiChartsSurface-root": { position: "unset" } }}
        dataset={dataset}
        yAxis={[
          {
            label: showRelative ? "Dialogue share (%)" : "Words",
            valueFormatter: (value) =>
              showRelative ? formatPercentage(value) : formatWordCount(value),
            min: 0,
            max: showRelative ? 100 : undefined,
          },
        ]}
        xAxis={[
          {
            dataKey: "sceneIndex",
            scaleType: "band",
            label: "Scene number",
            valueFormatter: (value, context) => {
              if (context.location === "tooltip") {
                const label = sceneLabelByIndex.get(Number(value)); //display full scene label on hover
                if (label) return label;
              }
              if (context.location === "tick") {
                return context.defaultTickLabel;
              }
              const numeric = Number(value);
              return Number.isFinite(numeric)
                ? `${Math.round(numeric)}`
                : String(value ?? "");
            },
          },
        ]}
        series={series}
        height={height}
        slotProps={{
          tooltip: { trigger: "axis" },
          legend: {
            direction: "horizontal",
            position: { vertical: "bottom", horizontal: "center" },
            sx: {
              width: "100%",
              maxWidth: "100%",
              overflowX: "auto",
              overflowY: "hidden",
              flexWrap: "nowrap",
              justifyContent: "flex-start",
              whiteSpace: "nowrap",
              mx: 0,
              my: 1,
              scrollbarWidth: "none",
              scrollbarColor: "transparent transparent",
              "&::-webkit-scrollbar": {
                height: 0,
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "transparent",
                borderRadius: 999,
              },
              "&:hover": {
                scrollbarWidth: "thin",
                scrollbarColor: "#5a5a5f transparent",
              },
              "&:hover::-webkit-scrollbar": {
                height: 4,
              },
              "&:hover::-webkit-scrollbar-thumb": {
                backgroundColor: "#5a5a5f",
              },
            },
          },
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




// Final UI COMPONENT with all controls
export default function LocationDialogueShareChart({
  doc,
  locations,
  height,
  onSceneClick,
}: LocationDialogueShareChartProps) {

  //control default values
  const [selectedLocation, setSelectedLocation] = useState(
    ALL_LOCATIONS_VALUE
  );
  const [showRelative, setShowRelative] = useState(true);

  const dialogueIndex = useMemo(() => buildDialogueIndex(doc), [doc]);
  const { locationsWithDialogue } = dialogueIndex;

  //populate the select options with locations
  const locationOptions = useMemo(
    () => Array.from(locations).sort(),
    [locations]
  );
  //add the "all locations" option
  const locationOptionsWithAll = useMemo(
    () => [ALL_LOCATIONS_VALUE, ...locationOptions],
    [locationOptions]
  );

  const locationOptionsWithData = useMemo(
    () =>
      locationOptions.filter((option) =>
        locationsWithDialogue.has(option.trim().toLowerCase())
      ),
    [locationOptions, locationsWithDialogue]
  );

  useEffect(() => {
    //if "all locations" is selected, all good
    if (selectedLocation === ALL_LOCATIONS_VALUE) return;

    const selectedIsValid = locationOptions.includes(selectedLocation);
    const selectedHasData = locationOptionsWithData.includes(selectedLocation);
    const hasDataOptions = locationOptionsWithData.length > 0;
    // if the selected location is still there and valid and has data, all good
    if (selectedIsValid && (selectedHasData || !hasDataOptions)) return;
    //otherwise default to "all locations"
    setSelectedLocation(ALL_LOCATIONS_VALUE);
  }, [locationOptions, locationOptionsWithData, selectedLocation]);

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <FormControl
          fullWidth
          size="small"
          disabled={locationOptions.length === 0}
          sx={{ minWidth: 200, flex: 1 }}
        >
          <InputLabel id="location-select-label">Location</InputLabel>
          <Select
            labelId="location-select-label"
            label="Location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            {locationOptionsWithAll.map((locationOption) => {
              const isAll = locationOption === ALL_LOCATIONS_VALUE;
              const isDisabled = isAll
                ? false
                : !locationsWithDialogue.has(
                    locationOption.trim().toLowerCase()
                  );
              return (
                <MenuItem
                  key={locationOption}
                  value={locationOption}
                  disabled={isDisabled}
                >
                  {isAll ? ALL_LOCATIONS_LABEL : locationOption}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "nowrap",
              fontWeight: showRelative ? 400 : 600,
            }}
          >
            Absolute (words)
          </Typography>
          <Switch
            checked={showRelative}
            onChange={(e) => setShowRelative(e.target.checked)}
            color="primary"
            size="small"
            inputProps={{ "aria-label": "Toggle relative dialogue share" }}
          />
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "nowrap",
              fontWeight: showRelative ? 600 : 400,
            }}
          >
            Relative (%)
          </Typography>
        </Stack>
      </Stack>

      <LocationDialogueSharePlot
        index={dialogueIndex}
        location={
          selectedLocation === ALL_LOCATIONS_VALUE
            ? undefined
            : selectedLocation
        }
        showRelative={showRelative}
        onSceneClick={onSceneClick}
        height={height}
      />
    </Stack>
  );
}
