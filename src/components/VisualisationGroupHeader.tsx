import { Typography } from "@mui/material";

export function VisualisationGroupHeader({ title }: { title: string }) {
    return <div style={{
        position: "sticky",
        backgroundColor: "white",
        zIndex: 100,
        borderRadius: "8px",
        top: 0,
    }}>
        <Typography fontWeight="bold" color="#1a237e" padding={1} paddingX={1.5}>
            {title}
        </Typography>
        <hr style={{ border: "solid 1px #e8eaf6", marginTop: 0 }} />
    </div>;
}