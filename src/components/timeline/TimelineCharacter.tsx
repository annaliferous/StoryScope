import type { SceneInfo } from "../../hooks/useTimeline";
import { getCharacterColor } from "../../utils/colors";

interface TimelineCharacterProps {
    height: number
    scenePadding: number
    character: string
    dialogs: {
        isSpeaking: boolean;
        length: number;
        id: string;
    }[][]
    data: { label: string, data: number, scene: SceneInfo, color: string }[]
    onClick: (scene: SceneInfo) => void
}

export function TimelineCharacter({ character, height, dialogs, scenePadding, data, onClick }: TimelineCharacterProps) {
    return <div style={{
        display: "flex",
        whiteSpace: "nowrap",
        marginTop: 4,
        flexShrink: 0,
        borderBottom: "solid 1px transparent",
        paddingLeft: "50%",
    }}>
        {dialogs.map((scene, sceneIndex) => {
            return <div style={{
                display: "flex",
                width: data[sceneIndex].data * 1000 + "px",
                marginRight: scenePadding + "px",
                borderRadius: "8px",
                flexShrink: 0,
            }}
                key={data[sceneIndex].scene.id}>
                {scene.map(dialog => {
                    return <div style={{
                        height,
                        width: dialog.length * (data[sceneIndex].data * 1000) + "px",
                        backgroundColor: dialog.isSpeaking ? getCharacterColor(character) : "transparent",
                        borderRadius: "8px",
                        flexShrink: 0,
                        cursor: dialog.isSpeaking ? "pointer" : "default",
                    }}
                        onClick={() => {
                            if (dialog.isSpeaking)
                                onClick({
                                    id: dialog.id,
                                    length: dialog.length,
                                    name: character,
                                });
                        }} >
                        {/* {character} */}
                    </div>;
                })}
            </div>;
        })}
    </div>
}