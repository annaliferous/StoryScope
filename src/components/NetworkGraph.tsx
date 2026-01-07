import { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  getSceneDialog,
  type Dialog,
  type Screenplay,
} from "../hooks/useScreenplay";
import type { SceneInfo } from "../hooks/useTimeline";
import { useSentiment } from "../hooks/useSentiment";
import { getCharacterColor } from "../utils/colors";

interface Edge {
  source: string;
  target: string;
  score: number;
  sentiment: number;
}

interface NetworkGraphProps {
  //characters: Set<string>;
  //edges: Edge[];
  scene?: SceneInfo;
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

const NetworkGraph = ({
  //characters,
  //edges,
  scene,
  screenplay,
}: NetworkGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyze } = useSentiment();

  useEffect(() => {
    if (!scene || !screenplay /*|| characters.size === 0*/) {
      console.log("No scene or screenplay");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d")!;
    if (!context) return;

    const width = 800;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    const dialogs = getSceneDialog(scene.id, screenplay.document);
    if (!dialogs.length) return;

    // Nodes nur aus aktuellen Dialogen
    const characters = [...new Set(dialogs.map((d) => d.character))];
    const nodes: NodeType[] = characters.map((c) => ({
      id: c,
      group: "character",
      color: getCharacterColor(c),
    }));

    // // Build nodes
    // const nodes: NodeType[] = Array.from(characters).map((name) => ({
    //   id: name,
    //   group: "character",
    // }));

    // Helper to get the next character in dialog sequence
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

    // Compute sentiment edges
    async function buildSentimentEdges(dialogs: Dialog[]): Promise<Edge[]> {
      const edgesMap = new Map<string, Edge>();
      const dialogChars = dialogs.map((d) => d.character);

      const promises = dialogs.map((d) => analyze(d.text.trim()));
      const results = await Promise.allSettled(promises);

      results.forEach((res, i) => {
        if (res.status !== "fulfilled") return;
        const sentiment = res.value;
        const score =
          ((sentiment.output.find((v) => v.label === "POSITIVE")?.score ?? 0) -
            (sentiment.output.find((v) => v.label === "NEGATIVE")?.score ??
              0)) *
          100;

        const speaker = dialogChars[i];
        const listener = dialogChars[getNextCharacterIndex(i, dialogChars)];

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
        edge.score += 1;
        edge.sentiment += score;
        edgesMap.set(key, edge);
      });

      return Array.from(edgesMap.values());
    }

    async function runGraph() {
      const dialogs = getSceneDialog(scene.id, screenplay.document);
      const edges = await buildSentimentEdges(dialogs);

      // Build links
      const links: LinkType[] = edges.map((e) => ({
        source: e.source,
        target: e.target,
        score: e.score,
        sentiment: e.sentiment,
      }));

      // Simulation
      simulation = d3
        .forceSimulation<NodeType>(nodes)
        .force(
          "link",
          d3
            .forceLink<NodeType, LinkType>(links)
            .id((d) => d.id)
            .distance(300)
        )
        .force("charge", d3.forceManyBody().strength(-450))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", render);

      function render() {
        context.clearRect(0, 0, width, height);

        // Berechne Max und Min der Scores
        const scoreValues = links.map((l) => l.score);
        const maxScore = Math.max(...scoreValues, 1); // mind. 1, damit nichts div/0 wird
        const minScore = Math.min(...scoreValues, 0);

        // Erstelle einen Width-Scale
        const widthScale = d3
          .scaleLinear()
          .domain([minScore, maxScore]) // score von min bis max
          .range([4, 10]); // minimale und maximale Linienbreite

        // Berechne das Maximum und Minimum aller Sentiment-Werte
        const sentimentValues = links.map((l) => l.sentiment);
        const maxSentiment = Math.max(...sentimentValues, 1); // mind. 1, um div/0 zu vermeiden
        const minSentiment = Math.min(...sentimentValues, -1);

        // Erstelle einen Farbscale
        const colorScale = d3
          .scaleLinear<string>()
          .domain([minSentiment, 0, maxSentiment]) // von negativ über 0 zu positiv
          .range(["#e57373", "#b0b0b0", "#81c784"]); // rot → grau → grün

        // Draw links
        links.forEach((link) => {
          const source = link.source as NodeType;
          const target = link.target as NodeType;

          context.beginPath();
          context.moveTo(source.x!, source.y!);
          context.lineTo(target.x!, target.y!);
          context.strokeStyle = colorScale(link.sentiment);
          console.log(
            "Link sentiment:",
            link.sentiment,
            "color:",
            context.strokeStyle
          );
          context.lineWidth = widthScale(link.score);
          context.stroke();
        });

        // Draw nodes
        nodes.forEach((node) => {
          context.beginPath();
          context.arc(node.x!, node.y!, 15, 0, 2 * Math.PI);
          context.fillStyle = node.color ? node.color : "grey";
          context.fill();

          context.fillStyle = "#fff";
          context.font = "20px sans-serif";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(node.id, node.x!, node.y! - 25);
        });
      }
    }
    runGraph().catch(console.error);
    // Cleanup
    // return () => {
    //   console.log("Stopping simulation");
    //   simulation.stop();
    // };
  }, [scene, screenplay, analyze]);

  return <canvas ref={canvasRef} />;
};

export default NetworkGraph;
