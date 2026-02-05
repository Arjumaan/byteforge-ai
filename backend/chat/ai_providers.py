
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

    def truncate_context(self, messages: List[Dict], max_tokens: int, reserve_for_response: int = 1000) -> List[Dict]:
        """Truncate message history to fit within token limit."""
        available_tokens = max_tokens - reserve_for_response
        if available_tokens <= 0: return []
        
        truncated = []
        current_tokens = 0
        
        # The last message is the current user prompt, always include it if possible
        user_prompt = messages[-1]
        user_tokens = user_prompt.get('tokens_used') or self.count_tokens(user_prompt.get('content', ''))
        
        # System instruction
        system_instr = messages[0] if messages[0]['role'] == 'system' else None
        system_tokens = self.count_tokens(system_instr['content']) if system_instr else 0
        
        available_tokens -= (user_tokens + system_tokens)
        
        # Add history in reverse
        history = messages[1:-1] if system_instr else messages[:-1]
        
        for message in reversed(history):
            # Use pre-calculated tokens if available in the dictionary
            message_tokens = message.get('tokens_used') or (self.count_tokens(message.get('content', '')) + 4)
            if current_tokens + message_tokens <= available_tokens:
                truncated.insert(0, message)
                current_tokens += message_tokens
            else:
                break
        
        final_messages = []
        if system_instr: final_messages.append(system_instr)
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



class GeminiProvider(AIProvider):
    def __init__(self, model_name='gemini-1.5-flash-latest'):
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
        # Character-based estimation is much faster for high-traffic apps
        # than loading tiktoken dictionaries repeatedly
        return len(text) // 3 + 1

    def generate_response(self, messages: List[Dict], max_tokens: int = 1000):
        if not self.api_keys:
            raise Exception("Gemini API keys not configured")

        # Use Chat Session for better performance and native multi-turn support
        system_instruction, chat_messages = self.build_system_prompt(messages)
        
        # Convert messages to Gemini format
        gemini_history = []
        # messages contains [system_instr, ..., current_user_msg]
        # current_user_msg is the last one
        user_msg = chat_messages[-1]['content']
        history_msgs = chat_messages[:-1]
        
        for msg in history_msgs:
            role = 'user' if msg['role'] == 'user' else 'model'
            gemini_history.append({"role": role, "parts": [msg['content']]})
        
        prompt_tokens = self.count_tokens(user_msg) + sum(m.get('tokens_used', 20) for m in history_msgs)

        attempts = 0
        total_keys = len(self.api_keys)
        
        while attempts < total_keys:
            try:
                # Re-initialize model with system instruction if provided
                model = genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=system_instruction
                )
                
                chat = model.start_chat(history=gemini_history)
                response = chat.send_message(
                    user_msg,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=max_tokens,
                        temperature=0.7,
                    )
                )
                
                # Handle safety filters blocking response
                try:
                    text = response.text if response.candidates else "The AI refused to provide a response due to safety restrictions."
                except Exception:
                    text = "Response blocked by AI safety filters."
                    
                completion_tokens = self.count_tokens(text)
                return text, prompt_tokens, completion_tokens
            except Exception as e:
                error_str = str(e).lower()
                if "429" in error_str or "quota" in error_str or "resource_exhausted" in error_str:
                    logger.warning(f"Gemini Key {self.current_key_index} exhausted. Rotating...")
                    attempts += 1
                    if total_keys > 1:
                        self.current_key_index = (self.current_key_index + 1) % total_keys
                        self._configure_client() # This now updates self.model_name and self.model
                        continue
                    else:
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
