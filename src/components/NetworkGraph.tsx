import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Edge {
  source: string;
  target: string;
  score: number;
}

interface NetworkGraphProps {
  characters: Set<string>;
  edges: Edge[];
}

interface NodeType extends d3.SimulationNodeDatum {
  id: string;
  group: string;
}

interface LinkType extends d3.SimulationLinkDatum<NodeType> {
  source: string | NodeType;
  target: string | NodeType;
  score: number;
}

const NetworkGraph = ({ characters, edges }: NetworkGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d")!;
    if (!context) return;

    const width = 800;
    const height = 600;

    canvas.width = width;
    canvas.height = height;

    // Build nodes
    const nodes: NodeType[] = Array.from(characters).map((name) => ({
      id: name,
      group: "character",
    }));

    // Build links
    const links: LinkType[] = edges.map((e) => ({
      source: e.source,
      target: e.target,
      score: e.score,
    }));

    // Simulation
    const simulation = d3
      .forceSimulation<NodeType>(nodes)
      .force(
        "link",
        d3
          .forceLink<NodeType, LinkType>(links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", render);

    function render() {
      context.clearRect(0, 0, width, height);

      // Draw links
      links.forEach((link) => {
        const source = link.source as NodeType;
        const target = link.target as NodeType;
        const score = link.score;

        context.beginPath();
        context.moveTo(source.x!, source.y!);
        context.lineTo(target.x!, target.y!);
        context.strokeStyle = "#999";
        context.lineWidth = score;
        context.stroke();
      });

      // Draw nodes
      nodes.forEach((node) => {
        context.beginPath();
        context.arc(node.x!, node.y!, 10, 0, 2 * Math.PI);
        context.fillStyle = "blue";
        context.fill();

        context.fillStyle = "#000";
        context.font = "15px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(node.id, node.x!, node.y! - 10);
      });
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [characters, edges]);

  return <canvas ref={canvasRef} />;
};

export default NetworkGraph;
