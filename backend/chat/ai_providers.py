
import os
import logging
from typing import List, Dict, Tuple, Optional
from django.conf import settings
import google.generativeai as genai
import openai
import anthropic
import tiktoken

logger = logging.getLogger(__name__)

class AIProvider:
    """Base class for AI providers."""
    
    def count_tokens(self, text: str) -> int:
        """Estimate token count."""
        # Simple fallback estimation (1 token ≈ 4 characters)
        return len(text) // 4 if text else 0

    def generate_response(self, messages: List[Dict[str, str]], max_tokens: int = 1000) -> Tuple[str, int, int]:
        """Generate response and return (text, prompt_tokens, completion_tokens)."""
        raise NotImplementedError

    def build_system_prompt(self, messages: List[Dict[str, str]]) -> Tuple[Optional[str], List[Dict[str, str]]]:
        """Extract system prompt if present."""
        system_prompt = None
        filtered_messages = []
        for msg in messages:
            if msg['role'] == 'system':
                system_prompt = msg['content']
            else:
                filtered_messages.append(msg)
        return system_prompt, filtered_messages

    def truncate_context(self, messages: List[Dict[str, str]], max_tokens: int, reserve_for_response: int = 1000) -> List[Dict[str, str]]:
        """Truncate message history to fit within token limit."""
        available_tokens = max_tokens - reserve_for_response
        if available_tokens <= 0: return []
        
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

    def generate_title(self, first_message: str) -> str:
        """Generate a title for the conversation."""
        prompt_msg = [
            {"role": "user", "content": f"Generate a short (max 5 words) conversation title for: '{first_message}'. Respond ONLY with the title."}
        ]
        try:
            title, _, _ = self.generate_response(prompt_msg, max_tokens=20)
            return title.strip().strip('"')[:100]
        except Exception as e:
            logger.error(f"Title Gen Error: {e}")
            return first_message[:50] + "..." if len(first_message) > 50 else first_message



class GeminiProvider(AIProvider):
    def __init__(self, model_name='gemini-flash-latest'):
        # Support multiple keys separated by comma
        raw_keys = settings.GEMINI_API_KEY or ""
        self.api_keys = [k.strip() for k in raw_keys.split(',') if k.strip()]
        self.current_key_index = 0
        self.model_name = model_name
        self.model = None
        
        self._configure_client()

    def _configure_client(self):
        """Configure the GenAI client with the current key."""
        if self.api_keys:
            current_key = self.api_keys[self.current_key_index]
            # specific api_version might be needed depending on library version, but default usually works
            genai.configure(api_key=current_key)
            self.model = genai.GenerativeModel(self.model_name)
            logger.info(f"Configured Gemini with key index {self.current_key_index} (***{current_key[-4:]})")

    def count_tokens(self, text: str) -> int:
        if not text: return 0
        try:
             # Use tiktoken as proxy for speed, or length
            encoding = tiktoken.get_encoding("cl100k_base")
            return len(encoding.encode(text))
        except:
            return super().count_tokens(text)

    def generate_response(self, messages: List[Dict[str, str]], max_tokens: int = 1000):
        if not self.api_keys:
            raise Exception("Gemini API keys not configured")

        # Convert standard messages to Gemini prompt
        prompt_parts = []
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if role == 'user':
                prompt_parts.append(f"User: {content}")
            elif role == 'assistant':
                prompt_parts.append(f"Assistant: {content}")
            elif role == 'system':
                prompt_parts.append(f"System: {content}")
        
        full_prompt = "\n\n".join(prompt_parts)
        prompt_tokens = self.count_tokens(full_prompt)

        # Retry logic for key rotation
        attempts = 0
        total_keys = len(self.api_keys)
        
        # Try at most total_keys times (one for each key)
        while attempts < total_keys:
            try:
                response = self.model.generate_content(
                    full_prompt,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=max_tokens,
                        temperature=0.7,
                    )
                )
                text = response.text if response.text else ""
                completion_tokens = self.count_tokens(text)
                return text, prompt_tokens, completion_tokens
            except Exception as e:
                error_str = str(e).lower()
                # Check for quota limits (429 or ResourceExhausted)
                if "429" in error_str or "quota" in error_str or "resource_exhausted" in error_str:
                    logger.warning(f"Gemini Key {self.current_key_index} exhausted. Rotating to next key...")
                    attempts += 1
                    # Rotate key index
                    if total_keys > 1:
                        self.current_key_index = (self.current_key_index + 1) % total_keys
                        self._configure_client()
                        continue
                    else:
                        # Only 1 key available, cannot rotate
                        raise e
                else:
                    logger.error(f"Gemini Error: {e}")
                    raise e
        
        # If loop exits without returning, we exhausted all keys
        raise Exception("All available Gemini API keys have exhausted their daily quota.")



class OpenAIProvider(AIProvider):
    def __init__(self, model_name='gpt-3.5-turbo'):
        self.api_key = settings.OPENAI_API_KEY
        self.model_name = model_name
        if self.api_key:
            self.client = openai.OpenAI(api_key=self.api_key)
        else:
            self.client = None

    def count_tokens(self, text: str) -> int:
        try:
            encoding = tiktoken.encoding_for_model(self.model_name)
            return len(encoding.encode(text))
        except:
            return super().count_tokens(text)

    def generate_response(self, messages: List[Dict[str, str]], max_tokens: int = 1000):
        if not self.client:
             raise Exception("OpenAI API key not configured")

        # OpenAI supports role/content messages natively
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            usage = response.usage
            return content, usage.prompt_tokens, usage.completion_tokens
        except Exception as e:
            logger.error(f"OpenAI Error: {e}")
            raise e


class AnthropicProvider(AIProvider):
    def __init__(self, model_name='claude-3-5-sonnet-20240620'):
        self.api_key = settings.ANTHROPIC_API_KEY
        self.model_name = model_name
        if self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)
        else:
             self.client = None

    def generate_response(self, messages: List[Dict[str, str]], max_tokens: int = 1000):
        if not self.client:
             raise Exception("Anthropic API key not configured")

        system_prompt, filtered_messages = self.build_system_prompt(messages)
        
        try:
            kwargs = {
                "model": self.model_name,
                "max_tokens": max_tokens,
                "messages": filtered_messages,
                "temperature": 0.7
            }
            if system_prompt:
                kwargs["system"] = system_prompt

            response = self.client.messages.create(**kwargs)
            
            content = response.content[0].text
            usage = response.usage
            return content, usage.input_tokens, usage.output_tokens
        except Exception as e:
            logger.error(f"Anthropic Error: {e}")
            raise e

class AIServiceFactory:
    @staticmethod
    def get_service(provider_id: str, model_id: str = None):
        if provider_id == 'openai':
            return OpenAIProvider(model_id or 'gpt-4o')
        elif provider_id == 'anthropic':
            return AnthropicProvider(model_id or 'claude-3-5-sonnet-20240620')
        elif provider_id == 'gemini':
            return GeminiProvider(model_id or 'gemini-flash-latest')
        else:
            return GeminiProvider('gemini-flash-latest') # Default
