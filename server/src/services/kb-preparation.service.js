/**
 * Knowledge Base Preparation Service
 * Prepares KB chunks for AI consumption: summarize, limit, format
 */


class KBPreparationService {
  /**
   * Summarize long text chunks (over 250 chars for better context)
   * Improved summarization: preserve key information
   */
  summarizeChunk(content, maxLength = 250) {
    if (!content || typeof content !== 'string') return content;
    if (content.length <= maxLength) return content;

    // Try to find first sentence (more important)
    const firstSentenceMatch = content.match(/^[^.!?]+[.!?]/);
    if (firstSentenceMatch && firstSentenceMatch[0].length <= maxLength * 0.6) {
      // If first sentence is short enough, try to include a second sentence or key phrase
      const remaining = content.substring(firstSentenceMatch[0].length).trim();
      const secondSentenceMatch = remaining.match(/^[^.!?]+[.!?]/);
      if (secondSentenceMatch && (firstSentenceMatch[0] + ' ' + secondSentenceMatch[0]).length <= maxLength) {
        return (firstSentenceMatch[0] + ' ' + secondSentenceMatch[0]).trim();
      }
      return firstSentenceMatch[0].trim();
    }

    // Fallback: truncate at word boundary (preserve more context)
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclamation = truncated.lastIndexOf('!');
    const lastPunctuation = Math.max(lastPeriod, lastQuestion, lastExclamation);
    
    // Prefer cutting at sentence boundary if possible
    if (lastPunctuation > maxLength * 0.7) {
      return truncated.substring(0, lastPunctuation + 1).trim();
    }
    
    // Otherwise cut at word boundary
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  /**
   * Prepare knowledge base chunks for AI
   * - Limit to top 3
   * - Summarize long chunks
   * - Format for prompt
   */
  prepareKnowledgeChunks(rawChunks, maxChunks = 3) {
    if (!rawChunks || !Array.isArray(rawChunks) || rawChunks.length === 0) {
      return [];
    }

    // Take top N chunks
    const topChunks = rawChunks.slice(0, maxChunks);

    // Summarize and format
    return topChunks.map((chunk, index) => {
      const content = chunk.content || chunk.text || '';
      const summarized = this.summarizeChunk(content, 200);
      
      return {
        index: index + 1,
        content: summarized,
        originalLength: content.length,
        wasSummarized: content.length > 200
      };
    });
  }

  /**
   * Format KB chunks for system prompt with better structure
   */
  formatForPrompt(preparedChunks) {
    if (!preparedChunks || preparedChunks.length === 0) {
      return '';
    }

    // Format with clear numbering and structure for better AI comprehension
    return preparedChunks
      .map(chunk => {
        const content = chunk.content.trim();
        // Add emphasis for important information
        return `${chunk.index}. ${content}`;
      })
      .join('\n\n');
  }
}

export default new KBPreparationService();

