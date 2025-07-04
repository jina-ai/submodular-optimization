import * as fs from 'fs';
import * as path from 'path';

// Get API key from environment
const JINA_API_KEY = process.env.JINA_API_KEY;
if (!JINA_API_KEY) {
    console.error('Please set JINA_API_KEY environment variable');
    process.exit(1);
}

async function getEmbedding(text) {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JINA_API_KEY}`
        },
        body: JSON.stringify({
            model: 'jina-embeddings-v3',
            task: 'text-matching',
            input: [text]
        })
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.data[0].embedding;
}

async function getEmbeddings(texts) {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JINA_API_KEY}`
        },
        body: JSON.stringify({
            model: 'jina-embeddings-v3',
            task: 'text-matching',
            input: texts
        })
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.data.map(item => item.embedding);
}

async function processFile(inputFile) {
    try {
        // Read input file
        const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

        const result = {
            original_query: data.original_query,
            original_query_embedding: null
        };

        // Initialize embedding arrays for each field
        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'original_query' && Array.isArray(value)) {
                result[key] = new Array(value.length).fill(null);
            }
        });

        // Process original query
        if (data.original_query) {
            console.log('Processing original query...');
            result.original_query_embedding = await getEmbedding(data.original_query);
        }

        // Process each field group
        for (const [key, value] of Object.entries(data)) {
            if (key !== 'original_query' && Array.isArray(value)) {
                console.log(`Processing ${key} (${value.length} queries)...`);
                const embeddings = await getEmbeddings(value);
                result[key] = embeddings;
            }
        }

        // Save to embeddings file
        const outputFile = inputFile.replace('.json', '.embeddings.json');
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

        console.log(`Embeddings saved to: ${outputFile}`);

    } catch (error) {
        console.error('Error processing file:', error);
        process.exit(1);
    }
}

// CLI usage
const args = process.argv.slice(2);
const inputFile = args[0];

if (!inputFile) {
    console.error('Usage: node embed.js <input-file>');
    console.error('Example: node embed.js output-prompt-v1.txt.json');
    process.exit(1);
}

if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
}

processFile(inputFile); 