import { Heatmap, type HeatmapValueType } from "@mui/x-charts-pro";
import { useEffect, useMemo, useState } from "react";
import { useSentiment } from "../hooks/useSentiment";
import { getSceneDialog, type Screenplay } from "../hooks/useScreenplay";
import type { SceneInfo } from "../hooks/useTimeline";
import type { SentimentResult } from "../models/sentiment";

function removeMuiWatermark() {
    Array.from(document.querySelectorAll('div'))
        .find(el => el.textContent === 'MUI X Missing license key')
        ?.remove();
}

function getSentimentScore(sentimentResult: SentimentResult) {
    const output = sentimentResult.output;
    const pos = output.find(v => v?.label === "POSITIVE")?.score;
    const neg = output.find(v => v?.label === "NEGATIVE")?.score;

    return (pos - neg) * 100;
}

export function CharacterHeatmap({ scene, screenplay }: { scene?: SceneInfo, screenplay?: Screenplay }) {

    const { analyze } = useSentiment();
    const dialogs = useMemo(() => getSceneDialog(scene?.id, screenplay?.document), [scene?.id, screenplay?.document]);
    const characters = useMemo(() => [...new Set(dialogs.map(d => d.character))], [dialogs]);
    const [heatmapData, setHeatmapData] = useState<HeatmapValueType[]>([]);

    useEffect(removeMuiWatermark);
    useEffect(() => {
        const run = async () => {
            const sentiments = await Promise.all(
                dialogs.map(d => analyze(d.text.trim()))
            );

            // Create a score matrix initialized with 0
            const totals = Array.from({ length: characters.length }, () =>
                Array.from({ length: characters.length }, () => 0)
            );

            for (let i = 0; i < dialogs.length; i++) {
                const dialog = dialogs[i];
                const sentiment = sentiments[i];

                const score = getSentimentScore(sentiment);

                const speakerIndex = characters.indexOf(dialog.character);

                // Add score to all other characters
                for (let j = 0; j < characters.length; j++) {
                    if (j === speakerIndex) continue; // skip same character
                    totals[speakerIndex][j] += score;
                }
            }

            // Convert matrix to HeatmapValueType[] format
            const data: HeatmapValueType[] = [];

            for (let x = 0; x < characters.length; x++) {
                for (let y = 0; y < characters.length; y++) {
                    if (x === y) continue; // skip diagonal
                    data.push([x, y, totals[x][y]]);
                }
            }

            setHeatmapData(data);
        };

        run();
    }, [analyze, dialogs, characters]);


    return <>
        <h1>{scene?.name}</h1>
        <p>{dialogs.at(0)?.character}</p>
        <Heatmap
            xAxis={[{ data: characters }]}
            yAxis={[{ data: characters }]}
            series={[{
                data: heatmapData,
            }]}
            height={500}
        />
    </>;
}
