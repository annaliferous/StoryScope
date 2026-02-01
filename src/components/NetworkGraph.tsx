import { useEffect, useRef, useContext } from "react";
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

  useEffect(() => {
    // Validation: We need at least one scene ID and the document
    if (!sceneIds.length || !screenplay || !screenplay.document) {
      console.log("No scene or screenplay");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d")!;
    if (!context) return;

    // Set canvas dimensions
    const width = 800;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    // We use getDialogsForScenes to retrieve all dialogs from the selected scenes in the correct order (document order).
    const dialogs = getDialogsForScenes(sceneIds, screenplay.document);
    if (!dialogs.length) {
      context.clearRect(0, 0, width, height); // Clear canvas if no dialogs exist
      return;
    }

    // Extract nodes only from current dialogs
    const characters = [...new Set(dialogs.map((d) => d.character))];
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

    // Compute sentiment edges: Analyzes text and establishes relationships
    async function buildSentimentEdges(dialogs: Dialog[]): Promise<Edge[]> {
      const edgesMap = new Map<string, Edge>();
      const dialogChars = dialogs.map((d) => d.character);

      // Start all analyses in parallel for better performance
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
      const links: LinkType[] = edges.map((e) => ({
        source: e.source,
        target: e.target,
        score: e.score,
        sentiment: e.sentiment,
      }));

      // D3 Simulation configuration
      simulation = d3
        .forceSimulation<NodeType>(nodes)
        .force(
          "link",
          d3
            .forceLink<NodeType, LinkType>(links)
            .id((d) => d.id)
            .distance(200), // Distance between nodes
        )
        .force("charge", d3.forceManyBody().strength(-500)) // Repelling force
        .force("center", d3.forceCenter(width / 2, height / 2)) // Centering
        .on("tick", render);

      // Render loop (called at every simulation step)
      function render() {
        context.clearRect(0, 0, width, height);

        // Scale line width based on dialog count (score)
        const scoreValues = links.map((l) => l.score);
        const maxScore = Math.max(...scoreValues, 1);
        const minScore = Math.min(...scoreValues, 0);

        const widthScale = d3
          .scaleLinear()
          .domain([minScore, maxScore])
          .range([3, 10]); // Line width from 3px to 10px

        // Scale color based on sentiment
        const sentimentValues = links.map((l) => l.sentiment);
        const maxSentiment = Math.max(...sentimentValues, 1);
        const minSentiment = Math.min(...sentimentValues, -1);

        const colorScale = d3
          .scaleLinear<string>()
          .domain([minSentiment, 0, maxSentiment])
          .range(["#e57373", "#b0b0b0", "#81c784"]); // Red (negative), Gray (neutral), Green (positive)

        // 1. Draw links (lines between characters)
        links.forEach((link) => {
          const source = link.source as NodeType;
          const target = link.target as NodeType;

          context.beginPath();
          context.moveTo(source.x!, source.y!);
          context.lineTo(target.x!, target.y!);
          context.strokeStyle = colorScale(link.sentiment);
          context.lineWidth = widthScale(link.score);
          context.stroke();
        });

        // 2. Draw nodes (circles for characters)
        nodes.forEach((node) => {
          context.beginPath();
          context.arc(node.x!, node.y!, 15, 0, 2 * Math.PI);
          context.fillStyle = node.color ? node.color : "grey";
          context.fill();

          // Place character names above the node
          context.fillStyle = "#000000";
          context.font = "bold 16px sans-serif";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(node.id, node.x!, node.y! - 25);
        });
      }
    }

    runGraph().catch(console.error);

    // Cleanup: Stops the D3 simulation when the component unmounts or sceneIds change
    return () => {
      if (simulation) simulation.stop();
    };
  }, [sceneIds, screenplay, analyze, counter]); // counter triggers refresh on text change

  return <canvas ref={canvasRef} style={{ width: "100%", height: "auto" }} />;
};

export default NetworkGraph;
