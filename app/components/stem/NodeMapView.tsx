import { useState, useEffect, useRef } from "react";
import { styles } from "./stem-styles";
import type { Node } from "./types";

export function NodeMapView({
  nodes,
  childNodesMap,
  nodeToArtifacts,
}: {
  nodes: Node[];
  childNodesMap: Map<string, Node[]>;
  nodeToArtifacts: Map<string, string[]>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
  const [edges, setEdges] = useState<[number, number][]>([]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const W = 600, H = 360;
    // Initialize positions in a circle
    const pos = nodes.map((_, i) => ({
      x: W / 2 + Math.cos((2 * Math.PI * i) / nodes.length) * 120 + (Math.random() - 0.5) * 20,
      y: H / 2 + Math.sin((2 * Math.PI * i) / nodes.length) * 100 + (Math.random() - 0.5) * 20,
    }));
    const vel = nodes.map(() => ({ x: 0, y: 0 }));
    const nodeIndex = new Map(nodes.map((n, i) => [n.id, i]));

    // Build edges
    const simEdges: [number, number][] = [];
    for (const n of nodes) {
      const children = childNodesMap.get(n.id) || [];
      const pi = nodeIndex.get(n.id)!;
      for (const c of children) {
        const ci = nodeIndex.get(c.id);
        if (ci !== undefined) simEdges.push([pi, ci]);
      }
    }

    let frame = 0;
    let rafId = 0;
    const maxFrames = 100;
    const tick = () => {
      if (frame >= maxFrames) {
        setPositions([...pos]);
        setEdges(simEdges);
        return;
      }
      // Repulsion
      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const dx = pos[i].x - pos[j].x;
          const dy = pos[i].y - pos[j].y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 3000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          vel[i].x += fx; vel[i].y += fy;
          vel[j].x -= fx; vel[j].y -= fy;
        }
      }
      // Attraction (edges)
      for (const [a, b] of simEdges) {
        const dx = pos[b].x - pos[a].x;
        const dy = pos[b].y - pos[a].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = (dist - 100) * 0.05;
        const fx = (dx / Math.max(dist, 1)) * force;
        const fy = (dy / Math.max(dist, 1)) * force;
        vel[a].x += fx; vel[a].y += fy;
        vel[b].x -= fx; vel[b].y -= fy;
      }
      // Center gravity
      for (let i = 0; i < pos.length; i++) {
        vel[i].x += (W / 2 - pos[i].x) * 0.01;
        vel[i].y += (H / 2 - pos[i].y) * 0.01;
      }
      // Apply velocity with damping
      for (let i = 0; i < pos.length; i++) {
        vel[i].x *= 0.85; vel[i].y *= 0.85;
        pos[i].x += vel[i].x; pos[i].y += vel[i].y;
        pos[i].x = Math.max(40, Math.min(W - 40, pos[i].x));
        pos[i].y = Math.max(40, Math.min(H - 40, pos[i].y));
      }
      frame++;
      if (frame < maxFrames) rafId = requestAnimationFrame(tick);
      else { setPositions([...pos]); setEdges(simEdges); }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [nodes.length]);

  if (positions.length === 0) return null;

  return (
    <div style={{ marginBottom: 24, borderRadius: 12, overflow: "hidden", border: "1px solid var(--paper-dark)", background: "var(--surface)" }}>
      <svg ref={svgRef} viewBox="0 0 600 360" style={{ width: "100%", maxHeight: 360, display: "block" }}>
        {/* Edges */}
        {edges.map(([a, b], i) => (
          <line
            key={`e${i}`}
            x1={positions[a].x} y1={positions[a].y}
            x2={positions[b].x} y2={positions[b].y}
            stroke="var(--paper-dark)" strokeWidth="1.5"
          />
        ))}
        {/* Nodes */}
        {nodes.map((node, i) => {
          const count = (nodeToArtifacts.get(node.id) || []).length;
          const r = Math.max(16, Math.min(34, 12 + count * 3));
          return (
            <g key={node.id}>
              <circle
                cx={positions[i].x} cy={positions[i].y} r={r}
                fill="var(--leaf)" stroke="var(--forest)" strokeWidth="1.5"
              />
              <text
                x={positions[i].x} y={positions[i].y - r - 6}
                textAnchor="middle"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fill: "var(--ink-mid)" }}
              >
                {node.emoji ? `${node.emoji} ` : ""}{node.title}
              </text>
              <text
                x={positions[i].x} y={positions[i].y + 4}
                textAnchor="middle"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fill: "var(--forest)" }}
              >
                {count}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
