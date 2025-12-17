import os
import google.generativeai as genai
import tiktoken
from django.conf import settings


class GeminiService:
    """Service to interact with Google Gemini API"""
    
    def __init__(self):
        """Initialize Gemini service"""
        api_key = settings.GEMINI_API_KEY
        if api_key and api_key != 'your-gemini-api-key-here':
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
            self.enabled = True
        else:
            self.model = None
            self.enabled = False
    
    def count_tokens(self, text):
        """
        Count tokens in text.
        Note: This uses an approximate method as Gemini's tokenization differs from GPT models.
        For production, consider using Gemini's count_tokens API or a more accurate estimation.
        """
        try:
            # Approximate token counting (better fallback for Gemini)
            # Gemini typically uses ~4 characters per token
            return max(len(text) // 4, len(text.split()))
        except Exception as e:
            # Fallback: rough estimate of tokens
            return len(text.split()) * 1.3
    
    def generate_response(self, message, conversation_history=None):
        """Generate response from Gemini API"""
        if not self.enabled:
            return {
                'response': 'Gemini API is not configured. Please add GEMINI_API_KEY to your .env file.',
                'tokens_used': 0
            }
        
        try:
            # Build context from conversation history
            context = ""
            if conversation_history:
                for msg in conversation_history[-10:]:  # Last 10 messages for context
                    role = "User" if msg.role == "user" else "Assistant"
                    context += f"{role}: {msg.content}\n"
            
            # Create prompt with context
            prompt = context + f"User: {message}\nAssistant:"
            
            # Generate response
            response = self.model.generate_content(prompt)
            
            # Count tokens
            prompt_tokens = self.count_tokens(prompt)
            response_tokens = self.count_tokens(response.text)
            total_tokens = prompt_tokens + response_tokens
            
            return {
                'response': response.text,
                'tokens_used': int(total_tokens)
            }
        
        except Exception as e:
            return {
                'response': f'Error generating response: {str(e)}',
                'tokens_used': 0
            }
