import type { SceneInfo } from "../../hooks/useTimeline";

interface TimelineSceneProps {
    name : string
    height: number
    onClick: (scene: SceneInfo) => void
    data: { label: string, data: number, scene: SceneInfo, color: string }[]
    scenePadding: number
    zoomLevel: number
}

export function TimelineScene({ data, onClick, height, scenePadding, zoomLevel }: TimelineSceneProps) {
    return <div style={{
        display: "flex",
        whiteSpace: "nowrap",
    }}>
        {data.map((item) => {
            return <div key={item.scene.id} style={{
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
                cursor: "pointer"
            }}
                title={item.label}
                onClick={() => {
                    onClick(item.scene)
                }}
                data-timeline-id={item.scene.id}
            >
                <span style={{
                    display: "block",
                    textOverflow: "ellipsis",
                    width: "100%",
                    overflow: "hidden",
                    color: "#0c0c0c",
                    userSelect: "none",
                }}>
                    {item.label}
                </span>
            </div>;
        })}
    </div>
}