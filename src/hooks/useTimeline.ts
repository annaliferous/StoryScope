export interface SceneInfo {
    name: string
    length: number
    id: string
}

function getSceneLengths($content: Element | null) {
    if (!$content) return {
        scenes: [],
        sceneTotals: 0
    };

    const scenes: SceneInfo[] = [];
    let sceneTotals = 0;
    for (const child of $content.children) {
        const type = child.getAttribute('Type');
        if (type === "Scene Heading") {
            // Open up a new counter for each scene
            const scene = {
                name: child.textContent.trim(),
                length: 0,
                id: child.id,
            };
            scenes.push(scene);
        } else if (type === "Dialogue" || type === "Action") {
            // Count dialog and actions to the lates scene
            const lastScene = scenes.at(-1);
            const length = child.textContent.length;
            sceneTotals += length
            if (lastScene) lastScene.length += length;
        }
    }

    return {
        scenes,
        sceneTotals,
    };
}

export function useTimeline(doc: XMLDocument) {
    const $content = doc.getElementsByTagName('Content').item(0);
    const scenes = getSceneLengths($content);

    return {
        ...scenes
    };
}