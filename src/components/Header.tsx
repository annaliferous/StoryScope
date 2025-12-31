import { AppBar, Fab, Toolbar, Typography } from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { teal } from '@mui/material/colors';

export function Header({ onActionClick }: { onActionClick: React.MouseEventHandler<HTMLButtonElement> }) {
    return <AppBar position="static">
        <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                StoryScope
            </Typography>
            <Fab variant="extended" aria-label="add" sx={{ mr: 1, bgcolor: teal[100], color: teal[900] }} size="medium" onClick={onActionClick}>
                <UploadFileIcon sx={{ mr: 1 }} /> Upload File
            </Fab>
        </Toolbar>
    </AppBar>;
}