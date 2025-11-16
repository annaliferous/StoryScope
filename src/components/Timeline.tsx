import { BarChart } from '@mui/x-charts/BarChart';
import { useTimeline } from '../hooks/useTimeline';

interface TimelineProps {
    doc: XMLDocument
    height: number
    onClick: (offset: number) => void
}

export function Timeline({ doc, height, onClick }: TimelineProps) {
    const data = useTimeline(doc);
    console.log(data);
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
        series={data.scenes.map(scene => ({
            label: scene.name,
            data: [(scene.length / data.sceneTotals) * 100],
            stack: 'scenes',
            valueFormatter: (v => v?.toFixed(2) + "%")
        }))
        }
        slotProps={{
            tooltip: {
                trigger: 'item',
            }
        }}
        layout='horizontal'
        height={height}
        hideLegend
        onItemClick={(_, barItem) => {
            // barItem.seriesId = auto-generated-id-143
            // we need to get the index at the last position
            // then we can calculate the location as a percentage offset
            const clickedIndex = parseInt(barItem.seriesId.toString().split("-").at(-1) || "0");
            const offset = (clickedIndex / data.scenes.length);
            onClick(offset);
        }}
    />;
}