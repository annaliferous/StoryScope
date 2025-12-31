import { useCallback, useEffect, useRef, useState } from "react";
import type { SentimentResult } from "../models/sentiment";

interface SentimentJob {
    id: number
    resolve: (v: SentimentResult) => void
    reject: (v: unknown) => void
}

export function useSentiment() {
    const counter = useRef<number>(0);
    const jobs = useRef<Map<number, SentimentJob>>(new Map());
    const worker = useRef<Worker>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Spawn background thread which does the sentiment analysis
        worker.current ??= new Worker(new URL("../models/sentiment.ts", import.meta.url), {
            type: "module",
        });

        worker.current.addEventListener("message", (event) => {
            if (event.data.status === "done") {
                setIsInitialized(true);
                return;
            }
            const data = event.data as SentimentResult;
            const job = jobs.current.get(data.id);
            if (!job) return;

            job.resolve(data);
            jobs.current.delete(data.id);
        });
    }, []);

    function analyze(text: string) {
        const promise: Promise<SentimentResult> = new Promise((resolve, reject) => {
            const id = ++counter.current;

            jobs.current.set(id, {
                id,
                reject,
                resolve,
            });

            // Save computing power, by resolving empty strings to neutral.
            if (!text) {
                resolve({
                    id, text, status: "complete", output: [{
                        label: "POSITIVE",
                        score: 0
                    }, {
                        label: "NEGATIVE",
                        score: 0
                    }]
                });
                return;
            }

            worker.current?.postMessage({
                text,
                id,
            });
        });

        return promise;
    }

    return {
        analyze: useCallback(analyze, []),
        isInitialized,
    };
}