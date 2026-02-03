import { useEffect, useContext, useState, useMemo } from "react";
import * as d3 from "d3";
import { getDialogsForScenes, type Screenplay } from "../hooks/useScreenplay";
import { useSentiment } from "../hooks/useSentiment";
import { getCharacterColor } from "../utils/colors";
import { CounterContext } from "../utils/counter";

// --- Interfaces for Type Safety ---

interface SentimentLabel {
  label: "POSITIVE" | "NEGATIVE";
  score: number;
}

interface SentimentOutput {
  output: SentimentLabel[];
}

interface EdgeEntry {
  source: string;
  target: string;
  score: number;
  sentiment: number;
}

interface NetworkGraphProps {
  sceneIds: string[];
  screenplay?: Screenplay;
}

interface NodeType extends d3.SimulationNodeDatum {
  id: string;
  color: string;
}

interface LinkType extends d3.SimulationLinkDatum<NodeType> {
  source: NodeType;
  target: NodeType;
  score: number;
  sentiment: number;
}

const NetworkGraph = ({ sceneIds, screenplay }: NetworkGraphProps) => {
  const { analyze } = useSentiment();
  const { counter } = useContext(CounterContext);

  // State for D3 data and UI
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string | null;
  }>({ x: 0, y: 0, content: null });

  // Fixed dimensions for the SVG coordinate system
  const width = 800;
  const height = 600;

  // Utility to strip parentheticals from character names (e.g., "JOE (V.O.)" -> "JOE")
  const cleanCharacterName = (name: string) =>
    name.replace(/\s*\([^)]*\)\s*/g, "").trim();

  useEffect(() => {
    // 1. Early exit to prevent cascading errors if data is missing
    if (!sceneIds.length || !screenplay?.document) {
      return;
    }

    let isMounted = true;

    async function initSim() {
      // Extract dialogs per scene
      const scenesData = sceneIds.map((id) => ({
        id,
        dialogs: getDialogsForScenes([id], screenplay!.document!),
      }));

      // Check if there are any dialogs at all
      const allDialogsCount = scenesData.reduce(
        (acc, s) => acc + s.dialogs.length,
        0,
      );

      // If no dialog is found, clear the graph state
      if (allDialogsCount === 0) {
        if (isMounted) {
          setNodes([]);
          setLinks([]);
        }
        return;
      }

      // Identify unique characters across all selected scenes
      const allUniqueChars = new Set<string>();
      scenesData.forEach((s) =>
        s.dialogs.forEach((d) =>
          allUniqueChars.add(cleanCharacterName(d.character)),
        ),
      );
      const charNames = Array.from(allUniqueChars);

      // Create initial nodes with randomized start positions near the center
      // to reduce aggressive "jumping" when the simulation starts
      const initialNodes: NodeType[] = charNames.map((name) => ({
        id: name,
        color: getCharacterColor(name),
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height / 2 + (Math.random() - 0.5) * 100,
      }));

      const edgesMap = new Map<string, EdgeEntry>();

      // Iterarte through each scene to avoid cross-scene character interactions
      for (const scene of scenesData) {
        const dialogs = scene.dialogs;
        if (dialogs.length < 2) continue; // Skip scenes with less than 2 dialog lines

        const dialogChars = dialogs.map((d) => cleanCharacterName(d.character));

        // Perform Sentiment Analysis on all dialog lines of THIS scene in parallel
        const results = await Promise.allSettled(
          dialogs.map((d) => analyze(d.text.trim())),
        );

        results.forEach((res, i) => {
          if (res.status !== "fulfilled") return;

          // Cast unknown result to our internal SentimentOutput structure
          const sentimentResult = res.value as unknown as SentimentOutput;
          const sentiment = sentimentResult.output;

          const pos = sentiment.find((v) => v.label === "POSITIVE")?.score ?? 0;
          const neg = sentiment.find((v) => v.label === "NEGATIVE")?.score ?? 0;

          // Calculate a delta score (-100 to 100)
          const score = (pos - neg) * 100;

          const speaker = dialogChars[i];

          // Simple logic to find the interaction partner (listener):
          // Look for the next speaker, or if none, look for the previous speaker.
          // only consider current scene's dialogs
          const listener =
            dialogChars.slice(i + 1).find((c) => c !== speaker) ||
            dialogChars
              .slice(0, i)
              .reverse()
              .find((c) => c !== speaker);

          if (!listener || speaker === listener) return;

          // Create a unique alphabetical key for the edge to handle undirected links
          const key =
            speaker < listener
              ? `${speaker}__${listener}`
              : `${listener}__${speaker}`;

          const edge = edgesMap.get(key) ?? {
            source: speaker,
            target: listener,
            score: 0,
            sentiment: 0,
          };

          edge.score += 1; // Increment interaction frequency
          edge.sentiment += score; // Accumulate sentiment values
          edgesMap.set(key, edge);
        });
      }

      const initialLinks = Array.from(edgesMap.values());

      if (!isMounted) return;

      // 3. D3 Force Simulation Setup
      const simulation = d3
        .forceSimulation<NodeType>(initialNodes)
        // Link force: keeps characters together based on their relationship
        .force(
          "link",
          d3
            .forceLink<NodeType, LinkType>(
              initialLinks as unknown as LinkType[],
            )
            .id((d) => d.id)
            .distance(150),
        )
        // Charge force: prevents nodes from overlapping (repulsion)
        .force("charge", d3.forceManyBody().strength(-400))
        // X and Y forces: keeps the graph centered within the SVG area
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05))
        // Collision force: prevents nodes from overlapping visually
        .force("collide", d3.forceCollide().radius(40))
        // Center force: pulls the whole graph towards the SVG center
        .force("center", d3.forceCenter(width / 2, height / 2));

      // Pre-calculate 50 ticks so the graph doesn't start from (0,0) visibly
      for (let i = 0; i < 50; ++i) simulation.tick();

      setNodes([...initialNodes]);
      setLinks([...(initialLinks as unknown as LinkType[])]);

      // Update React state on every simulation step
      simulation.on("tick", () => {
        if (isMounted) {
          setNodes([...initialNodes]);
          setLinks([...(initialLinks as unknown as LinkType[])]);
        }
      });

      return () => simulation.stop();
    }

    const cleanupPromise = initSim();
    return () => {
      isMounted = false;
      cleanupPromise.then((stop) => stop?.());
    };
  }, [sceneIds, screenplay, analyze, counter]);

  // 4. Scales for visual encoding (thickness and color of lines)
  const linkScales = useMemo(() => {
    if (links.length === 0) return null;
    const scores = links.map((l) => l.score);
    const sentiments = links.map((l) => l.sentiment);

    return {
      // maps interaction frequency to line width (2px to 8px)
      width: d3
        .scaleLinear()
        .domain([d3.min(scores) || 0, d3.max(scores) || 1])
        .range([2, 8]),
      // maps sentiment to color (Red for negative, Grey for neutral, Green for positive)
      color: d3
        .scaleLinear<string>()
        .domain([d3.min(sentiments) || -1, 0, d3.max(sentiments) || 1])
        .range(["#e57373", "#b0b0b0", "#81c784"]),
    };
  }, [links]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        borderRadius: "8px",
        zIndex: 1, // Ensure it stays below tooltips but above background
        overflow: "auto", // Fallback for small screens
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto" }}
      >
        <g className="links">
          {links.map((link, i) => {
            const s = link.source as NodeType;
            const t = link.target as NodeType;
            return (
              <line
                key={`link-${i}`}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={linkScales?.color(link.sentiment) || "#ccc"}
                strokeWidth={linkScales?.width(link.score) || 1}
                strokeOpacity={0.6}
                onMouseEnter={(e) =>
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    content: `Relation: <b>${s.id} & ${t.id}</b><br/>Interactions: ${link.score}`,
                  })
                }
                onMouseLeave={() =>
                  setTooltip((prev) => ({ ...prev, content: null }))
                }
              />
            );
          })}
        </g>
        <g className="nodes">
          {nodes.map((node) => (
            <g
              key={`node-${node.id}`}
              transform={`translate(${node.x || 0},${node.y || 0})`}
              onMouseEnter={(e) =>
                setTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  content: `Character: <b>${node.id}</b>`,
                })
              }
              onMouseLeave={() =>
                setTooltip((prev) => ({ ...prev, content: null }))
              }
              style={{ cursor: "pointer" }}
            >
              <circle r={15} fill={node.color} stroke="#fff" strokeWidth={2} />
              <text
                dy={-25}
                textAnchor="middle"
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  fill: "#333",
                  userSelect: "none",
                }}
              >
                {node.id}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* Dynamic Tooltip implementation */}
      {tooltip.content && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 15,
            top: tooltip.y + 15,
            backgroundColor: "white",
            padding: "8px",
            borderRadius: "4px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            pointerEvents: "none",
            zIndex: 100,
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
};

export default NetworkGraph;
