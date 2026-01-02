import { common } from "@mui/material/colors";
import type { Ref, RefObject } from "react";
import { getCharacterColor } from "../utils/colors";


/**
 * Scrolls inside the given `editorRef` to the relative position which is given by the percentage in offset.
 * @param offset 0-1 scroll offset.
 */
export function scrollStoryEditorTo(editorRef: RefObject<HTMLDivElement | null>, id: string) {
    const ref = editorRef.current;
    if (!ref) return;

    ref.querySelector('[data-id="' + id + '"]')?.scrollIntoView({ behavior: 'smooth' })
}

interface StoryBlocksProps {
    docs: NodeListOf<ChildNode>
    onChange: (doc: ChildNode) => void
}
/**
 * Renders a list of XML children recursively.
 */
function StoryBlocks({ docs, onChange }: StoryBlocksProps) {
    // TOOD: Figure out how to get a stable key.
    return <>
        {Array.from(docs).map((child) => <StoryBlock doc={child} onChange={() => onChange(child)} />)}
    </>;
}

/**
 * Applies styles to XML nodes, given an XML doc.
 */
function StoryBlock({ doc, onChange }: { doc: ChildNode | null, onChange: () => void }) {
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
            return <div style={{ fontStyle: 'italic' }}>
                <StoryBlocks docs={element.childNodes} onChange={onChange} />
            </div>;
        case "Dialogue":
            return <div>
                <StoryBlocks docs={element.childNodes} onChange={onChange} />
            </div>;
        case "Character":
            return <div>
                <div data-id={element.id}
                    style={{
                        display: "inline-block",
                        marginTop: 12,
                        textDecoration: "underline",
                        backgroundColor: getCharacterColor(element.textContent.trim()) + "22",
                        lineHeight: "12px",
                        color: getCharacterColor(element.textContent.trim()),
                        padding: "6px",
                        borderRadius: '4px',
                        fontWeight: "bold",
                    }}>
                    <StoryBlocks docs={element.childNodes} onChange={onChange} />
                </div>
            </div>;
        case "Scene Heading":
            return <div data-id={element.id} style={{ paddingTop: 12, fontWeight: "bold" }}>
                <StoryBlocks docs={element.childNodes} onChange={onChange} />
            </div>;
        default:
            break;
    }

    return <StoryBlocks docs={element.childNodes} onChange={onChange} />;
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
}

/**
 * Text Editor component which renders the given XMLDocument in .fdx with a bit of markup.
 */
export function StoryEditor({ doc, onChange, onScroll, ref }: StoryEditorProps) {
    const $content = doc.getElementsByTagName("Content");
    if (!$content) return;

    return <div ref={ref} style={{
        fontFamily: "monospace",
        backgroundColor: common.white,
        color: common.black,
        padding: "0 12px",
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
        <StoryBlock doc={$content.item(0)} onChange={() => onChange(doc)} />
        <br />
    </div>;
}