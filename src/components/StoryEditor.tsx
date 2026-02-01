import {
  useState,
  useCallback,
  useMemo,
  memo,
  useContext,
  useRef,
  useEffect,
} from "react";
import debounce from "lodash.debounce";
import {
  Paper,
  Box,
  Container,
  GlobalStyles,
  Chip,
  IconButton,
} from "@mui/material";
import TargetIcon from "@mui/icons-material/LocationSearching";
import { getCharacterColor } from "../utils/colors";
import { CounterContext } from "../utils/counter";

// --- Types ---
export type ParagraphType =
  | "Action"
  | "Scene Heading"
  | "Character"
  | "Dialogue"
  | "Parenthetical"
  | string;

interface ScriptParagraph {
  id: string;
  type: ParagraphType;
  text: string;
}

interface StoryEditorProps {
  doc: XMLDocument;
  onChange: (doc: XMLDocument) => void;
  onScroll?: (offset: number) => void;
  onSyncTimeline?: (id: string) => void;
  onSceneClick: (id: string, isMulti: boolean) => void;
  selectedSceneIds: string[];
}

// Helper to convert XML nodes into a flat array for React state
const parseXMLToState = (doc: XMLDocument): ScriptParagraph[] => {
  const nodes = Array.from(doc.getElementsByTagName("Paragraph"));
  return nodes.map((node) => ({
    id: node.getAttribute("id") || crypto.randomUUID(),
    type: node.getAttribute("Type") || "Action",
    text: node.getElementsByTagName("Text")[0]?.textContent || "",
  }));
};

// Cycle through types when pressing Tab
const NEXT_TYPE_MAP: Record<string, ParagraphType> = {
  Action: "Scene Heading",
  "Scene Heading": "Character",
  Character: "Parenthetical",
  Parenthetical: "Dialogue",
  Dialogue: "Action",
};

// --- Paragraph Block ---
// Memoized to prevent unnecessary re-renders during typing
const ParagraphBlock = memo(
  ({
    p,
    onUpdate,
    onEnter,
    onTab,
    onSyncTimeline,
    onDelete,
    colorVersion,
    isSelected,
    onSceneClick,
  }: {
    p: ScriptParagraph;
    onUpdate: (id: string, text: string) => void;
    onEnter: (id: string) => void;
    onTab: (id: string) => void;
    onSyncTimeline?: (id: string) => void;
    onDelete: (id: string) => void;
    colorVersion: number;
    isSelected: boolean;
    onSceneClick: (id: string, isMulti: boolean) => void;
  }) => {
    const isCharacter = p.type === "Character";
    const isScene = p.type === "Scene Heading";
    const editorRef = useRef<HTMLDivElement>(null);

    // Dynamic color for characters (resets when colorVersion/Counter changes)
    const color = isCharacter ? getCharacterColor(p.text.trim()) : "#757575";

    // Keep the DOM in sync with state only when ID or Type changes,
    // but NOT on every keystroke to prevent cursor jumps.
    useEffect(() => {
      if (editorRef.current && editorRef.current.textContent !== p.text) {
        editorRef.current.textContent = p.text;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [p.id, p.type]);

    return (
      <Box
        data-v={colorVersion} // Nonsene, but Typescript wont shut up otherwise
        sx={{
          position: "relative",
          "&:hover .type-tag, &:focus-within .type-tag": { opacity: 1 },
          "&:hover .sync-icon": { opacity: 0.6 },
          bgcolor:
            isSelected && isScene ? "rgba(25, 118, 210, 0.05)" : "transparent",
          borderRadius: "4px",
          transition: "background-color 0.2s",
        }}
      >
        {/* Button to sync timeline view to this scene */}
        {isScene && (
          <IconButton
            className="sync-icon"
            onClick={(e) => {
              e.stopPropagation(); // Don't trigger scene selection when clicking sync
              onSyncTimeline?.(p.id);
            }}
            size="small"
            sx={{
              position: "absolute",
              left: "-35px",
              top: "-2px",
              opacity: 0,
              transition: "opacity 0.2s",
              "&:hover": { opacity: "1 !important", color: "#1976d2" },
            }}
          >
            <TargetIcon fontSize="small" />
          </IconButton>
        )}

        {/* Floating tag showing current paragraph type */}
        <Box
          className="type-tag"
          contentEditable={false}
          sx={{
            position: "absolute",
            left: "-140px",
            top: "0px",
            opacity: 0,
            transition: "opacity 0.2s",
            width: "100px",
            textAlign: "right",
            cursor: "pointer",
            zIndex: 10,
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTab(p.id);
          }}
        >
          <Chip
            label={p.type}
            size="small"
            variant="outlined"
            sx={{
              fontSize: "0.6rem",
              height: "16px",
              textTransform: "uppercase",
              color: "#999",
            }}
          />
        </Box>

        {/* The actual editable text area */}
        <Box
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-editor-id={p.id}
          onInput={(e) => onUpdate(p.id, e.currentTarget.textContent || "")}
          onClick={(e) => {
            if (isScene) {
              // CMD/CTRL key detection for multi-select
              onSceneClick(p.id, e.metaKey || e.ctrlKey);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter(p.id);
            }
            if (e.key === "Tab") {
              e.preventDefault();
              onTab(p.id);
            }
            if (e.key === "Backspace" && e.currentTarget.textContent === "") {
              e.preventDefault();
              onDelete(p.id);
            }
          }}
          sx={{
            outline: "none",
            minHeight: "1.2em",
            mt: isScene ? 6 : 0,
            mb: isCharacter ? 0.5 : 2,
            fontFamily: "'Courier Prime', monospace",
            fontSize: "12pt",
            whiteSpace: "pre-wrap",
            color: isCharacter ? color : "black",
            fontWeight: isScene ? "bold" : "normal",
            textTransform: isCharacter || isScene ? "uppercase" : "none",
            cursor: isScene ? "pointer" : "text",

            // Traditional Screenplay Layouting
            ml:
              p.type === "Character"
                ? "35%"
                : p.type === "Dialogue"
                  ? "15%"
                  : p.type === "Parenthetical"
                    ? "25%"
                    : 0,
            width:
              p.type === "Dialogue"
                ? "60%"
                : p.type === "Parenthetical"
                  ? "40%"
                  : p.type === "Character"
                    ? "30%"
                    : "100%",

            px: 1,
            transition: "box-shadow 0.2s ease-in-out",
            borderLeft:
              isSelected && isScene
                ? "3px solid #1976d2"
                : "3px solid transparent",

            "&:focus": {
              borderLeft: "2px solid #1976d2",
              bgcolor: "rgba(25, 118, 210, 0.03)",
            },
          }}
        />
      </Box>
    );
  },
  // Custom memo comparison:
  // We only re-render if ID, Type, or Text changes,
  // OR if the global colorVersion (Counter) changes.
  (prev, next) =>
    prev.p.id === next.p.id &&
    prev.p.type === next.p.type &&
    prev.p.text === next.p.text &&
    prev.colorVersion === next.colorVersion &&
    prev.isSelected === next.isSelected,
);

// --- Story Editor ---
export function StoryEditor({
  doc,
  onChange,
  onScroll,
  onSyncTimeline,
  onSceneClick,
  selectedSceneIds,
}: StoryEditorProps) {
  // Local state for fast UI updates
  const [paragraphs, setParagraphs] = useState<ScriptParagraph[]>(() =>
    parseXMLToState(doc),
  );

  // Global counter to trigger heavy recalculations (Colors, Graph, etc.)
  const { counter, setCounter } = useContext(CounterContext);

  // Sync text changes to the XML document with a delay (debounce)
  const debouncedSync = useMemo(
    () =>
      debounce((id: string, text: string) => {
        const node = doc.querySelector(`Paragraph[id="${id}"]`);
        if (node) {
          const textNode = node.getElementsByTagName("Text")[0];
          if (textNode) {
            textNode.textContent = text;
            onChange(doc); // Notify parent app
            setCounter((prev: number) => prev + 1); // Trigger visual updates (Graph/Sentiment)
          }
        }
      }, 1000),
    [doc, onChange, setCounter],
  );

  // Called on every keystroke
  const handleUpdate = useCallback(
    (id: string, newText: string) => {
      // Optimistic local state update to prevent cursor jumps
      setParagraphs((prev) =>
        prev.map((p) => (p.id === id ? { ...p, text: newText } : p)),
      );
      debouncedSync(id, newText);
    },
    [debouncedSync],
  );

  // Handle Tab key: changes paragraph type (Action -> Heading -> Character, etc.)
  const handleTab = useCallback(
    (id: string) => {
      setParagraphs((prev) => {
        const idx = prev.findIndex((p) => p.id === id);
        if (idx === -1) return prev;

        const nextType = NEXT_TYPE_MAP[prev[idx].type] || "Action";
        const xmlNode = doc.querySelector(`Paragraph[id="${id}"]`);
        if (xmlNode) xmlNode.setAttribute("Type", nextType);

        const newParas = [...prev];
        newParas[idx] = { ...newParas[idx], type: nextType };

        // Use timeout to ensure state has settled before telling parent
        setTimeout(() => onChange(doc), 0);
        return newParas;
      });
    },
    [doc, onChange],
  );

  // Handle Enter key: creates a new paragraph based on the current one's type
  const handleEnter = useCallback(
    (currentId: string) => {
      setParagraphs((prev) => {
        const idx = prev.findIndex((p) => p.id === currentId);
        if (idx === -1) return prev;

        const currentPara = prev[idx];
        let nextType: ParagraphType = "Action";

        if (currentPara.type === "Character") nextType = "Dialogue";
        else if (currentPara.type === "Dialogue") nextType = "Action";

        const newId = crypto.randomUUID();
        const currentXmlNode = doc.querySelector(
          `Paragraph[id="${currentId}"]`,
        );

        if (currentXmlNode?.parentNode) {
          const newXmlNode = doc.createElement("Paragraph");
          newXmlNode.setAttribute("id", newId);
          newXmlNode.setAttribute("Type", nextType);
          const textNode = doc.createElement("Text");
          textNode.textContent = "";
          newXmlNode.appendChild(textNode);

          currentXmlNode.parentNode.insertBefore(
            newXmlNode,
            currentXmlNode.nextSibling,
          );
        }

        const updatedList = parseXMLToState(doc);
        setTimeout(() => {
          onChange(doc);
          const nextElem = document.querySelector(
            `[data-editor-id="${newId}"]`,
          ) as HTMLElement;
          nextElem?.focus();
        }, 0);

        return updatedList;
      });
    },
    [doc, onChange],
  );

  // Handle Backspace: deletes paragraph if empty and moves focus up
  const handleDelete = useCallback(
    (id: string) => {
      setParagraphs((prev) => {
        const idx = prev.findIndex((p) => p.id === id);
        if (idx <= 0) return prev;

        const prevParaId = prev[idx - 1].id;
        const xmlNode = doc.querySelector(`Paragraph[id="${id}"]`);

        if (xmlNode && xmlNode.parentNode) {
          xmlNode.parentNode.removeChild(xmlNode);
        }

        const updatedList = prev.filter((p) => p.id !== id);

        onChange(doc);

        // Restore focus and cursor position to previous paragraph
        setTimeout(() => {
          const prevElem = document.querySelector(
            `[data-editor-id="${prevParaId}"]`,
          ) as HTMLElement;
          if (prevElem) {
            prevElem.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(prevElem);
            range.collapse(false); // Move cursor to end
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }, 0);

        return updatedList;
      });
    },
    [doc, onChange],
  );

  return (
    <Box
      onScroll={(e) => {
        const t = e.currentTarget;
        onScroll?.(t.scrollTop / (t.scrollHeight - t.clientHeight));
      }}
      sx={{
        bgcolor: "#f0f2f5",
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        scrollbarWidth: "thin",
      }}
    >
      <GlobalStyles
        styles={{
          "@media print": { ".type-tag, .sync-icon": { display: "none" } },
        }}
      />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper
          elevation={4}
          sx={{ p: "20mm 20mm 20mm 45mm", minHeight: "297mm" }}
        >
          {paragraphs.map((p) => (
            <ParagraphBlock
              key={p.id}
              p={p}
              onUpdate={handleUpdate}
              onEnter={handleEnter}
              onTab={handleTab}
              onSyncTimeline={onSyncTimeline}
              onDelete={handleDelete}
              colorVersion={counter} // Pass counter to trigger "soft" re-renders for colors
              onSceneClick={onSceneClick}
              isSelected={selectedSceneIds.includes(p.id)}
            />
          ))}
        </Paper>
      </Container>
    </Box>
  );
}
