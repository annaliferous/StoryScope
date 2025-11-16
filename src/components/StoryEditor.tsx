import { common } from "@mui/material/colors";

interface StoryEditorProps {
    doc: XMLDocument
    onChange: (doc: XMLDocument) => void
}

/**
 * Renders a list of XML children recursively.
 */
function StoryBlocks({ docs }: { docs: NodeListOf<ChildNode> }) {
    return <>
        {/* {element.nodeName} */}
        {Array.from(docs).map((child) => <StoryBlock doc={child} />)}
    </>;
}

/**
 * Applies styles to XML nodes, given an XML doc.
 */
function StoryBlock({ doc }: { doc: ChildNode | null }) {
    if (!doc) return;
    console.log(doc);
    if (doc.nodeType === doc.TEXT_NODE) return doc.textContent;

    if (doc.nodeType !== doc.ELEMENT_NODE) return;
    const element = doc as Element;

    const type = element.getAttribute("Type");
    switch (type) {
        case "Action":
            return <em><StoryBlocks docs={element.childNodes} /></em>;
        case "Dialogue":
            return <div><StoryBlocks docs={element.childNodes} /></div>;
        case "Character":
            return <div style={{ paddingTop: 12, textDecoration: "underline" }}><StoryBlocks docs={element.childNodes} /></div>;
        case "Scene Heading":
            return <div style={{ paddingTop: 12 }}><b><StoryBlocks docs={element.childNodes} /></b></div>;
        default:
            break;
    }

    return <StoryBlocks docs={element.childNodes} />;
}

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
        <StoryBlock doc={$content.item(0)} />
    </div>;
}