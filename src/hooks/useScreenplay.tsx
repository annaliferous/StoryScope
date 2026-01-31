import { useEffect, useState } from "react";

export interface Scene {
  id: string;
  heading: string;
  characters: string[];
}

export interface Edge {
  source: string;
  target: string;
  score: number;
}

export interface Screenplay {
  characters: Set<string>;
  locations: Set<string>;
  scenes?: Scene[];
  edges?: Edge[];
  document: XMLDocument;
}

function getCharacters(doc: XMLDocument): Set<string> {
  const characters = new Set<string>();
  // Search the entire document.
  // Could've also used the CharacterHighlighting tag, but don't know if all characters will be there always.
  const characterNodes = doc.getElementsByTagName("CharacterArcBeat");
  for (let i = 0; i < characterNodes.length; i++) {
    const node = characterNodes.item(i);
    const name = node?.getAttribute("Name");
    if (name) characters.add(name);
  }

  return characters;
}

function getSceneHeadings(doc: XMLDocument): string[] {
  const $headings = doc.querySelectorAll('[Type="Scene Heading"]');
  const headings = [];
  for (const heading of $headings) {
    const $text = heading.getElementsByTagName("Text").item(0);
    if ($text) headings.push($text.textContent);
  }

  return headings;
}

export interface Dialog {
  character: string;
  text: string;
  id: string;
}
export function getSceneDialog(sceneId?: string, doc?: XMLDocument): Dialog[] {
  if (!sceneId || !doc) return [];

  const $startScene = doc.getElementById(sceneId);
  if (!$startScene) return [];
  const dialogs: Dialog[] = [];

  for (
    let sibling = $startScene.nextElementSibling;
    sibling;
    sibling = sibling.nextElementSibling
  ) {
    const type = sibling.getAttribute("Type");
    if (type === "Character") {
      dialogs.push({
        character: sibling.textContent.trim(),
        text: "",
        id: sibling.id,
      });
    } else if (type === "Dialogue") {
      const lastDialog = dialogs.at(-1);
      if (!lastDialog) break;
      lastDialog.text += sibling.textContent;
    } else if (type === "Scene Heading") {
      break;
    }
  }
  return dialogs;
}

export function getDialogsForScenes(
  selectedIds: string[],
  doc: XMLDocument,
): Dialog[] {
  // scene ids in der richtigen Reihenfolge aus dem XML holen
  const allSceneNodes = Array.from(
    doc.getElementsByTagName("Paragraph"),
  ).filter((n) => n.getAttribute("Type") === "Scene Heading");

  const orderedIds = allSceneNodes
    .map((n) => n.getAttribute("id"))
    .filter((id) => id && selectedIds.includes(id)) as string[];

  // Dialoge in der richtigen Reihenfolge sammeln
  return orderedIds.flatMap((id) => getSceneDialog(id, doc));
}

function extractScenes(doc: XMLDocument): Scene[] {
  const scenes: Scene[] = [];
  const sceneNodes = doc.querySelectorAll('Paragraph[Type="Scene Heading"]');
  for (const sceneNode of Array.from(sceneNodes)) {
    const id = sceneNode.getAttribute("id") ?? crypto.randomUUID();
    const heading =
      sceneNode.getElementsByTagName("Text").item(0)?.textContent ?? "";
    // Charaktere innerhalb von <SceneArcBeats>
    const arcBeats = sceneNode.querySelectorAll(
      "SceneArcBeats > CharacterArcBeat",
    );
    const characters = Array.from(arcBeats)
      .map((n) => n.getAttribute("Name")?.toUpperCase())
      .filter((x): x is string => Boolean(x));
    scenes.push({ id, heading, characters });
  }
  return scenes;
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

function generateEdges(scenes: Scene[]): Edge[] {
  const edgeMap = new Map<string, Edge>();
  for (const scene of scenes) {
    const chars = scene.characters;
    // jede Kombination von Charakteren
    for (let i = 0; i < chars.length; i++) {
      for (let j = i + 1; j < chars.length; j++) {
        const a = chars[i];
        const b = chars[j];
        const key = a < b ? `${a}__${b}` : `${b}__${a}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            source: a,
            target: b,
            score: 0,
          });
        }
        edgeMap.get(key)!.score += 1;
      }
    }
  }

  return Array.from(edgeMap.values());
}

function parseScreenplay(doc: XMLDocument): Screenplay {
  const scenes = extractScenes(doc);
  const edges = generateEdges(scenes);
  // Good entrypoint for extension of the Screenplay interface.
  const screenplay: Screenplay = {
    characters: getCharacters(doc),
    locations: getLocations(doc),
    scenes,
    edges,
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
      .then((response) => response.text())
      .then((text) => parser.parseFromString(text, "text/xml"))
      .then((doc) => {
        const sp = parseScreenplay(doc);
        setScreenplay(sp);
        console.log("Screenplay:", sp);
      })
      .catch(console.error);
  }, [url]);

  return screenplay;
}
