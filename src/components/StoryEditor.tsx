import React, { useState, useCallback, useMemo, memo } from "react";
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
}

const parseXMLToState = (doc: XMLDocument): ScriptParagraph[] => {
  const nodes = Array.from(doc.getElementsByTagName("Paragraph"));
  return nodes.map((node) => ({
    id: node.getAttribute("id") || crypto.randomUUID(),
    type: node.getAttribute("Type") || "Action",
    text: node.getElementsByTagName("Text")[0]?.textContent || "",
  }));
};

const NEXT_TYPE_MAP: Record<string, ParagraphType> = {
  Action: "Scene Heading",
  "Scene Heading": "Character",
  Character: "Parenthetical",
  Parenthetical: "Dialogue",
  Dialogue: "Action",
};

const ParagraphBlock = memo(
  ({
    p,
    onUpdate,
    onEnter,
    onTab,
    onSyncTimeline,
  }: {
    p: ScriptParagraph;
    onUpdate: (id: string, text: string) => void;
    onEnter: (id: string) => void;
    onTab: (id: string) => void;
    onSyncTimeline?: (id: string) => void;
  }) => {
    const isCharacter = p.type === "Character";
    const isScene = p.type === "Scene Heading";
    const color = isCharacter ? getCharacterColor(p.text.trim()) : "#757575";

    return (
      <Box
        sx={{
          position: "relative",
          "&:hover .type-tag, &:focus-within .type-tag": { opacity: 1 },
          "&:hover .sync-icon": { opacity: 0.6 },
        }}
      >
        {isScene && (
          <IconButton
            className="sync-icon"
            onClick={() => onSyncTimeline?.(p.id)}
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

        <Box
          className="type-tag"
          contentEditable={false}
          sx={{
            position: "absolute",
            left: "-115px",
            top: "4px",
            opacity: 0,
            transition: "opacity 0.2s",
            width: "70px",
            textAlign: "right",
            pointerEvents: "none",
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

        <Box
          contentEditable
          suppressContentEditableWarning
          data-editor-id={p.id}
          onInput={(e) => onUpdate(p.id, e.currentTarget.textContent || "")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter(p.id);
            }
            if (e.key === "Tab") {
              e.preventDefault();
              onTab(p.id);
            }
          }}
          sx={{
            outline: "none",
            minHeight: "1.2em",
            mb: isCharacter ? 0.5 : 2,
            fontFamily: "'Courier Prime', monospace",
            fontSize: "12pt",
            whiteSpace: "pre-wrap",
            color: isCharacter ? color : "black",
            fontWeight: isScene ? "bold" : "normal",
            textTransform: isCharacter || isScene ? "uppercase" : "none",
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
            "&:focus": { borderLeft: "2px solid #1976d2", pl: 1 },
          }}
        >
          {p.text}
        </Box>
      </Box>
    );
  },
  (prev, next) =>
    prev.p.id === next.p.id &&
    prev.p.type === next.p.type &&
    prev.p.text === next.p.text,
);

export function StoryEditor({
  doc,
  onChange,
  onScroll,
  onSyncTimeline,
}: StoryEditorProps) {
  const [paragraphs, setParagraphs] = useState<ScriptParagraph[]>(() =>
    parseXMLToState(doc),
  );

  const debouncedSync = useMemo(
    () =>
      debounce((id: string, text: string) => {
        const node = doc.getElementById(id);
        if (node) {
          const textNode = node.getElementsByTagName("Text")[0];
          if (textNode) {
            textNode.textContent = text;
            onChange(doc);
          }
        }
      }, 1000),
    [doc, onChange],
  );

  const handleUpdate = useCallback(
    (id: string, newText: string) => debouncedSync(id, newText),
    [debouncedSync],
  );

  const handleTab = useCallback(
    (id: string) => {
      const idx = paragraphs.findIndex((p) => p.id === id);
      if (idx === -1) return;
      const nextType = NEXT_TYPE_MAP[paragraphs[idx].type] || "Action";
      const xmlNode = doc.getElementById(id);
      if (xmlNode) xmlNode.setAttribute("Type", nextType);
      const newParas = [...paragraphs];
      newParas[idx] = { ...newParas[idx], type: nextType };
      setParagraphs(newParas);
      onChange(doc);
    },
    [doc, paragraphs, onChange],
  );

  const handleEnter = useCallback(
    (currentId: string) => {
      const idx = paragraphs.findIndex((p) => p.id === currentId);
      const currentPara = paragraphs[idx];
      let nextType: ParagraphType = "Action";
      if (currentPara.type === "Character") nextType = "Dialogue";
      else if (currentPara.type === "Dialogue") nextType = "Action";

      const newId = crypto.randomUUID();
      const currentXmlNode = doc.getElementById(currentId);
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
      setParagraphs(parseXMLToState(doc));
      onChange(doc);
      setTimeout(
        () =>
          (
            document.querySelector(`[data-editor-id="${newId}"]`) as HTMLElement
          )?.focus(),
        0,
      );
    },
    [doc, paragraphs, onChange],
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
          sx={{ p: "20mm 20mm 20mm 30mm", minHeight: "297mm" }}
        >
          {paragraphs.map((p) => (
            <ParagraphBlock
              key={p.id}
              p={p}
              onUpdate={handleUpdate}
              onEnter={handleEnter}
              onTab={handleTab}
              onSyncTimeline={onSyncTimeline}
            />
          ))}
        </Paper>
      </Container>
    </Box>
  );
}
