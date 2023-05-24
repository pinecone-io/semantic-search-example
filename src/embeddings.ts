/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { pipeline } from "@xenova/transformers";
import { Vector } from "@pinecone-database/pinecone";
import { randomUUID } from "crypto";
import { sliceIntoChunks } from "./utils/util";

class Embedder {
  private pipe: any;

  async init() {
    this.pipe = await pipeline(
      "embeddings",
      "sentence-transformers/all-MiniLM-L6-v2"
    );
  }

  async embed(text: string): Promise<Vector> {
    const result = await this.pipe(text);
    return {
      id: randomUUID(),
      metadata: {
        text,
      },
      values: Array.from(result.data),
    };
  }

  async embedBatch(
    texts: string[],
    batchSize: number,
    onDoneBatch: (embeddings: Vector[]) => void
  ) {
    const batches = sliceIntoChunks<string>(texts, batchSize);
    for (const batch of batches) {
      const embeddings = await Promise.all(batch.map((text) => this.embed(text)));
      await onDoneBatch(embeddings);
    }
  }
}

const embedder = new Embedder();

export { embedder };
