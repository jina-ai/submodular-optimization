# Submodular Optimization

Generate diverse search queries.

## Setup

```bash
npm install
export GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

## Usage

```bash
npm run generate <prompt-file> "your query" [num_queries]
```

## Examples

```bash
npm run generate prompt-v1.txt "machine learning" 5
npm run generate prompt-v2.txt "climate change" 3
npm run generate prompt-v3.txt "blockchain" 7
```

Output: `output-<prompt-file>.json`