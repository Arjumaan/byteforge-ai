"""
AI Provider Module — Powered by OpenRouter
Single API key → 400+ models (GPT, Claude, Gemini, Llama, Mistral, DeepSeek, etc.)

Production-ready with:
  - Automatic retry with exponential backoff
  - Smart model fallback chain on rate limits
  - Free model rotation to spread load
"""

import time
import logging
from typing import List, Dict, Tuple, Optional
from django.conf import settings
import openai

logger = logging.getLogger(__name__)

# Fallback chain: if selected model is rate-limited, try these in order
# Mix of free and cheap models for maximum availability
FALLBACK_MODELS = [
    'google/gemini-2.0-flash-001',           # Fast, cheap
    'openai/gpt-4o-mini',                     # Fast, cheap
    'meta-llama/llama-4-scout',               # Free or cheap
    'deepseek/deepseek-chat-v3-0324',         # Cheap
    'mistralai/mistral-small-3.1-24b-instruct', # Cheap
    'google/gemma-3-12b-it:free',             # Free
    'meta-llama/llama-3.3-70b-instruct:free', # Free
    'mistralai/mistral-nemo:free',            # Free
    'qwen/qwen-2.5-72b-instruct:free',       # Free
    'google/gemma-3-27b-it:free',             # Free
    'deepseek/deepseek-r1-distill-llama-70b:free', # Free
]


class AIProvider:
    """Base class for AI providers."""
    
    def count_tokens(self, text: str) -> int:
        """Estimate token count (1 token ≈ 4 characters)."""
        return len(text) // 4 if text else 0

    def generate_response(self, messages: List[Dict[str, str]], max_tokens: int = 4096) -> Tuple[str, int, int]:
        """Generate response and return (text, prompt_tokens, completion_tokens)."""
        raise NotImplementedError

    def truncate_context(self, messages: List[Dict], max_tokens: int, reserve_for_response: int = 1000) -> List[Dict]:
        """Truncate message history to fit within token limit."""
        available_tokens = max_tokens - reserve_for_response
        if available_tokens <= 0:
            return []
        
        truncated = []
        current_tokens = 0
        
        # Last message = current user prompt — always included
        user_prompt = messages[-1]
        user_tokens = user_prompt.get('tokens_used') or self.count_tokens(user_prompt.get('content', ''))
        
        # System instruction
        system_instr = messages[0] if messages[0]['role'] == 'system' else None
        system_tokens = self.count_tokens(system_instr['content']) if system_instr else 0
        
        available_tokens -= (user_tokens + system_tokens)
        
        # Add history in reverse (newest first)
        history = messages[1:-1] if system_instr else messages[:-1]
        
        for message in reversed(history):
            message_tokens = message.get('tokens_used') or (self.count_tokens(message.get('content', '')) + 4)
            if current_tokens + message_tokens <= available_tokens:
                truncated.insert(0, message)
                current_tokens += message_tokens
            else:
                break
        
        final_messages = []
        if system_instr:
            final_messages.append(system_instr)
        final_messages.extend(truncated)
        final_messages.append(user_prompt)
        
        return final_messages

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


class OpenRouterProvider(AIProvider):
    """
    Production-ready AI provider using OpenRouter.
    Single API key → 400+ models with automatic retry and fallback.
    """
    
    MAX_RETRIES = 3          # Max retries per model
    INITIAL_BACKOFF = 2      # Seconds before first retry
    
    def __init__(self, model_name='openai/gpt-4o'):
        self.api_key = getattr(settings, 'OPENROUTER_API_KEY', None)
        self.model_name = model_name
        if self.api_key:
            self.client = openai.OpenAI(
                base_url='https://openrouter.ai/api/v1',
                api_key=self.api_key,
                default_headers={
                    'HTTP-Referer': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
                    'X-Title': 'ByteForge AI',
                }
            )
        else:
            self.client = None

    def _call_api(self, model: str, clean_messages: list, max_tokens: int):
        """Make a single API call with retry logic."""
        last_error = None
        
        for attempt in range(self.MAX_RETRIES):
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=clean_messages,
                    max_tokens=max_tokens,
                    temperature=0.7,
                )
                
                content = response.choices[0].message.content
                usage = response.usage
                prompt_tokens = usage.prompt_tokens if usage else self.count_tokens(str(clean_messages))
                completion_tokens = usage.completion_tokens if usage else self.count_tokens(content)
                return content, prompt_tokens, completion_tokens
                
            except openai.RateLimitError as e:
                last_error = e
                wait_time = self.INITIAL_BACKOFF * (2 ** attempt)  # 2s, 4s, 8s
                logger.warning(f"Rate limit on '{model}' (attempt {attempt+1}/{self.MAX_RETRIES}). Retrying in {wait_time}s...")
                time.sleep(wait_time)
                
            except openai.AuthenticationError as e:
                logger.error(f"OpenRouter Auth Error: {e}")
                raise Exception("OpenRouter API key is invalid. Please check your OPENROUTER_API_KEY in .env.")
                
            except openai.BadRequestError as e:
                logger.error(f"Bad request for model '{model}': {e}")
                raise  # Don't retry bad requests — model doesn't exist or similar
                
            except Exception as e:
                last_error = e
                logger.error(f"API error on '{model}': {e}")
                break  # Don't retry unknown errors
        
        # If we get here, retries were exhausted
        raise last_error or Exception(f"Failed to get response from '{model}'")

    def generate_response(self, messages: List[Dict[str, str]], max_tokens: int = 4096):
        if not self.client:
            raise Exception(
                "OpenRouter API key not configured. "
                "Get one at https://openrouter.ai/keys and add OPENROUTER_API_KEY to your .env file."
            )
        
        # Clean messages — only send role + content (strip internal fields like tokens_used)
        clean_messages = [
            {'role': msg['role'], 'content': msg['content']}
            for msg in messages
            if msg.get('content')
        ]
        
        # Build fallback chain: selected model first, then fallbacks (skip duplicates)
        models_to_try = [self.model_name]
        for fb in FALLBACK_MODELS:
            if fb != self.model_name:
                models_to_try.append(fb)
        
        last_error = None
        for i, model in enumerate(models_to_try):
            try:
                if i > 0:
                    logger.info(f"Falling back to model: {model}")
                result = self._call_api(model, clean_messages, max_tokens)
                if i > 0:
                    logger.info(f"Fallback to '{model}' succeeded!")
                return result
                
            except openai.RateLimitError as e:
                last_error = e
                logger.warning(f"Model '{model}' rate-limited after retries. Trying next fallback...")
                continue
                
            except openai.BadRequestError:
                last_error = Exception(f"Model '{model}' is currently unavailable.")
                continue
                
            except Exception as e:
                if "API key is invalid" in str(e):
                    raise  # Auth errors — don't fallback, key is bad
                last_error = e
                logger.warning(f"Model '{model}' failed: {e}. Trying next fallback...")
                continue
        
        # All models exhausted
        raise Exception(
            "All AI models are currently rate-limited. Please wait 30 seconds and try again. "
            "Tip: Add credits at https://openrouter.ai to unlock higher rate limits."
        )

    def _stream_api(self, model: str, clean_messages: list, max_tokens: int):
        """Make a streaming API call with retry logic. Yields token chunks."""
        last_error = None
        
        for attempt in range(self.MAX_RETRIES):
            try:
                stream = self.client.chat.completions.create(
                    model=model,
                    messages=clean_messages,
                    max_tokens=max_tokens,
                    temperature=0.7,
                    stream=True,
                )
                
                # If we get here, the stream was established successfully
                for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
                return  # Stream completed successfully
                
            except openai.RateLimitError as e:
                last_error = e
                wait_time = self.INITIAL_BACKOFF * (2 ** attempt)
                logger.warning(f"Stream rate limit on '{model}' (attempt {attempt+1}/{self.MAX_RETRIES}). Retrying in {wait_time}s...")
                time.sleep(wait_time)
                
            except openai.AuthenticationError as e:
                raise Exception("OpenRouter API key is invalid.")
                
            except openai.BadRequestError as e:
                raise
                
            except Exception as e:
                last_error = e
                break
        
        raise last_error or Exception(f"Failed to stream from '{model}'")

    def generate_response_stream(self, messages: List[Dict[str, str]], max_tokens: int = 4096):
        """
        Stream response tokens one-by-one. Yields string chunks.
        Includes automatic model fallback on rate limits.
        """
        if not self.client:
            raise Exception("OpenRouter API key not configured.")
        
        clean_messages = [
            {'role': msg['role'], 'content': msg['content']}
            for msg in messages
            if msg.get('content')
        ]
        
        # Build fallback chain
        models_to_try = [self.model_name]
        for fb in FALLBACK_MODELS:
            if fb != self.model_name:
                models_to_try.append(fb)
        
        last_error = None
        for i, model in enumerate(models_to_try):
            try:
                if i > 0:
                    logger.info(f"Stream fallback to: {model}")
                yield from self._stream_api(model, clean_messages, max_tokens)
                return  # Success
                
            except openai.RateLimitError:
                last_error = Exception(f"Rate limited on {model}")
                continue
            except openai.BadRequestError:
                continue
            except Exception as e:
                if "API key is invalid" in str(e):
                    raise
                last_error = e
                continue
        
        raise last_error or Exception("All models rate-limited. Please wait and try again.")

    @staticmethod
    def fetch_available_models():
        """Fetch the list of available models from OpenRouter API."""
        import requests as http_requests
        try:
            response = http_requests.get(
                'https://openrouter.ai/api/v1/models',
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                models = data.get('data', [])
                
                curated = []
                for model in models:
                    model_id = model.get('id', '')
                    name = model.get('name', model_id)
                    pricing = model.get('pricing', {})
                    context_length = model.get('context_length', 0)
                    
                    # Cost per 1M tokens
                    prompt_cost = float(pricing.get('prompt', 0)) * 1_000_000 if pricing.get('prompt') else None
                    completion_cost = float(pricing.get('completion', 0)) * 1_000_000 if pricing.get('completion') else None
                    
                    is_free = (prompt_cost == 0 and completion_cost == 0) if prompt_cost is not None else False
                    
                    # Provider category
                    provider = 'other'
                    if model_id.startswith('openai/'): provider = 'openai'
                    elif model_id.startswith('anthropic/'): provider = 'anthropic'
                    elif model_id.startswith('google/'): provider = 'google'
                    elif model_id.startswith('meta-llama/'): provider = 'meta'
                    elif model_id.startswith('mistralai/'): provider = 'mistral'
                    elif model_id.startswith('deepseek/'): provider = 'deepseek'
                    elif model_id.startswith('cohere/'): provider = 'cohere'
                    elif model_id.startswith('qwen/'): provider = 'qwen'
                    
                    curated.append({
                        'id': model_id,
                        'name': name,
                        'provider': provider,
                        'context_length': context_length,
                        'is_free': is_free,
                        'pricing': {
                            'prompt': f"${prompt_cost:.2f}/1M" if prompt_cost is not None else 'N/A',
                            'completion': f"${completion_cost:.2f}/1M" if completion_cost is not None else 'N/A',
                        }
                    })
                
                return curated
            return []
        except Exception as e:
            logger.error(f"Failed to fetch OpenRouter models: {e}")
            return []


class AIServiceFactory:
    """Factory for creating AI service instances."""
    
    # Featured models shown at top of model selector
    FEATURED_MODELS = [
        {'id': 'openai/gpt-4o', 'name': 'GPT-4o', 'provider': 'openai', 'featured': True},
        {'id': 'openai/gpt-4o-mini', 'name': 'GPT-4o Mini', 'provider': 'openai', 'featured': True},
        {'id': 'anthropic/claude-sonnet-4', 'name': 'Claude Sonnet 4', 'provider': 'anthropic', 'featured': True},
        {'id': 'anthropic/claude-3.5-sonnet', 'name': 'Claude 3.5 Sonnet', 'provider': 'anthropic', 'featured': True},
        {'id': 'google/gemini-2.0-flash-001', 'name': 'Gemini 2.0 Flash', 'provider': 'google', 'featured': True},
        {'id': 'google/gemini-2.5-pro-preview', 'name': 'Gemini 2.5 Pro', 'provider': 'google', 'featured': True},
        {'id': 'deepseek/deepseek-chat-v3-0324', 'name': 'DeepSeek V3', 'provider': 'deepseek', 'featured': True},
        {'id': 'deepseek/deepseek-r1', 'name': 'DeepSeek R1', 'provider': 'deepseek', 'featured': True},
        {'id': 'meta-llama/llama-4-maverick', 'name': 'Llama 4 Maverick', 'provider': 'meta', 'featured': True},
        {'id': 'meta-llama/llama-4-scout', 'name': 'Llama 4 Scout', 'provider': 'meta', 'featured': True},
        {'id': 'mistralai/mistral-large-2411', 'name': 'Mistral Large', 'provider': 'mistral', 'featured': True},
        {'id': 'qwen/qwen-2.5-coder-32b-instruct', 'name': 'Qwen 2.5 Coder 32B', 'provider': 'qwen', 'featured': True},
    ]

    @staticmethod
    def get_service(provider_id: str = None, model_id: str = None):
        """Get an AI service. Everything goes through OpenRouter with automatic fallback."""
        return OpenRouterProvider(model_id or 'openai/gpt-4o-mini')
