import natural from 'natural';
import logger from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SentimentResult {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  confidence: number;
  intensity: number;
  emotions: {
    joy?: number;
    anger?: number;
    sadness?: number;
    fear?: number;
    surprise?: number;
  };
  keywords: string[];
}

class SentimentAnalysisService {
  private analyzer: any;
  private tokenizer: any;

  constructor() {
    this.analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    this.tokenizer = new natural.WordTokenizer();
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      const tokens = this.tokenizer.tokenize(text.toLowerCase());
      const score = this.analyzer.getSentiment(tokens);

      // Determine sentiment
      let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
      if (score > 0.1) {
        sentiment = 'POSITIVE';
      } else if (score < -0.1) {
        sentiment = 'NEGATIVE';
      } else {
        sentiment = 'NEUTRAL';
      }

      // Calculate confidence and intensity
      const confidence = Math.min(Math.abs(score) * 2, 1.0);
      const intensity = Math.min(Math.abs(score), 1.0);

      // Extract keywords
      const keywords = this.extractKeywords(text);

      // Detect emotions (basic implementation)
      const emotions = this.detectEmotions(text, tokens);

      return {
        sentiment,
        confidence,
        intensity,
        emotions,
        keywords,
      };
    } catch (error: any) {
      logger.error('Sentiment analysis failed:', error.message);
      return {
        sentiment: 'NEUTRAL',
        confidence: 0,
        intensity: 0,
        emotions: {},
        keywords: [],
      };
    }
  }

  private extractKeywords(text: string): string[] {
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(text);

    const keywords: string[] = [];
    tfidf.listTerms(0).slice(0, 10).forEach((item: any) => {
      keywords.push(item.term);
    });

    return keywords;
  }

  private detectEmotions(text: string, tokens: string[]): any {
    const emotions: any = {};

    // Simple emotion detection based on keywords
    const joyWords = ['happy', 'joy', 'excited', 'wonderful', 'great', 'excellent', 'love'];
    const angerWords = ['angry', 'mad', 'furious', 'hate', 'terrible', 'awful'];
    const sadnessWords = ['sad', 'depressed', 'disappointed', 'unhappy', 'sorry'];
    const fearWords = ['afraid', 'scared', 'worried', 'anxious', 'nervous'];
    const surpriseWords = ['surprised', 'shocked', 'amazed', 'wow', 'unexpected'];

    emotions.joy = this.countMatchingWords(tokens, joyWords) / tokens.length;
    emotions.anger = this.countMatchingWords(tokens, angerWords) / tokens.length;
    emotions.sadness = this.countMatchingWords(tokens, sadnessWords) / tokens.length;
    emotions.fear = this.countMatchingWords(tokens, fearWords) / tokens.length;
    emotions.surprise = this.countMatchingWords(tokens, surpriseWords) / tokens.length;

    return emotions;
  }

  private countMatchingWords(tokens: string[], wordList: string[]): number {
    return tokens.filter((token) => wordList.includes(token)).length;
  }

  async analyzeConversationSentiment(conversationId: string): Promise<any> {
    try {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });

      const sentiments = await Promise.all(
        messages.map((msg) => this.analyzeSentiment(msg.content))
      );

      // Calculate overall trends
      const avgSentiment = sentiments.reduce((sum, s) => sum + (
        s.sentiment === 'POSITIVE' ? 1 : s.sentiment === 'NEGATIVE' ? -1 : 0
      ), 0) / sentiments.length;

      const dominantSentiment = avgSentiment > 0.1 ? 'POSITIVE' :
                               avgSentiment < -0.1 ? 'NEGATIVE' : 'NEUTRAL';

      return {
        conversationId,
        overallSentiment: dominantSentiment,
        avgScore: avgSentiment,
        sentimentTrend: sentiments.map(s => s.sentiment),
        messageCount: messages.length,
      };
    } catch (error: any) {
      logger.error('Conversation sentiment analysis failed:', error.message);
      return null;
    }
  }

  async saveSentimentAnalysis(
    conversationId: string,
    messageId: string,
    result: SentimentResult
  ): Promise<boolean> {
    try {
      await prisma.sentimentAnalysis.create({
        data: {
          conversationId,
          messageId,
          sentiment: result.sentiment,
          confidence: result.confidence,
          intensity: result.intensity,
          emotions: result.emotions as any,
          // keywords: result.keywords as any,
        },
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to save sentiment analysis:', error.message);
      return false;
    }
  }
}

export default new SentimentAnalysisService();
