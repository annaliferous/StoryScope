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

export function Timeline({ doc, height, width, onClick }: TimelineProps) {
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
            info:{
                main: deepPurple[300],
                light: deepPurple[100],
                dark: deepPurple[500],
            }
            
        },
});
    const palette = [theme.palette.primary.main, theme.palette.primary.light, theme.palette.primary.dark,theme.palette.secondary.main, theme.palette.secondary.light, theme.palette.secondary.dark];

    const series = data.scenes.map((scene, idx) => ({
        label: scene.name,
        data: [(scene.length / data.sceneTotals) * 100],
        stack: 'scenes',
        color: palette[idx % palette.length],
        valueFormatter: (v: number | null) => (v !== null ? v.toFixed(2) + '%' : ''),
    }));

    return <BarChart
        yAxis={[
            {
                id: 'timelineCategories',
                data: ['Scenes'],
                position: 'none'
            },
        ]}
        xAxis={[{
            position: 'none'
        }]}
        series={series}
        slotProps={{
            tooltip: { trigger: 'item' }
        }}
        layout='horizontal'
        width={width}
        height={height}
        margin={0}
        skipAnimation
        axisHighlight={{ x: 'none', y: 'none' }}
        hideLegend
        onItemClick={(_, barItem) => {
            // barItem.seriesId = auto-generated-id-143
            // we need to get the index at the last position e.g. 143
            const clickedIndex = parseInt(barItem.seriesId.toString().split("-").at(-1) || "0");
            onClick(data.scenes[clickedIndex]);
        }}
    />;
}
