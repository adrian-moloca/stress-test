class ParallelRunner {
  constructor(options = {}) {
    this.maxParallel = options.maxParallel || 
      (process.env.MAX_PARALLEL_CASES ? parseInt(process.env.MAX_PARALLEL_CASES) : 3);
    
    this.maxParallel = Math.max(2, Math.min(5, this.maxParallel));
    
    this.batchSize = options.batchSize || 5;
    this.delayBetweenBatches = options.delayBetweenBatches || 1000;
    this.retryAttempts = options.retryAttempts || 3;
  }

  async run(items, processor) {
    console.log(`🔄 Processing ${items.length} items with max ${this.maxParallel} parallel operations`);
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchPromises = [];
      
      for (let j = 0; j < batch.length; j += this.maxParallel) {
        const parallelItems = batch.slice(j, j + this.maxParallel);
        const parallelPromises = parallelItems.map((item, index) => 
          this.processWithRetry(item, processor, i + j + index)
        );
        
        const parallelResults = await Promise.allSettled(parallelPromises);
        batchPromises.push(...parallelResults);
      }
      
      // Collect results
      for (const result of batchPromises) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push(result.reason);
        }
      }
      
      // Delay between batches
      if (i + this.batchSize < items.length) {
        await this.delay(this.delayBetweenBatches);
      }
      
      const processed = Math.min(i + this.batchSize, items.length);
      console.log(`   📊 Progress: ${processed}/${items.length} (${(processed/items.length*100).toFixed(1)}%)`);
    }
    
    return { results, errors };
  }

  async processWithRetry(item, processor, index) {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await processor(item, index);
      } catch (error) {
        if (attempt === this.retryAttempts) {
          throw error;
        }
        await this.delay(1000 * attempt);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ParallelRunner;
