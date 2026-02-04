import { useEffect, useContext, useState, useMemo, useRef } from "react";
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

  // Refs to track state without triggering useEffect dependencies
  // Used to avoid infinite loops and keep the dependency array clean
  const nodesRef = useRef<NodeType[]>([]);
  const linksRef = useRef<LinkType[]>([]);
  const nodeHistoryRef = useRef<Map<string, NodeType>>(new Map());
  const simulationRef = useRef<d3.Simulation<NodeType, undefined> | null>(null);

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
    // Fallback logic - Search for the first scene that actually HAS dialogs
    let effectiveSceneIds = sceneIds;

    if (
      effectiveSceneIds.length === 0 &&
      screenplay?.scenes &&
      screenplay.document
    ) {
      // Look for the first scene in the screenplay that returns at least one dialog line
      const firstSceneWithContent = screenplay.scenes.find((s) => {
        const d = getDialogsForScenes([s.id], screenplay.document!);
        return d.length > 0;
      });

      if (firstSceneWithContent) {
        effectiveSceneIds = [firstSceneWithContent.id];
        console.log(
          `Initial render: Selected scene ${firstSceneWithContent.id} (first with dialog).`,
        );
      }
    }
    // 1. Handling empty state asynchronously to prevent "cascading update" errors
    if (effectiveSceneIds.length === 0 || !screenplay?.document) {
      const timeoutId = setTimeout(() => {
        if (nodesRef.current.length > 0) {
          setNodes([]);
          nodesRef.current = [];
        }
        if (linksRef.current.length > 0) {
          setLinks([]);
          linksRef.current = [];
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }

    let isMounted = true;

    async function initSim() {
      // Stop previous simulation before starting heavy async work
      if (simulationRef.current) simulationRef.current.stop();

      // Extract dialogs per scene using the effective (potentially auto-selected) IDs
      const scenesData = effectiveSceneIds.map((id) => ({
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
          setTimeout(() => {
            setNodes([]);
            setLinks([]);
            nodesRef.current = [];
            linksRef.current = [];
          }, 0);
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

      const initialNodes: NodeType[] = charNames.map((name, index) => {
        const existingNode = nodeHistoryRef.current.get(name);
        if (existingNode) return existingNode;

        // Spread new nodes to prevent them from starting at the exact same spot
        const newNode = {
          id: name,
          color: getCharacterColor(name),
          x: width / 2 + Math.cos(index) * 20,
          y: height / 2 + Math.sin(index) * 20,
        };
        nodeHistoryRef.current.set(name, newNode);
        return newNode;
      });

      const edgesMap = new Map<string, EdgeEntry>();

      // Iterate through each scene to avoid cross-scene character interactions
      for (const scene of scenesData) {
        const dialogs = scene.dialogs;
        if (dialogs.length < 2) continue; // Skip scenes with less than 2 dialog lines

        // Perform Sentiment Analysis on all dialog lines of THIS scene in parallel
        const results = await Promise.allSettled(
          dialogs.map((d) => analyze(d.text.trim())),
        );
        if (!isMounted) return;

        const dialogChars = dialogs.map((d) => cleanCharacterName(d.character));
        results.forEach((res, i) => {
          if (res.status !== "fulfilled") return;
          // Cast unknown result to our internal SentimentOutput structure
          const sentiment = (res.value as unknown as SentimentOutput).output;
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

      const initialLinks = Array.from(
        edgesMap.values(),
      ) as unknown as LinkType[];
      if (!isMounted) return;

      // 3. D3 Force Simulation Setup
      const simulation = d3
        .forceSimulation<NodeType>(initialNodes)
        // Link force: keeps characters together based on their relationship
        .force(
          "link",
          d3
            .forceLink<NodeType, LinkType>(initialLinks)
            .id((d) => d.id)
            .distance(150),
        )
        // Charge force: prevents nodes from overlapping (repulsion)
        .force("charge", d3.forceManyBody().strength(-800))
        // X and Y forces: keeps the graph centered within the SVG area
        .force("x", d3.forceX(width / 2).strength(0.1))
        .force("y", d3.forceY(height / 2).strength(0.1))
        // Collision force: prevents nodes from overlapping visually
        .force("collide", d3.forceCollide().radius(60))
        // Center force: pulls the whole graph towards the SVG center
        .force("center", d3.forceCenter(width / 2, height / 2))
        .velocityDecay(0.3); // Fluid initial movement

      simulationRef.current = simulation;

      // KICKSTART: Internal ticks before first render to prevent "static" appearance
      // This gives nodes initial velocity before React paints them
      for (let i = 0; i < 5; i++) simulation.tick();

      // Final step: Update state and sync refs simultaneously
      nodesRef.current = initialNodes;
      linksRef.current = initialLinks;
      setNodes([...initialNodes]);
      setLinks([...initialLinks]);

      // Provide high energy for the starting animation
      simulation.alpha(1).restart();

      simulation.on("tick", () => {
        if (isMounted) {
          // Sync React state with the current D3 calculated positions
          setNodes([...initialNodes]);
          setLinks([...initialLinks]);
        }
      });
    }

    initSim();

    return () => {
      isMounted = false;
      if (simulationRef.current) simulationRef.current.stop();
    };
    // Dependencies are stable; Refs ensure we don't need nodes.length here
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
        // overflowX: "auto",
        height: "100%",
      }}
    >
      {/* Legend for Sentiment and Interaction - Centered at Top */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "8px 16px",
          borderRadius: "8px",
          fontSize: "16px",
          border: "2px solid #ddd",
          pointerEvents: "none",
          display: "flex",
          gap: "15px",
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "20px",
              height: "3px",
              backgroundColor: "#81c784",
              borderRadius: "2px",
            }}
          ></div>
          <span>Positive</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "20px",
              height: "3px",
              backgroundColor: "#b0b0b0",
              borderRadius: "2px",
            }}
          ></div>
          <span>Neutral</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "20px",
              height: "3px",
              backgroundColor: "#e57373",
              borderRadius: "2px",
            }}
          ></div>
          <span>Negative</span>
        </div>
        <div
          style={{
            borderLeft: "2px solid #ddd",
            height: "12px",
            marginLeft: "5px",
          }}
        ></div>
        <div style={{ fontStyle: "italic", opacity: 0.8 }}>
          Thickness = Interaction Count
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <g className="links">
          {links.map((link, idx) => {
            const s = link.source as NodeType;
            const t = link.target as NodeType;
            // Prevent rendering links for nodes that haven't been positioned yet
            if (!s.x || !t.x) return null;

            // Calculate average sentiment for the tooltip display
            const avgSentiment = link.sentiment / link.score;

            return (
              <line
                key={`link-${idx}`}
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
                    content: `Relation: <b>${s.id} & ${t.id}</b><br/>Interactions: ${link.score}<br/>Avg. Sentiment: ${avgSentiment.toFixed(2)}`,
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
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            pointerEvents: "none",
            zIndex: 100,
            fontSize: "16px",
            color: "#333",
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
};

export default NetworkGraph;
