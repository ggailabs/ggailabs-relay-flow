"use client";

import { useState } from "react";
import { Connection } from "@/types/flow";
import { X } from "lucide-react";

interface ConnectionLineProps {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  isTemporary?: boolean;
  connection?: Connection;
  onDelete?: (connectionId: string) => void;
}

export default function ConnectionLine({ 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  isTemporary = false,
  connection,
  onDelete 
}: ConnectionLineProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate control points for a curved line
  const controlPointX1 = sourceX + (targetX - sourceX) * 0.5;
  const controlPointY1 = sourceY;
  const controlPointX2 = sourceX + (targetX - sourceX) * 0.5;
  const controlPointY2 = targetY;

  // Calculate midpoint for delete button
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  // Create the path data
  const pathData = `M ${sourceX} ${sourceY} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${targetX} ${targetY}`;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connection && onDelete) {
      if (confirm("Delete this connection?")) {
        onDelete(connection.id);
      }
    }
  };

  return (
    <g>
      {/* Connection line */}
      <path
        d={pathData}
        fill="none"
        stroke={isTemporary ? "#3b82f6" : (isHovered ? "#ef4444" : "#6b7280")}
        strokeWidth={isTemporary ? 2 : (isHovered ? 3 : 2)}
        strokeDasharray={isTemporary ? "5,5" : "none"}
        className="transition-all cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      
      {/* Arrowhead */}
      {!isTemporary && (
        <polygon
          points={`${targetX - 8},${targetY - 4} ${targetX},${targetY} ${targetX - 8},${targetY + 4}`}
          fill={isHovered ? "#ef4444" : "#6b7280"}
          className="transition-all"
        />
      )}
      
      {/* Temporary arrowhead */}
      {isTemporary && (
        <polygon
          points={`${targetX - 8},${targetY - 4} ${targetX},${targetY} ${targetX - 8},${targetY + 4}`}
          fill="#3b82f6"
          className="transition-all"
        />
      )}

      {/* Delete button for non-temporary connections */}
      {!isTemporary && connection && onDelete && isHovered && (
        <g
          transform={`translate(${midX}, ${midY})`}
          className="cursor-pointer"
          onClick={handleDelete}
        >
          <circle
            r="12"
            fill="#ef4444"
            className="hover:fill-red-600 transition-colors"
          />
          <X
            x="-6"
            y="-6"
            width="12"
            height="12"
            stroke="white"
            strokeWidth="2"
            className="pointer-events-none"
          />
        </g>
      )}
    </g>
  );
}