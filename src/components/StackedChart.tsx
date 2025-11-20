import { Box, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { useMemo } from "react";

interface StackedChartProps {
  doc: XMLDocument;
  location: string;
  height?: number;
}

type ChartDatum = {
  sceneIndex: number;
  sceneLabel: string;
  [character: string]: string | number;
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

function buildDataset(doc: XMLDocument, targetLocation: string) {
  const paragraphs = Array.from(doc.getElementsByTagName("Paragraph"));
  const dataset: ChartDatum[] = [];
  const characters = new Set<string>();

  let currentSceneLocation: string | undefined;
  let currentSceneLabel = "";
  let currentSceneIndex = 0;
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

export default function StackedChart({
  doc,
  location,
  height = 360,
}: StackedChartProps) {
  const { dataset, characters } = useMemo(
    () => buildDataset(doc, location),
    [doc, location]
  );

  if (!location) {
    return (
      <Typography variant="body2">
        Pick a location to see who speaks there.
      </Typography>
    );
  }

  if (dataset.length === 0) {
    return (
      <Typography variant="body2">
        No dialogue found for <strong>{location}</strong>.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Dialogue per character at {location}
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
        series={characters.map((character) => ({
          dataKey: character,
          label: character,
          stack: "dialogue",
        }))}
        height={height}
        slotProps={{
          legend: { hidden: false },
          tooltip: { trigger: "item" },
        }}
      />
    </Box>
  );
}
