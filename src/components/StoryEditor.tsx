import { common } from "@mui/material/colors";

/**
 * Renders a list of XML children recursively.
 */
function StoryBlocks({ docs, onChange }: { docs: NodeListOf<ChildNode>, onChange: (doc: ChildNode) => void }) {
    return <>
        {/* {element.nodeName} */}
        {Array.from(docs).map((child) => <StoryBlock doc={child} onChange={() => onChange(child)} />)}
    </>;
}

/**
 * Applies styles to XML nodes, given an XML doc.
 */
function StoryBlock({ doc, onChange }: { doc: ChildNode | null, onChange: () => void }) {
    if (!doc) return;
    console.log(doc);
    if (doc.nodeType === doc.TEXT_NODE) {
        return <span contentEditable onInput={(e) => {
            const newContent = e.currentTarget.textContent;

            doc.textContent = newContent;
            onChange();
        }}>{doc.textContent}</span>;
    }

    if (doc.nodeType !== doc.ELEMENT_NODE) return;
    const element = doc as Element;

    const type = element.getAttribute("Type");
    switch (type) {
        case "Action":
            return <div style={{ fontStyle: 'italic' }}><StoryBlocks docs={element.childNodes} onChange={onChange} /></div>;
        case "Dialogue":
            return <div><StoryBlocks docs={element.childNodes} onChange={onChange} /></div>;
        case "Character":
            return <div style={{ paddingTop: 12, textDecoration: "underline" }}><StoryBlocks docs={element.childNodes} onChange={onChange} /></div>;
        case "Scene Heading":
            return <div style={{ paddingTop: 12 }}><b><StoryBlocks docs={element.childNodes} onChange={onChange} /></b></div>;
        default:
            break;
    }

    return <StoryBlocks docs={element.childNodes} onChange={onChange} />;
}

interface StoryEditorProps {
    doc: XMLDocument
    onChange: (doc: XMLDocument) => void
}

/**
 * Text Editor component which renders the given XMLDocument in .fdx with a bit of markup.
 */
export function StoryEditor({ doc, onChange }: StoryEditorProps) {
    const $content = doc.getElementsByTagName("Content");
    if (!$content) return;

    return <div style={{
        textAlign: "left",
        fontFamily: "monospace",
        backgroundColor: common.white,
        color: common.black,
        padding: 12,
    }}>
        <StoryBlock doc={$content.item(0)} onChange={() => onChange(doc)} />
    </div>;
}