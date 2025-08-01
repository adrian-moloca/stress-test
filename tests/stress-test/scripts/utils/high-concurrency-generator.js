const os = require('os');

const chunkArray = (arr, size) => {
  return arr.reduce(
    (acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]),
    []
  );
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class HighConcurrencyGenerator {
  constructor(generatorInstance, options = {}) {
    this.generator = generatorInstance;
    this.maxConcurrency = options.maxConcurrency || os.cpus().length * 2;
    this.subBatchSize = options.subBatchSize || 50;
    this.pauseBetweenChunks = options.pauseBetweenChunks || 0;
  }

  async generate(volume) {
    const batchIndices = Array.from({ length: volume }, (_, i) => i);
    const chunks = chunkArray(batchIndices, this.subBatchSize);
    const generated = [];

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      console.info(`⚙️ Generating chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} cases)`);

      const results = await Promise.allSettled(
        chunk.map((i) => this.generator.generateSingleCase(i))
      );

      const successful = results
        .filter((res) => res.status === 'fulfilled')
        .map((res) => res.value);

      const failed = results
        .filter((res) => res.status === 'rejected')
        .map((res) => res.reason?.message || res.reason || 'Unknown error');

      if (failed.length) {
        console.error(`❌ ${failed.length} errors during generation:`, failed.slice(0, 3));
      }

      generated.push(...successful);

      if (this.pauseBetweenChunks > 0) {
        await sleep(this.pauseBetweenChunks);
      }
    }

    return generated;
  }
}

module.exports = HighConcurrencyGenerator;
