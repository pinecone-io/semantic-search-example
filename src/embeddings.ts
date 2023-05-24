import { Vector } from "@pinecone-database/pinecone";
import { v4 as uuidv4 } from "uuid";
import { sliceIntoChunks } from "./utils/util";

class Embedder {
  private pipe: any = null;

  constructor() {
    this.init();
  }

  // Initialize the pipeline
  private async init() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const { Pipeline } = await import("@xenova/transformers");
    this.pipe = await Pipeline.load(
      "embeddings",
      "sentence-transformers/all-MiniLM-L6-v2"
    );
  }

  // Embed a single string
  async embed(text: string): Promise<Vector> {
    const result = this.pipe && (await this.pipe(text));
    return {
      id: uuidv4(),
      metadata: {
        text,
      },
      values: Array.from(result.data),
    };
  }

  // Batch an array of string and embed each batch
  // Call onDoneBatch with the embeddings of each batch
  async embedBatch(
    texts: string[],
    batchSize: number,
    onDoneBatch: (embeddings: Vector[]) => void
  ) {
    const batches = sliceIntoChunks<string>(texts, batchSize);
    for (const batch of batches) {
      const embeddings = await Promise.all(
        batch.map((text) => this.embed(text))
      );
      onDoneBatch(embeddings);
    }
  }
}

const embedder = new Embedder();

export { embedder };
