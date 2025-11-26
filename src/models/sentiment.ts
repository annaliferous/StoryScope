// Code adapted from https://github.com/huggingface/transformers.js-examples/blob/main/react-translator/src/worker.js

import { pipeline, TextClassificationPipeline, type PipelineType, type ProgressCallback, type TextClassificationOutput } from "@huggingface/transformers";

export interface SentimentRequest {
    id: number
    text: string
}

export type SentimentResult = SentimentRequest & {
    status: string
    output: TextClassificationOutput | TextClassificationOutput[]
}

class SentimentPipeline {
    static task: PipelineType = "sentiment-analysis";
    static model = "Xenova/distilbert-base-uncased-finetuned-sst-2-english";
    static instance: TextClassificationPipeline | null = null;

    static async getInstance(progress_callback?: ProgressCallback) {
        if (!this.instance) {
            const result = await pipeline(this.task, this.model, {
                progress_callback,
                dtype: "q4",
            });

            this.instance = result as TextClassificationPipeline;
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener("message", async (event: MessageEvent<SentimentRequest>) => {
    const sentimentAnalyzer = await SentimentPipeline.getInstance((progressEvents) => {
        // We also add a progress callback to the pipeline so that we can
        // track model loading.
        self.postMessage(progressEvents);
    });

    const output = await sentimentAnalyzer(event.data.text, { top_k: 2 });
    console.log("Output", output);
    self.postMessage({
        ...event.data,
        status: "complete",
        output: output,
    } as SentimentResult);
});