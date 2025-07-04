# Submodular Optimization

Generate diverse search queries using AI and optimize query selection using submodular optimization algorithms.

## Setup

```bash
npm install
export GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
export JINA_API_KEY=your_jina_api_key_here
```

## Usage

### Generate Queries
```bash
npm run generate <prompt-file> "your query" [num_queries_or_range]
npm run embed <output-file>
```

### Submodular Query Selection
```bash
node submodular_optimization.js <k>                    # Single k value
node submodular_optimization.js <start>-<end>         # Range of k values
```

## Examples

### Query Generation
```bash
npm run generate prompt-v1.txt "machine learning" 5
npm run generate prompt-v2.txt "climate change" 2-10
npm run embed output-prompt-v1.txt.json
```

### Submodular Optimization
```bash
node submodular_optimization.js 5                     # Select 5 optimal queries
node submodular_optimization.js 1-20                  # Select 1-20 queries iteratively
```

## Output Files

### Query Generation
- `output-<prompt-file>.json` - Generated query strings
- `output-<prompt-file>.embeddings.json` - Query embeddings

### Submodular Optimization
- `output-prompt-v1.txt.submodular.embeddings.json` - Optimized query embeddings

## Algorithm

The submodular optimization uses a **lazy greedy algorithm** that:

1. **Maximizes diversity** by selecting queries that cover different aspects of the topic
2. **Maintains relevance** by considering similarity to the original query
3. **Uses cosine similarity** for measuring query relationships
4. **Implements lazy evaluation** for computational efficiency

The objective function balances:
- **Relevance**: How well queries match the original topic (weighted by α=0.3)
- **Coverage**: How well selected queries cover the candidate set
- **Diversity**: How different the selected queries are from each other

## File Structure

```
submodular-optimization/
├── submodular_optimization.js    # Main optimization algorithm
├── prompt-v*.txt                 # Query generation prompts
├── output-prompt-v*.json         # Generated query strings
├── output-prompt-v*.embeddings.json          # Original embeddings
└── output-prompt-v*.submodular.embeddings.json  # Optimized embeddings
```