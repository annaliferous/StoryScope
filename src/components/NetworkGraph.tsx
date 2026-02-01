import { useEffect, useRef, useContext, useState } from "react";
import * as d3 from "d3";
import {
  getDialogsForScenes,
  type Dialog,
  type Screenplay,
} from "../hooks/useScreenplay";
import { useSentiment } from "../hooks/useSentiment";
import { getCharacterColor } from "../utils/colors";
import { CounterContext } from "../utils/counter";

interface Edge {
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
  group: string;
  color?: string;
}

interface LinkType extends d3.SimulationLinkDatum<NodeType> {
  source: string | NodeType;
  target: string | NodeType;
  score: number;
  sentiment: number;
}

const NetworkGraph = ({ sceneIds, screenplay }: NetworkGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyze } = useSentiment();
  const { counter } = useContext(CounterContext);

  // State for the HTML tooltip
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string | null;
  }>({
    x: 0,
    y: 0,
    content: null,
  });

  // Helper to clean character names from extensions like (V.O.), (O.S.), etc.
  const cleanCharacterName = (name: string) => {
    return name.replace(/\s*\([^)]*\)\s*/g, "").trim();
  };

  useEffect(() => {
    // Validation: We need at least one scene ID and the document
    if (!sceneIds.length || !screenplay || !screenplay.document) {
      return;
    }

    // We use getDialogsForScenes to retrieve all dialogs from the selected scenes in the correct order (document order).
    const dialogs = getDialogsForScenes(sceneIds, screenplay.document);
    if (!dialogs.length) {
      const context = canvasRef.current?.getContext("2d");
      context?.clearRect(0, 0, 800, 600);
      return;
    }

    const width = 800;
    const height = 600;

    const characters = [
      ...new Set(dialogs.map((d) => cleanCharacterName(d.character))),
    ];
    const nodes: NodeType[] = characters.map((c) => ({
      id: c,
      group: "character",
      color: getCharacterColor(c),
    }));

    // Helper to get the next character in dialog sequence (Determines the conversation partner)
    function getNextCharacterIndex(index: number, dialogChars: string[]) {
      const currentCharacter = dialogChars[index];
      const nextIndex = dialogChars
        .slice(index + 1)
        .findIndex((c) => c !== currentCharacter);
      if (nextIndex === -1) {
        const reverseArray = [...dialogChars.slice(0, index)].reverse();
        const prevIndex = reverseArray.findIndex((c) => c !== currentCharacter);
        return prevIndex === -1 ? index : index - 1 - prevIndex;
      }
      return index + 1 + nextIndex;
    }

    let simulation: d3.Simulation<NodeType, LinkType>;
    let currentLinks: LinkType[] = [];
    let currentNodes: NodeType[] = [];

    // Compute sentiment edges: Analyzes text and establishes relationships
    async function buildSentimentEdges(dialogs: Dialog[]): Promise<Edge[]> {
      const edgesMap = new Map<string, Edge>();
      const dialogChars = dialogs.map((d) => cleanCharacterName(d.character));

      const promises = dialogs.map((d) => analyze(d.text.trim()));
      const results = await Promise.allSettled(promises);

      results.forEach((res, i) => {
        if (res.status !== "fulfilled") return;

        // 1. Access the output property
        // 2. Cast via unknown because the types are structurally different
        const sentiment = res.value.output as unknown as {
          label: string;
          score: number;
        }[];

        // Calculate sentiment score: Positive score minus negative score

        const positiveScore =
          sentiment.find((v) => v.label === "POSITIVE")?.score ?? 0;
        const negativeScore =
          sentiment.find((v) => v.label === "NEGATIVE")?.score ?? 0;
        const score = (positiveScore - negativeScore) * 100;

        const speaker = dialogChars[i];
        const listener = dialogChars[getNextCharacterIndex(i, dialogChars)];

        if (speaker === listener) return;

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

        edge.score += 1; // Frequency of interaction (line width)
        edge.sentiment += score; // Cumulative sentiment (line color)
        edgesMap.set(key, edge);
      });

      return Array.from(edgesMap.values());
    }

    async function runGraph() {
      // Uses the dialogs collected above

      const edges = await buildSentimentEdges(dialogs);

      // Build links for D3 (mapping edge data)

      currentLinks = edges.map((e) => ({
        source: e.source,
        target: e.target,
        score: e.score,
        sentiment: e.sentiment,
      }));
      currentNodes = nodes;
      // D3 Simulation configuration

      simulation = d3
        .forceSimulation<NodeType>(currentNodes)
        .force(
          "link",
          d3
            .forceLink<NodeType, LinkType>(currentLinks)
            .id((d) => d.id)
            .distance(200), // Distance between nodes
        )
        .force("charge", d3.forceManyBody().strength(-500)) // Repelling force
        .force("center", d3.forceCenter(width / 2, height / 2)) // Centering
        .on("tick", render);

      // Render loop (called at every simulation step)
      function render() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        context.clearRect(0, 0, width, height);

        // Scale line width based on dialog count (score)
        const scoreValues = currentLinks.map((l) => l.score);
        const maxScore = Math.max(...scoreValues, 1);
        const minScore = Math.min(...scoreValues, 0);
        const widthScale = d3
          .scaleLinear()
          .domain([minScore, maxScore])
          .range([3, 10]);

        const sentimentValues = currentLinks.map((l) => l.sentiment);
        const maxSentiment = Math.max(...sentimentValues, 1);
        const minSentiment = Math.min(...sentimentValues, -1);
        const colorScale = d3
          .scaleLinear<string>()
          .domain([minSentiment, 0, maxSentiment])
          .range(["#e57373", "#b0b0b0", "#81c784"]); // Red (negative), Gray (neutral), Green (positive)

        // 1. Draw links (lines between characters)
        currentLinks.forEach((link) => {
          const source = link.source as NodeType;
          const target = link.target as NodeType;
          context.beginPath();
          context.moveTo(source.x!, source.y!);
          context.lineTo(target.x!, target.y!);
          context.strokeStyle = colorScale(link.sentiment);
          context.lineWidth = widthScale(link.score);
          context.globalAlpha = 0.8;
          context.stroke();
          context.globalAlpha = 1.0;
        });

        // 2. Draw nodes (circles for characters)
        currentNodes.forEach((node) => {
          context.save();
          context.shadowColor = "rgba(0,0,0,0.15)";
          context.shadowBlur = 10;
          context.shadowOffsetY = 4;
          context.beginPath();
          context.arc(node.x!, node.y!, 18, 0, 2 * Math.PI);
          context.fillStyle = node.color ? node.color : "grey";
          context.fill();
          context.strokeStyle = "#ffffff";
          context.lineWidth = 2;
          context.stroke();
          context.restore();

          // Place character names above the node
          context.fillStyle = "#2c3e50";
          context.font = "bold 14px sans-serif";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(node.id, node.x!, node.y! - 30);
        });
      }

      // Mouse interaction for tooltips
      const handleMouseMove = (event: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        // Calculate scale in case canvas is resized via CSS
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;

        // Find hovered node
        const hoveredNode = currentNodes.find(
          (n) => Math.sqrt((n.x! - mouseX) ** 2 + (n.y! - mouseY) ** 2) < 20,
        );

        if (hoveredNode) {
          setTooltip({
            x: event.clientX,
            y: event.clientY,
            content: `<strong>${hoveredNode.id}</strong><br/>Character`,
          });
          return;
        }

        // Find hovered link (checking midpoint for simplicity)
        const hoveredLink = currentLinks.find((l) => {
          const s = l.source as NodeType;
          const t = l.target as NodeType;
          const midX = (s.x! + t.x!) / 2;
          const midY = (s.y! + t.y!) / 2;
          return Math.sqrt((midX - mouseX) ** 2 + (midY - mouseY) ** 2) < 15;
        });

        if (hoveredLink) {
          setTooltip({
            x: event.clientX,
            y: event.clientY,
            content: `Relation: <strong>${(hoveredLink.source as NodeType).id} & ${(hoveredLink.target as NodeType).id}</strong><br/>
                      Interactions: ${hoveredLink.score}<br/>
                      Sentiment: ${hoveredLink.sentiment.toFixed(2)}`,
          });
          return;
        }
        setTooltip((prev) => ({ ...prev, content: null }));
      };

      const currentCanvas = canvasRef.current;
      if (currentCanvas) {
        currentCanvas.addEventListener("mousemove", handleMouseMove);
        return () => {
          currentCanvas.removeEventListener("mousemove", handleMouseMove);
        };
      }
    }

    const graphPromise = runGraph();

    // Cleanup: Stops the D3 simulation when the component unmounts or sceneIds change
    return () => {
      if (simulation) simulation.stop();
      graphPromise.then((cleanup) => cleanup?.());
    };
  }, [sceneIds, screenplay, analyze, counter]);

  return (
    <div style={{ position: "relative", width: "100%", height: "auto" }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          cursor: tooltip.content ? "pointer" : "default",
        }}
      />
      {tooltip.content && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 15,
            top: tooltip.y + 15,
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            padding: "10px 14px",
            borderRadius: "8px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            pointerEvents: "none",
            fontSize: "13px",
            color: "#333",
            zIndex: 9999,
            border: "1px solid #eee",
            fontFamily: "sans-serif",
            lineHeight: "1.4",
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
};

export default NetworkGraph;
