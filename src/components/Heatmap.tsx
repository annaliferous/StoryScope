import { interpolateBlues, interpolateRdYlGn } from "d3-scale-chromatic";
import { Heatmap, type HeatmapValueType } from "@mui/x-charts-pro";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSentiment } from "../hooks/useSentiment";
import { getSceneDialog, type Dialog, type Screenplay } from "../hooks/useScreenplay";
import type { SceneInfo } from "../hooks/useTimeline";
import type { SentimentResult } from "../models/sentiment";

function removeMuiWatermark() {
    console.log("Removed MUI Watermark");
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

/**
 * Finds the index of the listener which the given character (index) is talking to.
 * If the dialog is the last one in the scene, we assume it is a reply to the character before.
 * If only one character is in the scene, we assume they are talking to themselves.
 * @param index the character which speaks
 * @param characters all characters which talk in the order of which they talk
 * @returns The index of the character which 
 */
function getNextCharacterIndex(index: number, characters: string[]) {
    const currentCharacter = characters[index];
    const nextCharacterIndex = characters.slice(index + 1).findIndex(char => char !== currentCharacter);
    if (nextCharacterIndex === -1) {
        const reverseArray = [...characters.slice(0, index)].reverse()
        const prevCharacterIndex = reverseArray.findIndex(char => char !== currentCharacter);
        if (prevCharacterIndex === -1) return index;
        return index - 1 - prevCharacterIndex;
    }
    return index + 1 + nextCharacterIndex;
}

enum InitState {
    initializing,
    loading,
    done,
}

export function CharacterHeatmap({ scene, screenplay }: { scene?: SceneInfo, screenplay?: Screenplay }) {

    const { analyze } = useSentiment();
    const dialogs = useMemo(() => getSceneDialog(scene?.id, screenplay?.document), [scene?.id, screenplay?.document]);
    const characters = useMemo(() => [...new Set(dialogs.map(d => d.character))], [dialogs]);
    const [heatmapData, setHeatmapData] = useState<HeatmapValueType[]>([]);
    const [initState, setInitState] = useState<InitState>(InitState.initializing);

    const getSentimentScoresByCharacter = useCallback(async function (dialogs: Dialog[]) {
        const characters = [...new Set(dialogs.map(d => d.character))];
        console.log(characters);

        const totals = Array.from({ length: characters.length }, () =>
            Array.from({ length: characters.length }, () => 0)
        );
        console.log("Totals", totals);

        const promises: Promise<SentimentResult>[] = [];
        const promiseCharacter: string[] = [];
        for (const dialog of dialogs) {
            const sentimentPromise = analyze(dialog.text.trim());
            promises.push(sentimentPromise);
            promiseCharacter.push(dialog.character);
        }
        console.log(promises, promiseCharacter);

        const results = await Promise.allSettled(promises);
        for (let i = 0; i < results.length; i++) {
            const result = results[i];

            // Don't count if an error occurred in sentiment analysis
            if (result.status === "rejected") continue;
            const sentiment = result.value;

            const score = getSentimentScore(sentiment);
            const speakerIndex = characters.indexOf(promiseCharacter[i]);

            const listenerIndex = getNextCharacterIndex(i, promiseCharacter);
            const talkingTo = characters.indexOf(promiseCharacter[listenerIndex]);
            totals[speakerIndex][talkingTo] += score;
        }

        return totals;
    }, [analyze]);

    useEffect(removeMuiWatermark, [initState]);
    useEffect(() => {
        analyze("initialize")
            .then(() => {
                setInitState(InitState.loading)
                return getSentimentScoresByCharacter(dialogs);
            })
            .then((scores) => {
                setHeatmapData(scores.flatMap((score, i) => score.map((s, j) => [i, j, s])));
            })
            .catch(console.error)
            .finally(() => setInitState(InitState.done));
    }, [setHeatmapData, dialogs, getSentimentScoresByCharacter])


    const maxValue = heatmapData.reduce((prev, curr) => prev >= curr[2] ? prev : curr[2], 0);
    const minValue = heatmapData.reduce((prev, curr) => prev < curr[2] ? prev : curr[2], Infinity);
    // Make sure that the color scale is always balanced
    const limitValue = Math.max(maxValue, Math.abs(minValue));
    return <>
        <h3 style={{ textAlign: "center", marginBottom: 0 }}>{initState !== InitState.initializing ? scene?.name : "Uninitialized"}</h3>
        {initState === InitState.done && <>
            <Heatmap
                xAxis={[{ data: characters }]}
                yAxis={[{ data: characters }]}
                zAxis={[{
                    colorMap: {
                        max: limitValue,
                        min: -limitValue,
                        type: 'continuous',
                        color: interpolateRdYlGn,
                    },
                }]}
                series={[{
                    data: heatmapData,
                    highlightScope: { highlight: 'item', fade: 'global' },
                }]}
                height={500}
            />
        </>}
    </>;
}
