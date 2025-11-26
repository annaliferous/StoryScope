import { useEffect, useState } from "react";

export interface Screenplay {
    characters: Set<string>
    locations: Set<string>
    document: XMLDocument
}

function getCharacters(doc: XMLDocument): Set<string> {
    const characters = new Set<string>();
    // Search the entire document.
    // Could've also used the CharacterHighlighting tag, but don't know if all characters will be there always.
    const characterNodes = doc.getElementsByTagName('CharacterArcBeat');
    for (let i = 0; i < characterNodes.length; i++) {
        const node = characterNodes.item(i);
        const name = node?.getAttribute('Name');
        if (name) characters.add(name);
    }

    return characters;
}

function getSceneHeadings(doc: XMLDocument): string[] {
    const $headings = doc.querySelectorAll('[Type="Scene Heading"]');
    const headings = [];
    for (const heading of $headings) {
        const $text = heading.getElementsByTagName('Text').item(0);
        if ($text) headings.push($text.textContent);
    }

    return headings;
}

interface Dialog {
    character: string
    text: string
}
export function getSceneDialog(sceneId?: string, doc?: XMLDocument): Dialog[] {
    if (!sceneId || !doc) return [];

    const $startScene = doc.getElementById(sceneId);
    if (!$startScene) return [];
    const dialogs: Dialog[] = [];

    for (let sibling = $startScene.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
        const type = sibling.getAttribute("Type");
        if (type === "Character") {
            dialogs.push({
                character: sibling.textContent.trim(),
                text: ""
            });
        } else if (type === "Dialogue") {
            const lastDialog = dialogs.at(-1);
            if (!lastDialog) break;
            lastDialog.text += sibling.textContent;
        }
        else if (type === "Scene Heading") {
            break;
        }
    }
    return dialogs;
}

/**
 * Tries to parse the location out of the scene headings. Does not work on edge cases.
 * @todo Try to parse the `<Locations>` tag instead (but make sure that all locations are actually declared there)
 * @param doc 
 * @returns 
 */
function getLocations(doc: XMLDocument): Set<string> {
    const headings = getSceneHeadings(doc);
    const locations = new Set<string>();

    for (const heading of headings) {
        // TODO: Adjust the split seperator dynamically (based on values in .fdx)
        const parts = heading.trim().split(/\. | - /);
        if (parts.length < 2) continue;
        locations.add(parts[1]);
    }

    return locations;
}

function parseScreenplay(doc: XMLDocument): Screenplay {
    // Good entrypoint for extension of the Screenplay interface.
    const screenplay: Screenplay = {
        characters: getCharacters(doc),
        locations: getLocations(doc),
        document: doc,
    };
    return screenplay;
}

export function useScreenplay(url?: string): Screenplay | undefined {
    const [screenplay, setScreenplay] = useState<Screenplay>();

    useEffect(() => {
        if (!url) return;
        const parser = new DOMParser();
        fetch(url)
            .then(response => response.text())
            .then(text => parser.parseFromString(text, 'text/xml'))
            .then(doc => {
                const sp = parseScreenplay(doc);
                setScreenplay(sp);
                console.log('Screenplay:', sp);
            })
            .catch(console.error);
    }, [url]);

    return screenplay;
}
