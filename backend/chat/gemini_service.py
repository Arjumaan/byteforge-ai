"""
Google Gemini AI service integration.
"""
import google.generativeai as genai
from django.conf import settings
import tiktoken
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for interacting with Google Gemini API."""
    
    def __init__(self):
        """Initialize the Gemini service."""
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash-latest')
        else: 
            self.model = None
            logger.warning("Gemini API key not configured")
        
        # Use tiktoken for token estimation (cl100k_base is close to Gemini's tokenization)
        try:
            self.encoding = tiktoken.get_encoding("cl100k_base")
        except Exception: 
            self.encoding = None
    
    def count_tokens(self, text: str) -> int:
        """
        Estimate token count for a given text.Uses tiktoken for estimation as it's close to Gemini's tokenization.
        """
        if not text:
            return 0
        
        if self.encoding:
            try:
                return len(self.encoding.encode(text))
            except Exception:
                pass
        
        # Fallback:  rough estimation (1 token ≈ 4 characters)
        return len(text) // 4
    
    def count_messages_tokens(self, messages:  List[Dict[str, str]]) -> int:
        """Count total tokens in a list of messages."""
        total = 0
        for message in messages:
            total += self.count_tokens(message.get('content', ''))
            total += 4  # Overhead for role and formatting
        return total
    
    def truncate_context(
        self, 
        messages: List[Dict[str, str]], 
        max_tokens: int,
        reserve_for_response: int = 1000
    ) -> List[Dict[str, str]]: 
        """
        Truncate message history to fit within token limit.Keeps the most recent messages while respecting the limit.
        """
        available_tokens = max_tokens - reserve_for_response
        
        if available_tokens <= 0:
            return []
        
        # Start from the most recent message and work backwards
        truncated = []
        current_tokens = 0
        
        for message in reversed(messages):
            message_tokens = self.count_tokens(message.get('content', '')) + 4
            
            if current_tokens + message_tokens <= available_tokens: 
                truncated.insert(0, message)
                current_tokens += message_tokens
            else:
                break
        
        return truncated
    
    def build_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Build a prompt string from message history."""
        prompt_parts = []
        
        for message in messages:
            role = message.get('role', 'user')
            content = message.get('content', '')
            
            if role == 'user':
                prompt_parts.append(f"User: {content}")
            elif role == 'assistant':
                prompt_parts.append(f"Assistant:  {content}")
            elif role == 'system':
                prompt_parts.append(f"System: {content}")
        
        return "\n\n".join(prompt_parts)
    
    def generate_response(
        self, 
        messages: List[Dict[str, str]],
        max_tokens: int = 1000
    ) -> Tuple[str, int, int]:
        """
        Generate a response using Gemini API.Args:
            messages:  List of message dictionaries with 'role' and 'content'
            max_tokens: Maximum tokens for the response
        
        Returns: 
            Tuple of (response_text, prompt_tokens, completion_tokens)
        """
        if not self.model:
            # Return a fallback response if API key not configured
            return (
                "I apologize, but the AI service is not configured.  "
                "Please contact the administrator to set up the Gemini API key.",
                0,
                0
            )
        
        try:
            # Build the conversation prompt
            prompt = self.build_prompt(messages)
            prompt_tokens = self.count_tokens(prompt)
            
            # Generate response
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=0.7,
                    top_p=0.95,
                )
            )
            
            # Extract response text
            response_text = response.text if response.text else ""
            completion_tokens = self.count_tokens(response_text)
            
            return response_text, prompt_tokens, completion_tokens
            
        except Exception as e: 
            logger.error(f"Gemini API error: {str(e)}")
            error_message = (
                "I encountered an error processing your request. "
                "Please try again later."
            )
            return error_message, 0, self.count_tokens(error_message)
    
    def generate_title(self, first_message: str) -> str:
        """Generate a conversation title based on the first message."""
        if not self.model:
            # Fallback:  use first 50 characters of the message
            return first_message[:50] + "..." if len(first_message) > 50 else first_message
        
        try:
            prompt = (
                f"Generate a short, concise title (max 5 words) for a conversation "
                f"that starts with this message: \"{first_message}\"\n"
                f"Respond with only the title, no quotes or extra text."
            )
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=20,
                    temperature=0.5,
                )
            )
            
            title = response.text.strip() if response.text else first_message[: 50]
            return title[: 100]  # Limit to 100 characters
            
        except Exception as e:
            logger.error(f"Error generating title: {str(e)}")
            return first_message[:50] + "..." if len(first_message) > 50 else first_message


# Singleton instance
gemini_service = GeminiService()