// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { BabyAGI } from './babyAgi/babyAgi'
import { PineconeStore } from 'langchain/vectorstores';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { createIndexIfNotExists, getPineconeClient } from './utils/pinecone';
import { OpenAI } from 'langchain/llms/openai';
import inquirer from 'inquirer';

const run = async () => {
  const client = await getPineconeClient()
  const indexName = "babyagi"

  await createIndexIfNotExists(client, indexName)
  const pineconeIndex = client.Index(indexName)

  const model = new OpenAI({ temperature: 0 });

  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(),
    { pineconeIndex }
  );

  const answer = await inquirer.prompt([{
    name: 'objective',
    message: `What is the AI's objective?`,
  }, {
    name: 'numberIterations',
    message: `How many iterations should the AI apply to achieve this task?`,
  },
  {
    name: 'verbose',
    message: `Would you like to use verbose mode?`,
    type: 'confirm',
  }
  ])

  const babyAgi = new BabyAGI(model, false, vectorStore, answer.numberIterations);

  await babyAgi.execute({ "objective": answer.objective })

  //Cleanup
  await client.deleteIndex({ indexName })
}

run()