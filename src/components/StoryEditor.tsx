import { common } from "@mui/material/colors";
import { useContext, type Ref } from "react";
import { getCharacterColor } from "../utils/colors";
import { CounterContext } from "../utils/counter";
import type { SceneInfo } from "../hooks/useTimeline";
import { MoveDown } from "@mui/icons-material";
import { IconButton } from "@mui/material";

interface StoryEditorProps {
  ref?: Ref<HTMLDivElement>;
  doc: XMLDocument;
  /**
   * Fired whenever the user changes the document by deleting or adding to the text.
   * @param doc The .fdx xml content with the updated file contents (note: the original document is mutated in place)
   * @returns
   */
  onChange: (doc: XMLDocument) => void;
  /**
   * Callback which is invoked everytime the user scrolls in the editor.
   * @param offset scroll offset in percent (top = 0, middle = 0.5, bottom = 1)
   */
  onScroll?: (offset: number) => void;

  onClick: (scene: SceneInfo) => void;
}

function getParagraphText(element: Element) {
  const textNode = element.getElementsByTagName("Text").item(0);
  return textNode?.textContent ?? element.textContent ?? "";
}

function setParagraphText(element: Element, value: string) {
  const textNode = element.getElementsByTagName("Text").item(0);
  if (textNode) {
    textNode.textContent = value;
  } else {
    element.textContent = value;
  }
}

function ParagraphBlock({
  element,
  onClick,
}: {
  element: Element;
  onClick: (scene: SceneInfo) => void;
}) {
  // Force rerender when colors change.
  useContext(CounterContext);

  const type = element.getAttribute("Type");
  const text = getParagraphText(element);
  const id = element.id;

  switch (type) {
    case "Scene Heading":
      return (
        <div
          data-editor-id={id}
          data-block-type="scene"
          style={{
            display: "flex",
            alignItems: "center",
            margin: "24px 0 12px 0",
            fontWeight: "bold",
            gap: 6,
          }}
        >
          <span data-role="text">{text}</span>
          <IconButton
            aria-label="Select Scene"
            color="primary"
            size="small"
            contentEditable={false}
            onClick={() =>
              onClick({
                id,
                length: -1,
                name: text.trim(),
              })
            }
          >
            <MoveDown fontSize="small" />
          </IconButton>
        </div>
      );
    case "Character": {
      const color = getCharacterColor(text.trim());
      return (
        <div
          data-editor-id={id}
          data-block-type="character"
          style={{
            display: "inline-block",
            margin: "0 25px 2px 190px",
            backgroundColor: color + "22",
            lineHeight: "12px",
            color,
            padding: "6px",
            borderRadius: "4px",
            fontWeight: "bold",
            textDecoration: "underline",
          }}
        >
          <span data-role="text">{text}</span>
        </div>
      );
    }
    case "Action":
      return (
        <div
          data-block-type="action"
          style={{
            margin: "0 0 12px 0",
          }}
        >
          <span data-role="text">{text}</span>
        </div>
      );
    case "Dialogue":
      return (
        <div
          data-block-type="dialogue"
          style={{
            margin: "0 180px 24px 100px",
          }}
        >
          <span data-role="text">{text}</span>
        </div>
      );
    case "Parenthetical":
      return (
        <div
          data-block-type="parenthetical"
          style={{
            margin: "0 220px 0 135px",
          }}
        >
          <span data-role="text">{text}</span>
        </div>
      );
    default:
      return (
        <div data-block-type="unknown">
          <span data-role="text">{text}</span>
        </div>
      );
  }
}

/**
 * Text Editor component which renders the given XMLDocument in .fdx with a bit of markup.
 */
export function StoryEditor({
  doc,
  onChange,
  onScroll,
  ref,
  onClick,
}: StoryEditorProps) {
  const $content = doc.getElementsByTagName("Content");
  if (!$content) return;

  const paragraphs = Array.from($content.item(0)?.children ?? []) as Element[];

  return (
    <div
      ref={ref}
      style={{
        fontFamily: "'Courier Screenplay', 'Courier New', monospace",
        lineHeight: "1em",
        backgroundColor: common.white,
        color: common.black,
        padding: "0 105px 0 210px",
        height: "calc(100% - 8px)",
        overflow: "scroll",
        margin: "4px",
        borderRadius: "8px",
      }}
      onScroll={(e) => {
        const element = e.target as HTMLElement;

        const total = element.scrollHeight;
        const viewportHeight = element.offsetHeight;
        const currPos = element.scrollTop;
        const offset = currPos / (total - viewportHeight);
        if (onScroll) onScroll(offset);
      }}
    >
      <div
        contentEditable
        suppressContentEditableWarning
        style={{
          minHeight: "100%",
          outline: "none",
        }}
        onInput={(event) => {
          const target = event.target as HTMLElement;
          const block = target.closest<HTMLElement>("[data-block-index]");
          if (!block) return;

          const idx = Number(block.dataset.blockIndex);
          const blockId = block.dataset.blockId;

          const paragraphNode = blockId
            ? doc.getElementById(blockId)
            : $content.item(0)?.children.item(idx);
          if (!paragraphNode || paragraphNode.nodeType !== Node.ELEMENT_NODE)
            return;

          const textEl = block.querySelector<HTMLElement>('[data-role="text"]');
          const newText = textEl?.textContent ?? "";
          setParagraphText(paragraphNode as Element, newText);
          onChange(doc);
        }}
      >
        {paragraphs.map((paragraph, index) => (
          <div
            key={paragraph.id || index}
            data-block-id={paragraph.id}
            data-block-index={index}
            style={{
              display: "block",
            }}
          >
            <ParagraphBlock element={paragraph} onClick={onClick} />
          </div>
        ))}
      </div>
      <br />
    </div>
  );
}
