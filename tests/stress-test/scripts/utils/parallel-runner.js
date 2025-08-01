const os = require('os');

const chunkArray = (arr, size) => {
  return arr.reduce(
    (acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]),
    []
  );
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class ParallelRunner {
  constructor({ maxConcurrency = os.cpus().length, retries = 1, delayBetweenBatches = 0 }) {
    this.maxConcurrency = maxConcurrency;
    this.retries = retries;
    this.delayBetweenBatches = delayBetweenBatches;
  }

  async run(tasks, handler) {
    const chunks = chunkArray(tasks, this.maxConcurrency);
    const allResults = [];

    for (let i = 0; i < chunks.length; i++) {
      const batch = chunks[i];
      console.info(`🚀 Running batch ${i + 1}/${chunks.length} (${batch.length} items)`);

      const results = await Promise.allSettled(
        batch.map((item, idx) => this._withRetries(() => handler(item, idx)))
      );

      allResults.push(...results);

      if (this.delayBetweenBatches > 0) {
        await sleep(this.delayBetweenBatches);
      }
    }

    return {
      results: allResults.map((r) => r.status === 'fulfilled' ? r.value : null),
      errors: allResults
        .filter((r) => r.status === 'rejected')
        .map((r) => r.reason?.message || r.reason || 'Unknown error'),
    };
  }

  async _withRetries(fn) {
    let attempts = 0;
    let lastErr;
    while (attempts <= this.retries) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        attempts++;
        if (attempts <= this.retries) {
          console.error(`Retry attempt ${attempts} failed: ${err.message}`);
        }
      }
    }
    throw lastErr;
  }
}

module.exports = ParallelRunner;
