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

// CLI usage: npm run generate <prompt-file> "my query" [num_queries]
async function cli() {
    const args = process.argv.slice(2);
    const promptFile = args[0];
    const userQuery = args[1];
    const numQueries = args[2] ? parseInt(args[2], 10) : 5;
    if (!promptFile || !userQuery || isNaN(numQueries) || numQueries < 1) {
        console.error('Usage: npm run generate <prompt-file> "my query" [num_queries]');
        process.exit(1);
    }
    const outputFile = `output-${path.basename(promptFile)}.json`;
    try {
        const result = await generateQueries(promptFile, userQuery, numQueries);
        fs.writeFileSync(outputFile, JSON.stringify(result.queries, null, 2));
        console.log(`Generated queries saved to: ${outputFile}`);
        result.queries.forEach((q, i) => console.log(`${i + 1}. ${q}`));
    } catch (error) {
        console.error('Error generating queries:', error);
        process.exit(1);
    }
}

cli(); 