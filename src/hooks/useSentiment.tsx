import { useEffect, useRef } from "react";
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

    useEffect(() => {
        // Spawn background thread which does the sentiment analysis
        worker.current ??= new Worker(new URL("../models/sentiment.ts", import.meta.url), {
            type: "module",
        });

        worker.current.addEventListener("message", (event) => {
            const data = event.data as SentimentResult;
            const job = jobs.current.get(data.id);
            if (!job) return;
            if (data.status === "complete") {
                job.resolve(data);
                jobs.current.delete(data.id);
            }
        });
    });

    function analyze(text: string) {
        const promise: Promise<SentimentResult> = new Promise((resolve, reject) => {
            const id = ++counter.current;

            worker.current?.postMessage({
                text,
                id,
            });

            jobs.current.set(id, {
                id,
                reject,
                resolve,
            });
        });

        return promise;
    }

    return {
        analyze
    };
}