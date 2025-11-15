import { common } from "@mui/material/colors";

interface StoryEditorProps {
    doc: XMLDocument
    onChange: (doc: XMLDocument) => void
}

function StoryBlock({ doc }: { doc: ChildNode | null }) {
    if (!doc) return;
    console.log(doc);
    if (doc.nodeType === doc.TEXT_NODE) return doc.textContent;

    if (doc.nodeType !== doc.ELEMENT_NODE) return;
    const element = doc as Element;

    const type = element.getAttribute("Type");
    switch (type) {
        case "Action":
            return <em><StoryBlock doc={element.firstElementChild} /></em>;
        case "Dialogue":
            return <StoryBlock doc={element.firstChild} />;
        case "Character":
            return <u><StoryBlock doc={element.firstElementChild} /></u>;
        case "Scene Heading":
            return <b style={{ paddingTop: 12, display: "inline-block" }}><StoryBlock doc={element.firstElementChild} /></b>;
        default:
            break;
    }

    return <div contentEditable>
        {/* {element.nodeName} */}
        {Array.from(element.childNodes).map((child) => <StoryBlock doc={child} />)}
    </div>;
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