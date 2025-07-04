import json
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics.pairwise import cosine_similarity
from itertools import combinations

def load_embeddings_data(filename):
    """Load embeddings data from JSON file."""
    with open(filename, 'r') as f:
        data = json.load(f)
    return data

def calculate_cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors."""
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

def analyze_cosine_similarities(data):
    """Analyze cosine similarities for both scenarios."""
    original_embedding = np.array(data['original_query_embedding'])
    
    # Initialize lists to store results
    original_vs_queries_similarities = []
    within_group_similarities = []
    
    # Process each query group (1_queries to 20_queries)
    for n in range(1, 21):
        group_key = f"{n}_queries"
        
        if group_key not in data:
            continue
            
        group_embeddings = [np.array(emb) for emb in data[group_key]]
        
        # Calculate similarities between original query and each query in the group
        orig_vs_group = [calculate_cosine_similarity(original_embedding, emb) for emb in group_embeddings]
        original_vs_queries_similarities.append(orig_vs_group)
        
        # Calculate similarities between queries within the group
        if len(group_embeddings) > 1:
            within_group = []
            for emb1, emb2 in combinations(group_embeddings, 2):
                sim = calculate_cosine_similarity(emb1, emb2)
                within_group.append(sim)
            within_group_similarities.append(within_group)
        else:
            # For single query groups, no within-group similarity
            within_group_similarities.append([])
    
    return original_vs_queries_similarities, within_group_similarities

def create_boxplots(original_vs_queries_similarities, within_group_similarities):
    """Create two side-by-side subplots with boxplots."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
    
    # Filter out empty groups and get x-axis labels
    x_labels = []
    orig_data = []
    within_data = []
    
    for n in range(1, 21):
        if n-1 < len(original_vs_queries_similarities) and original_vs_queries_similarities[n-1]:
            x_labels.append(f"{n}_queries")
            orig_data.append(original_vs_queries_similarities[n-1])
            
            if n-1 < len(within_group_similarities) and within_group_similarities[n-1]:
                within_data.append(within_group_similarities[n-1])
            else:
                within_data.append([])
    
    x_positions = list(range(1, len(x_labels) + 1))
    
    # Left subplot: Original query vs group queries
    ax1.boxplot(orig_data, positions=x_positions)
    ax1.set_xlabel('Query Groups')
    ax1.set_ylabel('Cosine Similarity')
    ax1.set_title('Original Query vs Group Queries Similarity')
    ax1.set_xticks(x_positions)
    ax1.set_xticklabels(x_labels, rotation=45, ha='right')
    ax1.grid(True, alpha=0.3)
    
    # Right subplot: Within group similarities
    # Filter out empty groups for the right plot
    filtered_within_data = [data for data in within_data if data]
    filtered_x_labels = [x_labels[i] for i, data in enumerate(within_data) if data]
    filtered_x_positions = list(range(1, len(filtered_x_labels) + 1))
    
    if filtered_within_data:
        ax2.boxplot(filtered_within_data, positions=filtered_x_positions)
        ax2.set_xlabel('Query Groups')
        ax2.set_ylabel('Cosine Similarity')
        ax2.set_title('Within Group Queries Similarity')
        ax2.set_xticks(filtered_x_positions)
        ax2.set_xticklabels(filtered_x_labels, rotation=45, ha='right')
        ax2.grid(True, alpha=0.3)
    else:
        ax2.text(0.5, 0.5, 'No within-group similarities\n(requires groups with >1 query)', 
                ha='center', va='center', transform=ax2.transAxes, fontsize=12)
        ax2.set_title('Within Group Queries Similarity')
    
    plt.tight_layout()
    return fig

def main():
    """Main function to run the analysis."""
    # Load data
    print("Loading embeddings data...")
    data = load_embeddings_data('output-prompt-v1.txt.embeddings.json')
    
    # Analyze similarities
    print("Calculating cosine similarities...")
    original_vs_queries_similarities, within_group_similarities = analyze_cosine_similarities(data)
    
    # Create visualizations
    print("Creating boxplots...")
    fig = create_boxplots(original_vs_queries_similarities, within_group_similarities)
    
    # Save the plot
    plt.savefig('cosine_similarity_analysis.png', dpi=300, bbox_inches='tight')
    print("Plot saved as 'cosine_similarity_analysis.png'")
    
    # Show the plot
    plt.show()
    
    # Print some statistics
    print("\nSummary Statistics:")
    print("=" * 50)
    
    for i, (orig_sims, within_sims) in enumerate(zip(original_vs_queries_similarities, within_group_similarities)):
        n = i + 1
        if orig_sims:
            print(f"{n}_queries:")
            print(f"  Original vs Group: mean={np.mean(orig_sims):.4f}, std={np.std(orig_sims):.4f}")
            if within_sims:
                print(f"  Within Group: mean={np.mean(within_sims):.4f}, std={np.std(within_sims):.4f}")
            else:
                print(f"  Within Group: N/A (single query)")
            print()

if __name__ == "__main__":
    main() 