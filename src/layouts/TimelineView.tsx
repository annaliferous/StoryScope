import { SceneOverview } from "../components/SceneOverview";
import type { Screenplay } from "../hooks/useScreenplay";
import type { SceneInfo } from "../hooks/useTimeline";

interface TimeplineViewProps {
    screenplay?: Screenplay
    editorRef: React.RefObject<HTMLDivElement | null>
    height: number
    onSceneChange: (scene?: SceneInfo) => void
}

export function TimelineView({ screenplay, editorRef, height, onSceneChange }: TimeplineViewProps) {
    return <div style={{
        height,
        overflowY: "scroll",
    }}>
        <SceneOverview screenplay={screenplay} editorRef={editorRef} height={40} onClick={(scene) => {
            onSceneChange(scene);
        }} />
    </div>
}