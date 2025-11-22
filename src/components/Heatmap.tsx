import { Heatmap, type HeatmapValueType } from "@mui/x-charts-pro";
import { useEffect } from "react";

export const data: HeatmapValueType[] = [
    [0, 0, 10],
    [0, 1, 20],
    [0, 2, 40],
    [0, 3, 90],
    [0, 4, 70],
    [1, 0, 30],
    [1, 1, 50],
    [1, 2, 10],
    [1, 3, 70],
    [1, 4, 40],
    [2, 0, 50],
    [2, 1, 20],
    [2, 2, 90],
    [2, 3, 20],
    [2, 4, 70],
    [3, 0, 40],
    [3, 1, 50],
    [3, 2, 20],
    [3, 3, 70],
    [3, 4, 90],
];

export function CharacterHeatmap({ doc }: { doc: XMLDocument }) {
    function removeMuiWatermark() {
        Array.from(document.querySelectorAll('div'))
            .find(el => el.textContent === 'MUI X Missing license key')
            ?.remove();
    }
    useEffect(removeMuiWatermark);

    return <Heatmap
        xAxis={[{ data: [1, 2, 3, 4] }]}
        yAxis={[{ data: ['A', 'B', 'C', 'D', 'E'] }]}
        series={[{
            data,
        }]}
        height={300}
    />;
}
