import { useEffect, useState } from "react";

interface Screenplay {
    characters: Set<string>
    locations: Set<string>
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

function getLocations(doc: XMLDocument): Set<string> {
    const locations = new Set<string>();

    // What now?
    // Apparently locations are not separately defined in final draft.
    console.log('TODO: Get locations out of this:', doc);

    return locations;
}

// Good entrypoint for extension of the Screenplay interface.
function parseScreenplay(doc: XMLDocument): Screenplay {
    const screenplay: Screenplay = {
        characters: getCharacters(doc),
        locations: getLocations(doc),
    };
    return screenplay;
}

export function useScreenplay() {
    const [screenplay, setScreenplay] = useState<Screenplay>();

    useEffect(() => {
        const parser = new DOMParser();
        fetch('/skyfall.fdx')
            .then(response => response.text())
            .then(text => parser.parseFromString(text, 'text/xml'))
            .then(doc => {
                const sp = parseScreenplay(doc);
                setScreenplay(sp);
                console.log('Screenplay:', sp);
            })
            .catch(console.error);
    }, []);

    return screenplay;
}
