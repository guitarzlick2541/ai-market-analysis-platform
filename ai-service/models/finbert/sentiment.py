"""
AI Service - FinBERT Sentiment Analysis
Uses ProsusAI/finbert for financial sentiment classification
"""

from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import numpy as np
from typing import List, Dict, Optional
import re


class FinBERTSentiment:
    """
    Financial sentiment analyzer using FinBERT
    
    Classifies text into: positive, neutral, negative
    Returns confidence scores for each class
    """
    
    def __init__(self, model_name: str = "ProsusAI/finbert"):
        """
        Initialize FinBERT model
        
        Args:
            model_name: HuggingFace model name (default: ProsusAI/finbert)
        """
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.labels = ["positive", "negative", "neutral"]
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Asset keyword mapping for relevant asset extraction
        self.asset_keywords = {
            # Crypto
            "bitcoin": "BTC-USD", "btc": "BTC-USD",
            "ethereum": "ETH-USD", "eth": "ETH-USD", "ether": "ETH-USD",
            "solana": "SOL-USD", "sol": "SOL-USD",
            "dogecoin": "DOGE-USD", "doge": "DOGE-USD",
            "crypto": "CRYPTO",
            
            # Stocks
            "apple": "AAPL", "iphone": "AAPL", "ipad": "AAPL",
            "microsoft": "MSFT", "windows": "MSFT", "azure": "MSFT",
            "nvidia": "NVDA", "gpu": "NVDA",
            "google": "GOOGL", "alphabet": "GOOGL",
            "amazon": "AMZN", "aws": "AMZN",
            "tesla": "TSLA",
            
            # Commodities
            "gold": "XAU-USD", "bullion": "XAU-USD",
            "silver": "XAG-USD",
            "oil": "CL-USD", "crude": "CL-USD",
        }
    
    def load_model(self):
        """Load model and tokenizer (lazy loading)"""
        if self.model is None:
            print(f"Loading FinBERT model: {self.model_name}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            print(f"Model loaded on {self.device}")
    
    def analyze(self, text: str) -> Dict:
        """
        Analyze sentiment of a single text
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dict with sentiment, confidence, scores, and relevant_assets
        """
        self.load_model()
        
        # Tokenize
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            max_length=512,
            truncation=True,
            padding=True
        ).to(self.device)
        
        # Inference
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1).cpu().numpy()[0]
        
        # Get sentiment
        sentiment_idx = np.argmax(probs)
        sentiment = self.labels[sentiment_idx]
        confidence = float(probs[sentiment_idx])
        
        # Extract relevant assets
        relevant_assets = self._extract_assets(text)
        
        return {
            "text": text,
            "sentiment": sentiment,
            "confidence": round(confidence, 4),
            "scores": {
                "positive": round(float(probs[0]), 4),
                "negative": round(float(probs[1]), 4),
                "neutral": round(float(probs[2]), 4)
            },
            "relevant_assets": relevant_assets
        }
    
    def analyze_batch(self, texts: List[str]) -> List[Dict]:
        """
        Analyze sentiment of multiple texts
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of sentiment analysis results
        """
        return [self.analyze(text) for text in texts]
    
    def _extract_assets(self, text: str) -> List[str]:
        """Extract relevant asset symbols from text"""
        text_lower = text.lower()
        assets = set()
        
        for keyword, symbol in self.asset_keywords.items():
            if keyword in text_lower:
                assets.add(symbol)
        
        return list(assets) if assets else ["GENERAL"]
    
    def get_aggregated_sentiment(self, texts: List[str]) -> Dict:
        """
        Get aggregated sentiment from multiple texts
        
        Args:
            texts: List of texts (e.g., news headlines)
            
        Returns:
            Aggregated sentiment with counts and average scores
        """
        results = self.analyze_batch(texts)
        
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
        total_scores = {"positive": 0.0, "neutral": 0.0, "negative": 0.0}
        
        for result in results:
            sentiment_counts[result["sentiment"]] += 1
            for key in total_scores:
                total_scores[key] += result["scores"][key]
        
        n = len(results)
        avg_scores = {k: round(v / n, 4) for k, v in total_scores.items()}
        
        # Overall sentiment
        overall = max(sentiment_counts, key=sentiment_counts.get)
        
        return {
            "overall_sentiment": overall,
            "sentiment_counts": sentiment_counts,
            "average_scores": avg_scores,
            "total_analyzed": n
        }


# ===== Example Usage =====
if __name__ == "__main__":
    # Initialize analyzer
    analyzer = FinBERTSentiment()
    
    # Example headlines
    headlines = [
        "Bitcoin surges past $45,000 as institutional investors pile in",
        "Stock market crashes amid fears of economic recession",
        "Apple reports mixed quarterly results, revenue slightly misses estimates",
        "NVIDIA announces breakthrough AI chip, shares soar 10%",
        "Gold prices hit new highs as central banks increase reserves"
    ]
    
    print("=" * 60)
    print("FinBERT Sentiment Analysis Demo")
    print("=" * 60)
    
    for headline in headlines:
        result = analyzer.analyze(headline)
        print(f"\nHeadline: {headline}")
        print(f"Sentiment: {result['sentiment']} ({result['confidence']:.2%})")
        print(f"Scores: {result['scores']}")
        print(f"Assets: {result['relevant_assets']}")
    
    print("\n" + "=" * 60)
    print("Aggregated Sentiment")
    print("=" * 60)
    agg = analyzer.get_aggregated_sentiment(headlines)
    print(f"Overall: {agg['overall_sentiment']}")
    print(f"Counts: {agg['sentiment_counts']}")
    print(f"Average Scores: {agg['average_scores']}")
