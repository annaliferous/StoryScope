import { common } from "@mui/material/colors";
import { useContext, type Ref } from "react";
import { getCharacterColor } from "../utils/colors";
import { CounterContext } from "../utils/counter";
import type { SceneInfo } from "../hooks/useTimeline";
import { MoveDown } from "@mui/icons-material";
import { IconButton } from "@mui/material";


interface StoryBlocksProps {
    docs: NodeListOf<ChildNode>
    onChange: (doc: ChildNode) => void
    onClick: (scene: SceneInfo) => void
}
/**
 * Renders a list of XML children recursively.
 */
function StoryBlocks({ docs, onChange, onClick }: StoryBlocksProps) {
    // TOOD: Figure out how to get a stable key.
    return <>
        {Array.from(docs).map((child) => <StoryBlock doc={child} onChange={() => onChange(child)} onClick={onClick} />)}
    </>;
}

/**
 * Applies styles to XML nodes, given an XML doc.
 */
function StoryBlock({ doc, onChange, onClick }: { doc: ChildNode | null, onChange: () => void, onClick: (scene: SceneInfo) => void }) {
    // Force rerender component whenever counter is updated.
    // This is for updating the color of the character.
    useContext(CounterContext);

    if (!doc) return;
    if (doc.nodeType === doc.TEXT_NODE) {
        return <span
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {
                const newContent = e.currentTarget.textContent;

                // We take a shortcut here, modifying the XMLDocument directly.
                // React doesn't like that, but we 'manually' update the DOM afterwards by using the onChange callback.
                // Therefore everything should be fine.
                // eslint-disable-next-line react-hooks/immutability
                doc.textContent = newContent;
                onChange();
            }}>{doc.textContent}</span>;
    }

    if (doc.nodeType !== doc.ELEMENT_NODE) return;
    const element = doc as Element;

    const type = element.getAttribute("Type");
    switch (type) {
        case "Action":
            return <div style={{padding: "0 0 12px 0"}}>
                <StoryBlocks docs={element.childNodes} onChange={onChange} onClick={onClick} />
            </div>;
        case "Dialogue":
            return <div 
                style={{
                    padding: "0 180px 24px 100px",
                }}>
                <StoryBlocks docs={element.childNodes} onChange={onChange} onClick={onClick} />
            </div>;
        case "Character":
            return <div style={{padding: "0 25px 2px 190px"}}>
                <div data-editor-id={element.id}
                    style={{
                        display: "inline-block",
                        textDecoration: "underline",
                        backgroundColor: getCharacterColor(element.textContent.trim()) + "22",
                        lineHeight: "12px",
                        color: getCharacterColor(element.textContent.trim()),
                        padding: "6px",
                        borderRadius: '4px',
                        fontWeight: "bold",
                    }}>
                    <StoryBlocks docs={element.childNodes} onChange={onChange} onClick={onClick} />
                </div>
            </div>;
        case "Parenthetical":
            return <div 
                style={{
                    padding: "0 220px 0 135px"
                }}>
                <StoryBlocks docs={element.childNodes} onChange={onChange} onClick={onClick} />
            </div>
        case "Scene Heading":
            return <div data-editor-id={element.id}
                style={{
                    display: "flex",
                    paddingTop: 12,
                    fontWeight: "bold",
                    alignItems: "center",
                }}>
                <StoryBlocks docs={element.childNodes} onChange={onChange} onClick={onClick} />

                <IconButton aria-label="Select Scene" color="primary" size="small" onClick={() => {
                    if (onClick)
                        onClick({
                            id: element.id,
                            length: -1,
                            name: element.textContent.trim(),
                        });
                }}>
                    <MoveDown fontSize="small" />
                </IconButton>
            </div >;
        default: break;
    }

    return <StoryBlocks docs={element.childNodes} onChange={onChange} onClick={onClick} />;
}

interface StoryEditorProps {
    ref?: Ref<HTMLDivElement>
    doc: XMLDocument
    /**
     * Fired whenever the user changes the document by deleting or adding to the text.
     * @param doc The .fdx xml content with the updated file contents (note: the original document is mutated in place)
     * @returns 
     */
    onChange: (doc: XMLDocument) => void
    /**
     * Callback which is invoked everytime the user scrolls in the editor.
     * @param offset scroll offset in percent (top = 0, middle = 0.5, bottom = 1)
     */
    onScroll?: (offset: number) => void

    onClick: (scene: SceneInfo) => void
}

/**
 * Text Editor component which renders the given XMLDocument in .fdx with a bit of markup.
 */
export function StoryEditor({ doc, onChange, onScroll, ref, onClick }: StoryEditorProps) {

    const $content = doc.getElementsByTagName("Content");
    if (!$content) return;

    return <div ref={ref} style={{
        fontFamily: "'Courier Screenplay', 'Courier New', monospace",
        lineHeight: "12pt",
        backgroundColor: common.white,
        color: common.black,
        padding: "0 105px 0 210px",
        height: "calc(100% - 8px)",
        overflow: "scroll",
        margin: '4px',
        borderRadius: '8px',
    }}
        onScroll={(e) => {
            const element = e.target as HTMLElement;

            const total = element.scrollHeight;
            const viewportHeight = element.offsetHeight;
            const currPos = element.scrollTop;
            const offset = currPos / (total - viewportHeight);
            if (onScroll) onScroll(offset);
        }}>
        <StoryBlock doc={$content.item(0)} onChange={() => onChange(doc)} onClick={onClick} />
        <br />
    </div>;
}