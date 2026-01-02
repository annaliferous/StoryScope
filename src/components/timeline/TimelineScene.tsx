import type { SceneInfo } from "../../hooks/useTimeline";

interface TimelineSceneProps {
    height: number
    onClick: (scene: SceneInfo) => void
    data: { label: string, data: number, scene: SceneInfo, color: string }[]
    scenePadding: number
}

export function TimelineScene({ data, onClick, height, scenePadding }: TimelineSceneProps) {
    return <div style={{
        display: "flex",
        whiteSpace: "nowrap",
    }}>
        {data.map((item) => {
            return <div style={{
                height,
                width: `${item.data * 1000}px`,
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