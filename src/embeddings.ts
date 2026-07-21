import { pipeline } from "@xenova/transformers";
import { v4 as uuid } from "uuid";
import { PineconeRecord } from "@pinecone-database/pinecone";
import { TextMetadata } from "./types";
import { sliceIntoChunks } from "./utils/util";

class Embedder {
  private pipe: any;

  async init() {
    this.pipe = await pipeline("embeddings", "Xenova/all-MiniLM-L6-v2");
  }

  async embed(text: string): Promise<PineconeRecord<TextMetadata>> {
    const result = await this.pipe(text, {
      pooling: "mean",
      normalize: true,
    });
    return {
      id: uuid(),
      metadata: { text },
      values: Array.from(result.data),
    };
  }

  async embedBatch(
    texts: string[],
    batchSize: number,
    onDoneBatch: (embeddings: PineconeRecord<TextMetadata>[]) => void,
  ) {
    const batches = sliceIntoChunks<string>(texts, batchSize);
    for (const batch of batches) {
      const embeddings = await Promise.all(
        batch.map((text) => this.embed(text)),
      );
      await onDoneBatch(embeddings);
    }
  }
}

export { Embedder };
