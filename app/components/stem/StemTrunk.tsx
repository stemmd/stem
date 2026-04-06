import { useRef, useCallback } from "react";

/**
 * StemTrunk renders the central organic SVG trunk line with junction dots.
 * It uses gentle bezier curves to create an organic, non-rigid feel.
 */
export function StemTrunk({
  itemCount,
  rowHeight,
  junctionPositions,
  isOwner,
  onTrunkClick,
}: {
  itemCount: number;
  rowHeight: number;
  junctionPositions: number[];
  isOwner: boolean;
  onTrunkClick?: (yPosition: number, insertIndex: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const totalHeight = Math.max(itemCount * rowHeight + 60, 200);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isOwner || !onTrunkClick || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      // Find the nearest insertion index based on y position
      let insertIndex = junctionPositions.length;
      for (let i = 0; i < junctionPositions.length; i++) {
        if (y < junctionPositions[i]) {
          insertIndex = i;
          break;
        }
      }
      onTrunkClick(y, insertIndex);
    },
    [isOwner, onTrunkClick, junctionPositions]
  );

  // Generate organic trunk path with gentle S-curves
  const trunkPath = generateTrunkPath(totalHeight, junctionPositions);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 24 ${totalHeight}`}
      style={{
        width: 24,
        height: totalHeight,
        gridColumn: "2",
        gridRow: `1 / ${itemCount + 2}`,
        justifySelf: "center",
        cursor: isOwner ? "crosshair" : "default",
        zIndex: 2,
      }}
      onClick={handleClick}
    >
      {/* The trunk line */}
      <path
        d={trunkPath}
        fill="none"
        stroke="var(--forest)"
        strokeWidth={3.5}
        strokeLinecap="round"
        style={{ opacity: 0.85 }}
      />

      {/* Junction dots where branches meet the trunk */}
      {junctionPositions.map((y, i) => (
        <circle
          key={i}
          cx={12}
          cy={y}
          r={4}
          fill="var(--forest)"
        />
      ))}

      {/* Pulsing tip at the bottom (growth indicator) */}
      {itemCount > 0 && (
        <circle
          cx={12}
          cy={totalHeight - 20}
          r={3}
          fill="var(--forest)"
          opacity={0.5}
        >
          <animate
            attributeName="r"
            values="3;5;3"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.3;0.5"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </svg>
  );
}

/**
 * Generate an organic SVG path for the trunk.
 * Uses gentle quadratic beziers to create subtle S-curves.
 */
function generateTrunkPath(height: number, junctions: number[]): string {
  if (junctions.length === 0) {
    // Simple straight-ish line with very subtle wobble
    return `M 12 20 Q 13 ${height * 0.33} 12 ${height * 0.5} Q 11 ${height * 0.67} 12 ${height - 20}`;
  }

  const points: { x: number; y: number }[] = [{ x: 12, y: 20 }];

  // Add junction points with very subtle horizontal offset for organic feel
  for (let i = 0; i < junctions.length; i++) {
    const offset = (i % 2 === 0 ? 0.8 : -0.8); // Very subtle wobble
    points.push({ x: 12 + offset, y: junctions[i] });
  }

  points.push({ x: 12, y: height - 20 });

  // Build smooth path through all points using quadratic beziers
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${midY} ${curr.x} ${curr.y}`;
  }

  return d;
}

/**
 * Generate an SVG connector path from the trunk to a card.
 * Uses a gentle curve, not a straight line.
 */
export function generateConnectorPath(
  trunkX: number,
  cardEdgeX: number,
  y: number
): string {
  const midX = (trunkX + cardEdgeX) / 2;
  return `M ${trunkX} ${y} Q ${midX} ${y - 4} ${cardEdgeX} ${y}`;
}
