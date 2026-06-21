import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Stack,
  Divider,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

// Matches the return type of useScreenplay
interface ScreenplayProp {
  document?: XMLDocument;
}

interface PopupButtonProps {
  screenplay?: ScreenplayProp;
}

/*Converts an FDX XMLDocument to a plain-text string suitable for an LLM prompt. */
function screenplayToText(doc: XMLDocument): string {
  const lines: string[] = [];

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) lines.push(text);
    } else {
      node.childNodes.forEach(walk);
    }
  }

  walk(doc.documentElement);
  return lines.join("\n");
}

export default function PopupButton({ screenplay }: PopupButtonProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loglines, setLoglines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoglineIndex, setSelectedLoglineIndex] = useState<
    number | null
  >(null);
  const [editMode, setEditMode] = useState(false);
  const [editedLogline, setEditedLogline] = useState("");

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

  const handleGenerateLoglines = async () => {
    if (!apiKey?.trim()) {
      setError(
        "No OpenAI API key found. Add VITE_OPENAI_API_KEY to your .env file.",
      );
      return;
    }

    if (!screenplay?.document) {
      setError("No screenplay loaded yet. Please open a script first.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoglines([]);
    setSelectedLoglineIndex(null);
    setEditMode(false);
    setEditedLogline("");

    try {
      const rawText = screenplayToText(screenplay.document);

      const prompt = [
        "Here is a screenplay in plain text:\n",
        "---",
        rawText,
        "---",
        "",
        "Based on the screenplay above, write exactly 3 distinct logline suggestions.",
        "Each logline should be one sentence (max ~50 words) that captures the",
        "protagonist, their goal, the central conflict, and the stakes.",
        notes ? `Additional notes from the writer: ${notes}` : "",
        "",
        'Return ONLY a JSON array of 3 strings, e.g. ["Logline 1", "Logline 2", "Logline 3"].',
        "No extra text, no markdown fences.",
      ]
        .filter(Boolean)
        .join("\n");

      const response = await fetch(
        "http://localhost:11434/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: "llama3",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert screenplay analyst. You write concise, compelling loglines. Always respond with valid JSON only.",
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 400,
          }),
        },
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(
          result?.error?.message ||
            `OpenAI request failed with status ${response.status}`,
        );
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content?.trim();

      if (!raw) throw new Error("No response returned from OpenAI.");

      // Strip markdown fences if the model ignores instructions
      const cleaned = raw.replace(/^```(?:json)?|```$/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Unexpected response format from OpenAI.");
      }

      setLoglines(parsed.slice(0, 3));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Create Log Line
      </Button>

      <Dialog
        open={open}
        onClose={() => !loading && setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Generate Loglines</DialogTitle>

        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Based on your screenplay, StoryScope can suggest loglines to help
              you pitch your story or find its core. You can edit the
              suggestions or add notes to guide the generation.
            </Typography>

            <TextField
              fullWidth
              label="Notes for the logline (optional)"
              placeholder="e.g. Focus on the romantic subplot, keep it dark..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              variant="outlined"
              multiline
              minRows={2}
              disabled={loading}
            />

            {loading && (
              <Stack direction="row" alignItems="center" gap={1}>
                <CircularProgress size={18} />
                <Typography color="text.secondary">
                  Reading screenplay and generating loglines…
                </Typography>
              </Stack>
            )}

            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}

            {loglines.length > 0 && (
              <Stack gap={1.5}>
                <Divider />
                <Typography variant="subtitle2">
                  Suggestions — pick your favourite or use them as a starting
                  point:
                </Typography>

                {editMode && selectedLoglineIndex !== null ? (
                  <Stack gap={1}>
                    <Typography variant="subtitle2" color="primary">
                      Editing Option {selectedLoglineIndex + 1}:
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      value={editedLogline}
                      onChange={(e) => setEditedLogline(e.target.value)}
                      variant="outlined"
                    />
                    <Stack direction="row" gap={1}>
                      <Button
                        startIcon={<SaveIcon />}
                        variant="contained"
                        size="small"
                        onClick={() => {
                          const updatedLoglines = [...loglines];
                          updatedLoglines[selectedLoglineIndex] = editedLogline;
                          setLoglines(updatedLoglines);
                          setEditMode(false);
                          setEditedLogline("");
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        startIcon={<CancelIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setEditMode(false);
                          setEditedLogline("");
                        }}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <RadioGroup
                    value={selectedLoglineIndex?.toString() ?? ""}
                    onChange={(e) =>
                      setSelectedLoglineIndex(parseInt(e.target.value))
                    }
                  >
                    {loglines.map((line, i) => (
                      <Stack
                        key={i}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          backgroundColor:
                            selectedLoglineIndex === i
                              ? "primary.light"
                              : "action.hover",
                          border: "2px solid",
                          borderColor:
                            selectedLoglineIndex === i
                              ? "primary.main"
                              : "divider",
                          transition: "all 0.2s",
                          cursor: "pointer",
                        }}
                        onClick={() => setSelectedLoglineIndex(i)}
                      >
                        <Stack direction="row" gap={1} alignItems="flex-start">
                          <FormControlLabel
                            value={i.toString()}
                            control={<Radio />}
                            label={
                              <Stack gap={0.5} flex={1}>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 0.25 }}
                                >
                                  Option {i + 1}
                                </Typography>
                                <Typography variant="body1">{line}</Typography>
                              </Stack>
                            }
                            sx={{ width: "100%", m: 0 }}
                          />
                          {selectedLoglineIndex === i && (
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditMode(true);
                                setEditedLogline(line);
                              }}
                            >
                              Edit
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                    ))}
                  </RadioGroup>
                )}
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleGenerateLoglines}
            disabled={loading}
            variant="contained"
          >
            {loading ? "Generating…" : "Generate Loglines"}
          </Button>
          {loglines.length > 0 &&
            selectedLoglineIndex !== null &&
            !editMode && (
              <Button
                onClick={() => {
                  // You can add logic here to save the selected logline
                  // For now, we just show a success state
                  console.log(
                    `Selected logline ${selectedLoglineIndex + 1}: ${loglines[selectedLoglineIndex]}`,
                  );
                  setOpen(false);
                }}
                variant="contained"
                color="success"
              >
                Use This Logline
              </Button>
            )}
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
