import { BarChart } from '@mui/x-charts/BarChart';
import { useTimeline, type SceneInfo } from '../hooks/useTimeline';
import { createTheme } from '@mui/material/styles';
import { deepPurple, indigo, teal } from '@mui/material/colors';

interface TimelineProps {
    doc: XMLDocument
    height: number
    width?: number
    onClick: (scene: SceneInfo) => void
}

export function Timeline({ doc, height, onClick }: TimelineProps) {
    const data = useTimeline(doc);
    // call hook inside component
    const theme = createTheme({
        palette: {
            primary: {
                main: indigo[500],
                light: indigo[300],
                dark: indigo[700],
            },
            secondary: {
                main: teal[300],
                light: teal[100],
                dark: teal[500],
            },
            info: {
                main: deepPurple[300],
                light: deepPurple[100],
                dark: deepPurple[500],
            }

        },
    });
    const palette = [theme.palette.primary.main, theme.palette.primary.light, theme.palette.primary.dark, theme.palette.secondary.main, theme.palette.secondary.light, theme.palette.secondary.dark];

    const series = data.scenes.map((scene, idx) => ({
        label: scene.name,
        data: [(scene.length / data.sceneTotals) * 100],
        stack: 'scenes',
        color: palette[idx % palette.length],
        valueFormatter: (v: number | null) => (v !== null ? v.toFixed(2) + '%' : ''),
    }));

    return <div style={{
        display: "flex",
        whiteSpace: "nowrap",
    }}>
        {series.map((item, index) => {
            return <div style={{
                height: "40px",
                width: `${(item.data[0] * 1000).toFixed(0)}px`,
                backgroundColor: item.color,
                textAlign: "center",
                flexShrink: 0,
                borderRadius: "8px",
                marginRight: "4px",
            }}
                title={item.label}
                onClick={() => {
                    onClick(data.scenes[index])
                }}
            >
                {item.label}
            </div>;
        })}
    </div>;
}
