import { AppBar, Button, Toolbar, Typography } from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';

export function Header({ onActionClick }: { onActionClick: React.MouseEventHandler<HTMLButtonElement> }) {
    return <AppBar position="static">
        <Toolbar variant="dense" style={{ backgroundColor: "#e8eaf6" }}>
            <img src="./storyScopeIcon.svg" alt="StoryScope Icon" width={46} style={{ paddingRight: 16 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: "16px", color: "#1a237e" }}>
                StoryScope
            </Typography>
            <Button size="small" onClick={onActionClick} variant="contained" sx={{ borderRadius: "50px", backgroundColor: "#9fa8da", color: "#1a237e" }}>
                <UploadFileIcon /> Upload File
            </Button>
        </Toolbar>
    </AppBar>;
}