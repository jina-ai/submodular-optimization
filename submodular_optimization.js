import fs from 'fs';

// Priority Queue implementation for JavaScript
class PriorityQueue {
    constructor() {
        this.heap = [];
    }

    push(element) {
        this.heap.push(element);
        this._bubbleUp();
    }

    pop() {
        if (this.heap.length === 0) return null;

        const result = this.heap[0];
        const last = this.heap.pop();

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this._bubbleDown();
        }

        return result;
    }

    _bubbleUp() {
        let index = this.heap.length - 1;
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[parentIndex][0] <= this.heap[index][0]) break;

            [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
            index = parentIndex;
        }
    }

    _bubbleDown() {
        let index = 0;
        while (true) {
            let smallest = index;
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;

            if (leftChild < this.heap.length && this.heap[leftChild][0] < this.heap[smallest][0]) {
                smallest = leftChild;
            }

            if (rightChild < this.heap.length && this.heap[rightChild][0] < this.heap[smallest][0]) {
                smallest = rightChild;
            }

            if (smallest === index) break;

            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            index = smallest;
        }
    }

    isEmpty() {
        return this.heap.length === 0;
    }
}

// Cosine similarity function
function cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (norm1 * norm2);
}

// Compute marginal gain of adding new_idx to selected set
function computeMarginalGain(newIdx, selected, embeddings, relevanceScores, alpha) {
    if (selected.length === 0) {
        // First query: gain is sum of all relevance and coverage scores
        let totalGain = 0;
        for (let j = 0; j < embeddings.length; j++) {
            const relevanceScore = alpha * relevanceScores[j];
            const coverageScore = cosineSimilarity(embeddings[newIdx], embeddings[j]);
            totalGain += Math.max(relevanceScore, coverageScore);
        }
        return totalGain;
    }

    // Compute current coverage
    const currentCoverage = embeddings.map((_, j) => {
        const scores = [alpha * relevanceScores[j]];
        for (const s of selected) {
            scores.push(cosineSimilarity(embeddings[s], embeddings[j]));
        }
        return Math.max(...scores);
    });

    // Compute new coverage with additional query
    const newCoverage = embeddings.map((_, j) => {
        return Math.max(currentCoverage[j], cosineSimilarity(embeddings[newIdx], embeddings[j]));
    });

    // Return marginal gain
    const currentSum = currentCoverage.reduce((sum, val) => sum + val, 0);
    const newSum = newCoverage.reduce((sum, val) => sum + val, 0);
    return newSum - currentSum;
}

// Lazy greedy algorithm for submodular query selection
function lazyGreedyQuerySelection(candidates, embeddings, originalEmbedding, k, alpha = 0.3) {
    const n = candidates.length;
    const selected = [];

    // Precompute relevance scores
    const relevanceScores = embeddings.map(embedding =>
        cosineSimilarity(originalEmbedding, embedding)
    );

    // Initialize priority queue: [marginal_gain, last_updated, query_index]
    const pq = new PriorityQueue();
    for (let i = 0; i < n; i++) {
        const gain = computeMarginalGain(i, [], embeddings, relevanceScores, alpha);
        pq.push([-gain, 0, i]); // Use negative gain because PQ is min-heap
    }

    for (let iteration = 0; iteration < k; iteration++) {
        while (true) {
            const [negGain, lastUpdated, bestIdx] = pq.pop();

            // If this gain was computed in current iteration, it's definitely the best
            if (lastUpdated === iteration) {
                selected.push(bestIdx);
                break;
            }

            // Otherwise, recompute the marginal gain
            const currentGain = computeMarginalGain(bestIdx, selected, embeddings, relevanceScores, alpha);
            pq.push([-currentGain, iteration, bestIdx]);
        }
    }

    return selected.map(i => candidates[i]);
}

// Main function to run the algorithm
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: node submodular_optimization.js <k> or node submodular_optimization.js <start>-<end>');
        console.log('Example: node submodular_optimization.js 5');
        console.log('Example: node submodular_optimization.js 1-20');
        process.exit(1);
    }

    // Parse k argument
    let kValues = [];
    const kArg = args[0];

    if (kArg.includes('-')) {
        const [start, end] = kArg.split('-').map(Number);
        if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
            console.error('Invalid range format. Use format like "1-20"');
            process.exit(1);
        }
        for (let i = start; i <= end; i++) {
            kValues.push(i);
        }
    } else {
        const k = parseInt(kArg);
        if (isNaN(k) || k < 1) {
            console.error('Invalid k value. Must be a positive integer.');
            process.exit(1);
        }
        kValues = [k];
    }

    try {
        // Load data
        const embeddingsData = JSON.parse(fs.readFileSync('output-prompt-v1.txt.embeddings.json', 'utf8'));
        const textData = JSON.parse(fs.readFileSync('output-prompt-v1.txt.json', 'utf8'));

        const embeddings = embeddingsData['20_queries'];
        const candidates = textData['20_queries'];
        const originalEmbedding = embeddingsData['original_query_embedding'];

        console.log(`Original query: "${embeddingsData['original_query']}"`);
        console.log(`Total candidates: ${candidates.length}`);
        console.log(`Embedding dimension: ${originalEmbedding.length}`);
        console.log('');

        // Prepare output data structure
        const outputData = {
            original_query: embeddingsData['original_query'],
            original_query_embedding: originalEmbedding
        };

        // Run algorithm for each k value
        for (const k of kValues) {
            console.log(`=== Selecting ${k} queries ===`);
            const startTime = Date.now();

            const selectedIndices = lazyGreedyQuerySelection(
                candidates,
                embeddings,
                originalEmbedding,
                k,
                0.3
            );

            const endTime = Date.now();

            console.log(`Selected queries:`);
            selectedIndices.forEach((query, index) => {
                console.log(`${index + 1}. ${query}`);
            });
            console.log(`Time taken: ${endTime - startTime}ms`);
            console.log('');

            // Store selected embeddings in output data (matching original format)
            const selectedEmbeddings = selectedIndices.map(query => {
                const index = candidates.indexOf(query);
                return embeddings[index];
            });

            outputData[`${k}_queries`] = selectedEmbeddings;
        }

        // Write output to file
        fs.writeFileSync('output-prompt-v1.txt.submodular.embeddings.json', JSON.stringify(outputData, null, 2));
        console.log('Output saved to output-prompt-v1.txt.submodular.embeddings.json');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export {
    lazyGreedyQuerySelection,
    computeMarginalGain,
    cosineSimilarity,
    PriorityQueue
}; 