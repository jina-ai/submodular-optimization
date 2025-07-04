import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';


// Core function to generate queries
async function generateQueries(promptFile, userQuery, numQueries) {
    const promptPath = path.join(process.cwd(), promptFile);
    if (!fs.existsSync(promptPath)) {
        console.error(`Prompt file not found: ${promptFile}`);
        process.exit(1);
    }
    let prompt = fs.readFileSync(promptPath, 'utf-8');
    prompt = prompt.replace('{num_queries}', numQueries);

    // Zod schema for a list of numQueries strings
    const queriesSchema = z.object({
        queries: z.array(z.string()).length(numQueries)
    });

    const result = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: queriesSchema,
        system: prompt,
        prompt: userQuery,
    });
    return result.object;
}

// CLI usage: npm run generate <prompt-file> "my query" [num_queries_or_range]
async function cli() {
    const args = process.argv.slice(2);
    const promptFile = args[0];
    const userQuery = args[1];
    const numQueriesArg = args[2] || '5';

    if (!promptFile || !userQuery) {
        console.error('Usage: npm run generate <prompt-file> "my query" [num_queries_or_range]');
        console.error('Examples:');
        console.error('  npm run generate prompt-v1.txt "machine learning" 5');
        console.error('  npm run generate prompt-v1.txt "machine learning" 2-10');
        process.exit(1);
    }

    let numQueriesList = [];

    // Check if it's a range (e.g., "2-10")
    if (numQueriesArg.includes('-')) {
        const [start, end] = numQueriesArg.split('-').map(n => parseInt(n, 10));
        if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
            console.error('Invalid range format. Use format like "2-10"');
            process.exit(1);
        }
        for (let i = start; i <= end; i++) {
            numQueriesList.push(i);
        }
    } else {
        // Single number
        const numQueries = parseInt(numQueriesArg, 10);
        if (isNaN(numQueries) || numQueries < 1) {
            console.error('Invalid number of queries');
            process.exit(1);
        }
        numQueriesList = [numQueries];
    }

    const outputFile = `output-${path.basename(promptFile)}.json`;
    const results = {
        original_query: userQuery
    };

    try {
        for (const numQueries of numQueriesList) {
            console.log(`Generating ${numQueries} queries...`);
            const result = await generateQueries(promptFile, userQuery, numQueries);
            results[`${numQueries}_queries`] = result.queries;
        }

        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
        console.log(`Generated queries saved to: ${outputFile}`);

        // Display results
        Object.entries(results).forEach(([key, queries]) => {
            console.log(`\n${key}:`);
            queries.forEach((q, i) => console.log(`${i + 1}. ${q}`));
        });

    } catch (error) {
        console.error('Error generating queries:', error);
        process.exit(1);
    }
}

cli(); 