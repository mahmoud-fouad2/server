/**
 * Knowledge Base Preparation Service
 * Prepares KB chunks for AI consumption: summarize, limit, format
 */


class KBPreparationService {
  /**
   * Summarize long text chunks (over 200 chars)
   * Simple summarization: take first sentence + key points
   */
  summarizeChunk(content, maxLength = 200) {
    if (!content || typeof content !== 'string') return content;
    if (content.length <= maxLength) return content;

    // Try to find first sentence
    const firstSentenceMatch = content.match(/^[^.!?]+[.!?]/);
    if (firstSentenceMatch && firstSentenceMatch[0].length <= maxLength) {
      return firstSentenceMatch[0].trim();
    }

    // Fallback: truncate at word boundary
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
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
   * Format KB chunks for system prompt
   */
  formatForPrompt(preparedChunks) {
    if (!preparedChunks || preparedChunks.length === 0) {
      return '';
    }

    return preparedChunks
      .map(chunk => `[${chunk.index}] ${chunk.content}`)
      .join('\n');
  }
}

module.exports = new KBPreparationService();

