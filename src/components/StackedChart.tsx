import { Box, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { useMemo } from "react";

export type ChartMode = "location" | "character";

interface StackedChartProps {
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

  const pushSceneIfNeeded = () => {
    if (!currentSceneLocation) return;
    if (currentSceneLocation.trim().toLowerCase() !== normalizedTarget)
      return;
    if (currentCounts.size === 0) return;

    const datum: ChartDatum = {
      sceneIndex: currentSceneIndex,
      sceneLabel: currentSceneLabel,
      sceneId: currentSceneId,
    };

    for (const [character, total] of currentCounts.entries()) {
      datum[character] = total;
      characters.add(character);
    }

    dataset.push(datum);
  };

  for (const paragraph of paragraphs) {
    const type = paragraph.getAttribute("Type");

    if (type === "Scene Heading") {
      pushSceneIfNeeded();
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

  pushSceneIfNeeded();

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

  const pushSceneIfNeeded = () => {
    if (!currentSceneLocation) return;
    if (currentCounts.size === 0) return;

    const datum: ChartDatum = {
      sceneIndex: currentSceneIndex,
      sceneLabel: currentSceneLabel,
      sceneId: currentSceneId,
    };

    for (const [locationName, total] of currentCounts.entries()) {
      datum[locationName] = total;
      locations.add(locationName);
    }

    dataset.push(datum);
  };

  for (const paragraph of paragraphs) {
    const type = paragraph.getAttribute("Type");

    if (type === "Scene Heading") {
      pushSceneIfNeeded();
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

  pushSceneIfNeeded();

  return {
    dataset,
    locations: Array.from(locations).sort(),
  };
}

export default function StackedChart({
  doc,
  mode,
  location,
  character,
  height = 360,
  onSceneClick,
}: StackedChartProps) {
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
        series={seriesKeys.map((key) => ({
          dataKey: key,
          label: key,
          stack: "dialogue",
        }))}
        height={height}
        slotProps={{
          legend: { hidden: false },
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
