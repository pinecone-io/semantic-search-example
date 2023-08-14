export const randomizeIndexName = (indexName: string) => {
  // Extend index name with uniqe sufix to ensure that we do not have same index name
  // In case we delete and create multiple times index with same name error will occure:
  // Error upserting chunk [PineconeError: PineconeClient: Error calling upsert: PineconeError: PineconeClient: Error calling upsertRaw: no healthy upstream]
  // Note that this is known bug

  // eg. index-name-1691651465647
  return `${indexName}-${new Date().getTime()}`;
};
