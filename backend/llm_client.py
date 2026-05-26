# gemini_grading_client.py
import os
import io
import time
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field
import logging
from typing import List, Dict, Any, Optional
import google.genai as genai
from google.genai.types import HarmCategory, HarmBlockThreshold, GenerateContentResponse

# Setup logger
logger = logging.getLogger(__name__)

# Network resilience utilities
def _is_network_error(error: Exception) -> bool:
    """Check if an error is a network/DNS error."""
    error_msg = str(error).lower()
    network_keywords = [
        'no such host', 'dial tcp', 'name or service not known',
        'econnrefused', 'timeout', 'connection', 'dns', 'unreachable'
    ]
    return any(kw in error_msg for kw in network_keywords)

def _retry_with_backoff(func, max_retries=3, initial_delay=1.0):
    """Helper function to retry with exponential backoff."""
    last_error = None
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            last_error = e
            if not _is_network_error(e):
                raise
            if attempt >= max_retries - 1:
                raise
            delay = initial_delay * (2 ** attempt)
            logger.warning(
                f"Network error (attempt {attempt + 1}/{max_retries}). "
                f"Retrying in {delay}s... Error: {str(e)[:100]}"
            )
            time.sleep(delay)
    if last_error:
        raise last_error

# --- Response Model ---
class GenerateResponse(BaseModel):
    """A standardized response object for all client calls."""
    response: str = ""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost: float = 0.0
    model: str = ""
    error: Optional[str] = None

# --- Main Client Class ---
class GeminiGradingClient:
    """
    A specialized, robust client for the AI Grading pipeline.
    It handles structured JSON output, cost/token tracking,
    detailed error handling, and automatic retries.
    """
    
    def __init__(self, 
                 model_name: str = "gemini-3-flash-preview",
                 max_retries: int = 3,
                 api_key: Optional[str] = None):
        
        actual_api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not actual_api_key:
            logger.critical("GEMINI_API_KEY not provided and not found in .env")
            raise ValueError("GEMINI_API_KEY not provided and not found in .env")
        
        self.client = genai.Client(api_key=actual_api_key)
        self.model_name = model_name
        self.max_retries = max_retries
        
        # Define universal safety settings
        self.safety_settings = [
            {
                "category": HarmCategory.HARM_CATEGORY_HARASSMENT,
                "threshold": HarmBlockThreshold.BLOCK_NONE
            },
            {
                "category": HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                "threshold": HarmBlockThreshold.BLOCK_NONE
            },
            {
                "category": HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                "threshold": HarmBlockThreshold.BLOCK_NONE
            },
            {
                "category": HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                "threshold": HarmBlockThreshold.BLOCK_NONE
            }
        ]
        
        # All prices are per 1,000,000 tokens
        self.pricing_data = {
            # Standard Interactive Rates
            "gemini-flash-lite-latest": {
                "input_1m": 0.075,
                "output_1m": 0.30
            },
            "gemini-2.0-flash-lite": {
                "input_1m": 0.075,
                "output_1m": 0.30
            },
            "gemini-2.5-flash": {
                "input_1m": 0.30,
                "input_1m_audio": 1.00,
                "output_1m": 2.50
            },
            "gemini-3-flash-preview": {
                "input_1m": 0.50,
                "input_1m_audio": 1.00,
                "output_1m": 3.00
            },
            "gemini-2.5-pro": {
                "tier_1_limit": 200_000,
                "input_1m_tier_1": 1.25,
                "output_1m_tier_1": 10.00,
                "input_1m_tier_2": 2.50,
                "output_1m_tier_2": 15.00
            },
            # Batch Rates (50% Discount)
            "gemini-2.5-flash-batch": {
                "input_1m": 0.15,
                "input_1m_audio": 0.50,
                "output_1m": 1.25
            },
            "gemini-2.5-pro-batch": {
                "tier_1_limit": 200_000,
                "input_1m_tier_1": 0.625,
                "output_1m_tier_1": 5.00,
                "input_1m_tier_2": 1.25,
                "output_1m_tier_2": 7.50
            }
        }

    def _calculate_cost(self, prompt_tokens: int, completion_tokens: int, is_batch: bool = False) -> float:
        """
        Calculate cost based on token usage and tiered pricing.
        Supports batch pricing if is_batch=True.
        """
        try:
            # Determine the correct pricing key
            pricing_key = self.model_name
            if is_batch and not pricing_key.endswith("-batch"):
                pricing_key = f"{pricing_key}-batch"
            
            model_pricing = self.pricing_data.get(pricing_key)
            
            # Fallback: try finding a matching key if exact match fails
            if not model_pricing:
                for key in self.pricing_data:
                    if key in pricing_key:
                        model_pricing = self.pricing_data[key]
                        break
            
            if not model_pricing:
                logger.warning(f"No pricing data for {pricing_key}. Cost is 0.")
                return 0.0

            input_cost = 0.0
            output_cost = 0.0

            # Check for Tiered Pricing (Pro models)
            if "tier_1_limit" in model_pricing:
                limit = model_pricing.get("tier_1_limit", 200_000)
                
                if prompt_tokens <= limit:
                    input_rate = model_pricing.get("input_1m_tier_1", 0)
                    output_rate = model_pricing.get("output_1m_tier_1", 0)
                else:
                    input_rate = model_pricing.get("input_1m_tier_2", 0)
                    output_rate = model_pricing.get("output_1m_tier_2", 0)
                
                input_cost = (prompt_tokens / 1_000_000) * input_rate
                output_cost = (completion_tokens / 1_000_000) * output_rate
            
            # Standard Pricing (Flash models)
            else:
                input_rate = model_pricing.get("input_1m", 0) 
                output_rate = model_pricing.get("output_1m", 0)
                
                input_cost = (prompt_tokens / 1_000_000) * input_rate
                output_cost = (completion_tokens / 1_000_000) * output_rate
            
            return input_cost + output_cost
            
        except Exception as e:
            logger.warning(f"Cost calculation failed: {e}")
            return 0.0

    def _extract_token_usage(self, response: GenerateContentResponse) -> tuple:
        """Extract token usage from Gemini response"""
        try:
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage = response.usage_metadata
                prompt_tokens = getattr(usage, 'prompt_token_count', 0)
                # Output price includes thinking tokens, so 'candidates_token_count' is correct
                completion_tokens = getattr(usage, 'candidates_token_count', 0)
                total_tokens = getattr(usage, 'total_token_count', prompt_tokens + completion_tokens)
                return prompt_tokens, completion_tokens, total_tokens
            
            # Fallback for safety-blocked or empty responses
            return 0, 0, 0
        except Exception as e:
            logger.warning(f"Token usage extraction failed: {e}")
            return 0, 0, 0

    def _handle_error(self, error: Exception) -> GenerateResponse:
        """Handle Gemini API specific errors and return a standard Response object"""
        error_str = str(error).lower()
        error_message = ""
        
        # Parse common Gemini API error patterns
        if "400" in error_str and "invalid_argument" in error_str:
            error_message = "Invalid Argument: The request body is malformed. Check the API reference."
        elif "400" in error_str and "failed_precondition" in error_str:
            error_message = "Failed Precondition: Gemini API free tier is not available. Please enable billing."
        elif "403" in error_str:
            error_message = "Permission Denied: Your API key doesn't have the required permissions."
        elif "404" in error_str:
            error_message = "Not Found: The requested resource wasn't found. Check the model name."
        elif "429" in error_str:
            error_message = "Resource Exhausted: You've exceeded the rate limit. Please wait and retry."
        elif "500" in error_str:
            error_message = "Internal Error: An unexpected error occurred on Google's side."
        elif "503" in error_str:
            error_message = "Service Unavailable: The service may be temporarily overloaded."
        elif "timeout" in error_str:
            error_message = "Request Timeout: The request took too long to process."
        elif "api key" in error_str:
            error_message = "API Key Error: Please check your Google API key is valid."
        else:
            error_message = f"Gemini API Error: {str(error)}"
        
        logger.error(f"Gemini API Error: {error_message}")
        
        return GenerateResponse(
            model=self.model_name,
            error=error_message
        )

    def generate_structured_json(
        self,
        contents: List[Any],
        schema: Dict[str, Any],
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        max_output_tokens: Optional[int] = None,
        stop_sequences: Optional[List[str]] = None,
        call_type_for_logging: str = "structured_call"
    ) -> GenerateResponse:
        """
        Generates structured JSON content from Gemini.
        This is the primary method for the grading pipeline.
        Includes automatic retry logic for network errors.
        """
        
        # Define the generation config
        config_dict = {
            "temperature": temperature if temperature is not None else 0.0,
            "top_p": top_p,
            "top_k": top_k,
            "candidate_count": 1,
            "max_output_tokens": max_output_tokens if max_output_tokens is not None else 65536,
            "stop_sequences": stop_sequences,
            "response_mime_type": "application/json",
            "response_json_schema": schema,
            "safety_settings": self.safety_settings
        }

        try:
            # Use retry helper for network resilience
            def make_request():
                logger.info(f"Making {call_type_for_logging} request to Gemini API...")
                return self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=config_dict,
                )
            
            response = _retry_with_backoff(make_request, max_retries=self.max_retries)
            
            response_text = response.text
            prompt_tokens, completion_tokens, total_tokens = self._extract_token_usage(response)
            
            # Handle safety blocks which have no text
            if not response_text and hasattr(response, 'prompt_feedback'):
                if response.prompt_feedback.block_reason:
                    error_msg = f"Content blocked: {response.prompt_feedback.block_reason}"
                    logger.error(error_msg)
                    return GenerateResponse(model=self.model_name, error=error_msg)

            # Calculate cost (now with tiered logic)
            cost = self._calculate_cost(prompt_tokens, completion_tokens)
            
            logger.info(f"✅ Success: {call_type_for_logging} | Cost: ${cost:.6f} | Tokens: {total_tokens}")

            return GenerateResponse(
                response=response_text,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                cost=cost,
                model=self.model_name
            )

        except Exception as e:
            logger.error(
                f"Failed to complete {call_type_for_logging}: {str(e)[:200]}", 
                exc_info=True
            )
            # Pass to detailed error handler
            return self._handle_error(e)


        # Fallback (should be unreachable)
        return self._handle_error(Exception(f"Failed to get response for {call_type_for_logging}"))

    def generate_text(
        self,
        contents: List[Any],
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        max_output_tokens: Optional[int] = None,
        stop_sequences: Optional[List[str]] = None,
        call_type_for_logging: str = "text_call"
    ) -> GenerateResponse:
        """
        Generates unstructured text content from Gemini.
        This is used for prompt-based generation without JSON schema enforcement.
        Includes automatic retry logic for network errors.
        """
        
        # Define the generation config without JSON schema enforcement
        config_dict = {
            "temperature": temperature if temperature is not None else 0.0,
            "top_p": top_p,
            "top_k": top_k,
            "candidate_count": 1,
            "max_output_tokens": max_output_tokens if max_output_tokens is not None else 65536,
            "stop_sequences": stop_sequences,
            "safety_settings": self.safety_settings
        }

        try:
            # Use retry helper for network resilience
            def make_request():
                logger.info(f"Making {call_type_for_logging} request to Gemini API...")
                # Temporarily support passing client-side api_key if needed, but defaults to self.client
                return self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=config_dict,
                )
            
            response = _retry_with_backoff(make_request, max_retries=self.max_retries)
            
            response_text = response.text
            prompt_tokens, completion_tokens, total_tokens = self._extract_token_usage(response)
            
            # Handle safety blocks which have no text
            if not response_text and hasattr(response, 'prompt_feedback'):
                if response.prompt_feedback.block_reason:
                    error_msg = f"Content blocked: {response.prompt_feedback.block_reason}"
                    logger.error(error_msg)
                    return GenerateResponse(model=self.model_name, error=error_msg)

            # Calculate cost
            cost = self._calculate_cost(prompt_tokens, completion_tokens)
            
            logger.info(f"✅ Success: {call_type_for_logging} | Cost: ${cost:.6f} | Tokens: {total_tokens}")

            return GenerateResponse(
                response=response_text,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                cost=cost,
                model=self.model_name
            )

        except Exception as e:
            logger.error(
                f"Failed to complete {call_type_for_logging}: {str(e)[:200]}", 
                exc_info=True
            )
            # Pass to detailed error handler
            return self._handle_error(e)

        return self._handle_error(Exception(f"Failed to get response for {call_type_for_logging}"))