# Semantic Search

In this walkthrough we will see how to use Pinecone for semantic search.

## Setup

Prerequisites:

- `Node.js` version >=18.0.0

Clone the repository and install the dependencies.

```
git clone git@github.com:pinecone-io/semantic-search-example.git
cd semantic-search-example
npm install
```

### Configuration

In order to run this example, you have to supply the Pinecone credentials needed to interact with the Pinecone API. You can find these credentials in the Pinecone web console. This project uses `dotenv` to easily load values from the `.env` file into the environment when executing.

Copy the template file:

```sh
cp .env.example .env
```

And fill in your API key and index name:

```sh
PINECONE_API_KEY=<your-api-key>
PINECONE_INDEX="semantic-search"
PINECONE_CLOUD="aws"
PINECONE_REGION="us-west-2"
```

`PINECONE_INDEX` is the name of the index where this demo will store and query embeddings. You can change `PINECONE_INDEX` to any name you like, but make sure the name not going to collide with any indexes you are already using.

`PINECONE_CLOUD` and `PINECONE_REGION` define where the index should be deployed. Currently, this is the only available cloud and region combination (`aws` and `us-west-2`), so it's recommended to leave them defaulted.

### Building

To build the project please run the command:

```sh
npm run build
```

## Application structure

There are two main components to this application: the data loader (load.ts) and the search engine (query.ts). The data loader is responsible for loading the data into Pinecone. The search engine is responsible for querying the index and returning similar results. These two components share a common modules, the `embedder`, which transforms natural language strings into embeddings using the [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) model.

## Data Preprocessing

The data loading process starts with the CSV file. This file contains the articles that will be indexed and made searchable. To load this data, the project uses the `papaparse` library. The loadCSVFile function in `csvLoader.ts` reads the file and uses `papaparse` to parse the CSV data into JavaScript objects. The `dynamicTyping` option is set to true to automatically convert the data to the appropriate types. After this step, you will have an array of objects, where each object represents an article​.

```typescript
import fs from 'fs/promises';
import Papa from 'papaparse';

async function loadCSVFile(
  filePath: string
): Promise<Papa.ParseResult<Record<string, unknown>>> {
  try {
    // Get csv file absolute path
    const csvAbsolutePath = await fs.realpath(filePath);

    // Create a readable stream from the CSV file
    const data = await fs.readFile(csvAbsolutePath, 'utf8');

    // Parse the CSV file
    return await Papa.parse(data, {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export default loadCSVFile;
```

## Building embeddings

The text embedding operation is performed in the `Embedder` class. This class uses a pipeline from the [`@xenova/transformers`](https://github.com/xenova/transformers.js) library to generate embeddings for the input text. We use the [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) model to generate the embeddings. The class provides methods to embed a single string or an array of strings in batches​ - which will come in useful a bit later.

```typescript
import type { PineconeRecord } from '@pinecone-database/pinecone';
import type { TextMetadata } from './types.js';
import { Pipeline } from '@xenova/transformers';
import { v4 as uuidv4 } from 'uuid';
import { sliceIntoChunks } from './utils/util.js';

class Embedder {
  private pipe: Pipeline | null = null;

  // Initialize the pipeline
  async init() {
    const { pipeline } = await import('@xenova/transformers');
    this.pipe = await pipeline('embeddings', 'Xenova/all-MiniLM-L6-v2');
  }

  // Embed a single string
  async embed(text: string): Promise<PineconeRecord<TextMetadata>> {
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
    onDoneBatch: (embeddings: PineconeRecord<TextMetadata>[]) => void
  ) {
    const batches = sliceIntoChunks<string>(texts, batchSize);
    for (const batch of batches) {
      const embeddings = await Promise.all(
        batch.map((text) => this.embed(text))
      );
      await onDoneBatch(embeddings);
    }
  }
}

const embedder = new Embedder();

export { embedder };
```

## Loading embeddings into Pinecone

Now that we have a way to load data and create embeddings, let put the two together and save the embeddings in Pinecone. In the following section, we get the path of the file we need to process from the command like. We load the CSV file, create the Pinecone index and then start the embedding process. The embedding process is done in batches of 1000. Once we have a batch of embeddings, we insert them into the index.

```typescript
import cliProgress from 'cli-progress';
import { config } from 'dotenv';
import loadCSVFile from './csvLoader.js';

import { embedder } from './embeddings.js';
import { Pinecone } from '@pinecone-database/pinecone';
import { getEnv, validateEnvironmentVariables } from './utils/util.js';

import type { TextMetadata } from './types.js';

// Load environment variables from .env
config();

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

let counter = 0;

export const load = async (csvPath: string, column: string) => {
  validateEnvironmentVariables();

  // Get a Pinecone instance
  const pinecone = new Pinecone();

  // Create a readable stream from the CSV file
  const { data, meta } = await loadCSVFile(csvPath);

  // Ensure the selected column exists in the CSV file
  if (!meta.fields?.includes(column)) {
    console.error(`Column ${column} not found in CSV file`);
    process.exit(1);
  }

  // Extract the selected column from the CSV file
  const documents = data.map((row) => row[column] as string);

  // Get index name, cloud, and region
  const indexName = getEnv('PINECONE_INDEX');
  const indexCloud = getEnv('PINECONE_CLOUD');
  const indexRegion = getEnv('PINECONE_REGION');

  // Create a Pinecone index with a dimension of 384 to hold the outputs
  // of our embeddings model. Use suppressConflicts in case the index already exists.
  await pinecone.createIndex({
    name: indexName,
    dimension: 384,
    spec: {
      serverless: {
        region: indexRegion,
        cloud: indexCloud,
      },
    },
    waitUntilReady: true,
    suppressConflicts: true,
  });

  // Select the target Pinecone index. Passing the TextMetadata generic type parameter
  // allows typescript to know what shape to expect when interacting with a record's
  // metadata field without the need for additional type casting.
  const index = pinecone.index<TextMetadata>(indexName);

  // Start the progress bar
  progressBar.start(documents.length, 0);

  // Start the batch embedding process
  await embedder.init();
  await embedder.embedBatch(documents, 100, async (embeddings) => {
    counter += embeddings.length;
    // Whenever the batch embedding process returns a batch of embeddings, insert them into the index
    await index.upsert(embeddings);
    progressBar.update(counter);
  });

  progressBar.stop();
  console.log(`Inserted ${documents.length} documents into index ${indexName}`);
};
```

To run the script for loading data into pinecone database, use the following command:

```sh
npm start -- load --csvPath=<path-to-csv-file> --column=<column-name>
```

To test our search engine, we'll use the `test.csv` found in the same repo. This file has two columns (`question1` and `question2`) which include similar questions.

To index both columns, we'll run:

```sh
npm start -- load --csvPath=test.csv --column=question1
```

and

```sh
npm start -- load --csvPath=test.csv --column=question2
```

The indexer will set up the index, wait for it to initialize, and then start the embedding process. We should see something like this when then indexer is working:

```sh
Creating index semantic-search
Waiting until index is ready...
Index ready after 45 seconds
Index is ready.
█████████████████████░░░░░░░░░░░░░░░░░░░ 52% | ETA: 291s | 52000/99999
```

## Making queries

Now that our index is populated we can begin making queries. We are performing a semantic search for similar questions, so we should embed and search with another question.

```typescript
import { config } from 'dotenv';
import { embedder } from './embeddings.js';
import { Pinecone } from '@pinecone-database/pinecone';
import { getEnv, validateEnvironmentVariables } from './utils/util.js';
import type { TextMetadata } from './types.js';

config();

export const query = async (query: string, topK: number) => {
  validateEnvironmentVariables();
  const pinecone = new Pinecone();

  // Target the index
  const indexName = getEnv('PINECONE_INDEX');
  const index = pinecone.index<TextMetadata>(indexName);

  await embedder.init();

  // Embed the query
  const queryEmbedding = await embedder.embed(query);

  // Query the index using the query embedding
  const results = await index.query({
    vector: queryEmbedding.values,
    topK,
    includeMetadata: true,
    includeValues: false,
  });

  // Print the results
  console.log(
    results.matches?.map((match) => ({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      text: match.metadata?.text,
      score: match.score,
    }))
  );
};
```

The querying process is very similar to the indexing process. We create a Pinecone client, select the index we want to query, and then embed the query. We then use the `query` method to search the index for the most similar embeddings. The `query` method returns a list of matches. Each match contains the metadata associated with the embedding, as well as the score of the match.

Let's run some queries and see what we get:

```sh
npm start -- query --query="which city has the highest population in the world?" --topK=2
```

The result for this will be something like:

```js
[
  {
    text: 'Which country in the world has the largest population?',
    score: 0.79473877,
  },
  {
    text: 'Which cities are the most densely populated?',
    score: 0.706895828,
  },
];
```

These are clearly very relevant results. All of these questions either share the exact same meaning as our question, or are related. We can make this harder by using more complicated language, but as long as the "meaning" behind our query remains the same, we should see similar results.

```sh
 npm start -- query --query="which urban locations have the highest concentration of homo sapiens?" --topK=2
```

And the result:

```js
[
  {
    text: 'Which cities are the most densely populated?',
    score: 0.66688776,
  },
  {
    text: 'What are the most we dangerous cities in the world?',
    score: 0.556335568,
  },
];
```

Here we used very different language with completely different terms in our query than that of the returned documents. We substituted "city" for "urban location" and "populated" for "concentration of homo sapiens".

Despite these very different terms and lack of term overlap between query and returned documents — we get highly relevant results — this is the power of semantic search.

You can go ahead and ask more questions above. When you're done, delete the index to save resources:

```sh
npm start -- delete
```
