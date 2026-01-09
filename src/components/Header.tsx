import { AppBar, Button, Toolbar, Typography } from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';

export function Header({ onActionClick }: { onActionClick: React.MouseEventHandler<HTMLButtonElement> }) {
    return <AppBar position="static">
        <Toolbar variant="dense">
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: "16px" }}>
                StoryScope
            </Typography>
            <Button size="small" color="secondary" onClick={onActionClick} variant="contained" sx={{ borderRadius: "50px" }}>
                <UploadFileIcon /> Upload File
            </Button>
        </Toolbar>
    </AppBar>;
}