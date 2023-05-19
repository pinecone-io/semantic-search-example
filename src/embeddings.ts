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

  async embedMany(texts: string[]): Promise<Vector[]> {
    return await Promise.all(texts.map((text) => this.embed(text)));
  }

  async embedBatch(
    texts: string[],
    batchSize: number,
    onDoneBatch: (embeddings: Vector[]) => void
  ) {
    const batches = sliceIntoChunks<string>(texts, batchSize);
    for (const batch in batches) {
      const embeddings = await this.embedMany(batches[batch]);
      await onDoneBatch(embeddings);
    }
  }
}

const embedder = new Embedder();

export { embedder };
