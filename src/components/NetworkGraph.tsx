import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface NetworkGraphProps {
  doc: XMLDocument;
  locations: Set<string>;
  characters: Set<string>;
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

const NetworkGraph = ({ doc, locations, characters }: NetworkGraphProps) => {
  // create nodes for characters gathered from the screenplay hook
  const nodes: NodeType[] = Array.from(characters).map((name) => ({
    id: name,
    group: "character",
  }));

  // dummy links between all characters (fully connected graph)
  // TODO: Replace with actual relationships based on screenplay analysis
  const links: LinkType[] = nodes.flatMap((a, i) =>
    nodes.slice(i + 1).map((b) => ({
      source: a.id,
      target: b.id,
      score: 1,
    }))
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initForceGraph = (canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d");
    if (!context) return () => {};
    const width = 800;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    // force simulation setup
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
      .on("tick", render); // this calls render on each tick

    function render() {
      if (!context) return;
      context.clearRect(0, 0, width, height);

      // Draw links
      links.forEach((link) => {
        const source = link.source as NodeType;
        const target = link.target as NodeType;
        context.beginPath();
        context.moveTo(source.x!, source.y!);
        context.lineTo(target.x!, target.y!);
        context.strokeStyle = "#999";
        context.lineWidth = 1;
        context.stroke();
      });

      // Draw nodes
      nodes.forEach((node) => {
        context.beginPath();
        context.arc(node.x!, node.y!, 5, 0, 2 * Math.PI);
        context.fillStyle = node.group === "team1" ? "blue" : "red";
        context.fill();

        context.fillStyle = "#000";
        context.font = "10px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(node.id, node.x!, node.y! - 10);
      });
    }

    render();

    return () => {
      simulation.stop();
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cleanup = initForceGraph(canvas);
    return cleanup;
  }, []);

  return <canvas ref={canvasRef} />;
};

export default NetworkGraph;
