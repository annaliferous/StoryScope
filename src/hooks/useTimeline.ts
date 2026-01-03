import { getSceneDialog, type Screenplay } from "./useScreenplay";

export interface SceneInfo {
    name: string
    length: number
    id: string
}

function getCharacterTimelines(scenes: SceneInfo[], screenplay: Screenplay) {
    const timelines: Record<string, { isSpeaking: boolean, length: number, id: string }[][]> = {};
    for (const character of screenplay.characters) {
        timelines[character] = [];
    }

    for (const scene of scenes) {
        for (const character of screenplay.characters) {
            timelines[character].push([]);
        }

        const dialogs = getSceneDialog(scene.id, screenplay.document);
        const charactersInScene = new Set<string>();
        const dialogLength = dialogs.reduce((prev, curr) => prev + curr.text.length, 0);
        for (const dialog of dialogs) {
            charactersInScene.add(dialog.character);
            for (const character of Object.keys(timelines)) {
                timelines[character].at(-1)!.push({
                    isSpeaking: dialog.character === character,
                    length: dialog.text.length / dialogLength,
                    id: dialog.id
                });
            }
        }
    }

    console.log("Timelines", timelines);
    return timelines;
}

function getSceneLengths(screenplay: Screenplay) {
    const $content = screenplay.document.getElementsByTagName('Content').item(0);
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

export function useTimeline(screenplay: Screenplay) {
    const sceneInfos = getSceneLengths(screenplay);
    const dialogLengthByCharacter = getCharacterTimelines(sceneInfos.scenes, screenplay);

    return {
        ...sceneInfos,
        dialogLengthByCharacter
    };
}