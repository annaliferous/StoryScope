import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useState, type ChangeEvent } from "react";

interface WelcomeDialogProps {
  isOpen: boolean;
  onChange: (fdxFileUrl: string) => void;
}

const FDX_FILE_DEFAULT = `${import.meta.env.BASE_URL}skyfall.fdx`;
console.log("Fetching FDX:", FDX_FILE_DEFAULT);

export default function WelcomeDialog({
  isOpen,
  onChange,
}: WelcomeDialogProps) {
  const [fdxFileUrl, setFdxFileUrl] = useState(FDX_FILE_DEFAULT);
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer]);

    const url = URL.createObjectURL(blob);
    setFdxFileUrl(url);
  };
  return (
    <Dialog
      open={isOpen}
      onClose={() => onChange(fdxFileUrl)}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title"><img src="./public/storyScopeIcon.svg" alt="StoryScope Icon" width={48}/> StoryScope</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          <label htmlFor="fdx-upload">
            Drop a .fdx file below to import your script.
          </label>
          <br />
          <input
            style={{
              padding: 32,
              borderStyle: "dashed",
              borderRadius: 12,
            }}
            id="fdx-upload"
            onChange={handleFileUpload}
            type="file"
          />
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onChange(fdxFileUrl)}>sample script</Button>
        <Button
          variant="contained"
          disabled={fdxFileUrl === FDX_FILE_DEFAULT}
          onClick={() => onChange(fdxFileUrl)}
          autoFocus
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
}
