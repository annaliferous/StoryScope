import type { SceneInfo } from "../../hooks/useTimeline";

interface TimelineSceneProps {
  name: string;
  height: number;
  onClick: (scene: SceneInfo, isMulti: boolean) => void;
  data: { label: string; data: number; scene: SceneInfo; color: string }[];
  scenePadding: number;
  selectedSceneIds: string[];
  zoomLevel: number;
}

export function TimelineScene({
  data,
  onClick,
  height,
  scenePadding,
  selectedSceneIds,
  zoomLevel,
}: TimelineSceneProps) {
  return (
    <div style={{ display: "flex", whiteSpace: "nowrap" }}>
      {data.map((item) => {
        // Determine if this specific scene should be highlighted
        const isSelected = selectedSceneIds.includes(item.scene.id);

        return (
          <div
            key={item.scene.id}
            style={{
              height,
              width: `${item.data * zoomLevel}px`,
              backgroundColor: item.color,
              textAlign: "center",
              flexShrink: 0,
              borderRadius: "8px",
              marginRight: scenePadding + "px",
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",

              // slightly lift the selected ones
              transform: isSelected ? "translateY(-2px)" : "none",
              // dim non-selected ones slightly to make selection pop
              opacity: isSelected ? 1 : 0.8,
              // box shadow for selected scenes
              boxShadow: isSelected ? "0 4px 8px rgba(0,0,0,0.2)" : "none",

              transition: "all 0.2s ease-in-out",
              zIndex: isSelected ? 10 : 1,
            }}
            title={item.label}
            onClick={(e) => {
              // Detect if CMD (Mac) or CTRL (Windows) is pressed
              const isMulti = e.metaKey || e.ctrlKey;
              onClick(item.scene, isMulti);
            }}
            data-timeline-id={item.scene.id}
          >
            <span
              style={{
                display: "block",
                textOverflow: "ellipsis",
                width: "100%",
                overflow: "hidden",
                color: "#0c0c0c",
                userSelect: "none",
                // Bold text for active selection
                fontWeight: isSelected ? "bold" : "normal",
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
