# import logging
# import asyncio
# from typing import Any, Dict

# from pydantic import ValidationError, BaseModel

# from prompts.src.menus.pydantic_translate import TranslationInput, clean_output
# from prompts.src.menus.pydantic_entity import EntityInput, clean_entity_output
# from prompts.src.menus.translate import TranslateCreatePromptTemplate
# from prompts.src.menus.EmailWriter import EmailWriterCreatePromptTemplate
# from prompts.src.menus.Transliteration import TransliterateCreatePromptTemplate
# from prompts.src.menus.EnterText import QuestionCreatePromptTemplate
# from prompts.src.menus.SimilarQuestion import SimilarQuestionCreatePromptTemplate
# from prompts.src.menus.topic import TopicBasedQuestionCreatePromptTemplate
# from prompts.src.menus.Entity import EntityPromptTemplate
# from prompts.src.models.openaimodels import ChatOpenAIModel
# from prompts.src.models.TogetherModels import TogetherAIModel
# from prompts.src.process_prompt import PromptResponse
# from utils.exceptions import RetryableException, RetryLimitExceededException
# from utils.logging_utils import logger
# from validate.jevaluate import json_validate

# class TransliterationInput(BaseModel):
#     text: str
#     source: str
#     destination: str

# class Pipeline:
#     """
#     A pipeline class that handles generating prompts, loading models, and
#     processing prompts using the loaded models.
#     """

#     def __init__(self):
#         """
#         Initializes the pipeline with necessary components for prompt generation,
#         model loading, and prompt processing.
#         """
#         self.prompt_response = PromptResponse()

#     async def async_pipeline_process(self, menu: str, model_dict: dict, input_data: dict) -> tuple:
#         """
#         Processes the entire pipeline from prompt generation to prompt processing and
#         returns the response content and cost.

#         Args:
#             menu (str): The menu configuration string ("translate" or "transliterate").
#             model_dict (dict): The model configuration dictionary containing information
#             about the model to be loaded.
#             input_data (dict): The input dictionary data containing parameters
#             for prompt generation.

#         Returns:
#             tuple[str, float]: A tuple containing the response content and cost.
#         """
#         # Configure logging
#         logging.basicConfig(
#             filename="prompts/app.log",
#             level=logging.INFO,
#             filemode="w",
#             format="%(name)s - %(levelname)s - %(message)s",
#         )

#         try:
#             # Validate input data and create the prompt
#             if menu == "translate":
#                 menu_object = TranslateCreatePromptTemplate()
#                 logging.info("Translate Object Created")
#                 try:
#                     validated_data = TranslationInput(**input_data)
#                     logging.info("Validated Data with Pydantic")
#                 except ValidationError as e:
#                     logger.error("Validation error: %s", e)
#                     raise
#             elif menu == "transliterate":
#                 menu_object = TransliterateCreatePromptTemplate()
#                 logging.info("Transliterate Object Created")
#                 try:
#                     validated_data = TranslationInput(**input_data)
#                     logging.info("Validated Data with Pydantic")
#                 except ValidationError as e:
#                     logger.error("Validation error: %s", e)
#                     raise
#             elif menu == "entity":
#                 menu_object = EntityPromptTemplate()
#                 logging.info("Entity Recognizer Object Created")
#                 try:
#                     validated_data = TranslationInput(**input_data)
#                     logging.info("Validated Data with Pydantic")
#                 except ValidationError as e:
#                     logger.error("Validation error: %s", e)
#                     raise
#             elif menu == "write_email":

#                 menu_object = EmailWriterCreatePromptTemplate()

#                 logging.info("EmailWriter Object Created")
#                 try:
#                     validated_data = TranslationInput(**input_data)

#                     logging.info("Validated Data with Pydantic")
#                 except ValidationError as e:
#                     logger.error("Validation error: %s", e)
#                     raise
#             elif menu == "enter_text":
#                 menu_object = QuestionCreatePromptTemplate()

#                 logging.info("Question Generator text Object Created")
#                 try:
#                     validated_data = TranslationInput(**input_data)

#                     logging.info("Validated Data with Pydantic")
#                 except ValidationError as e:
#                     logger.error("Validation error: %s", e)
#                     raise
#             elif menu == "similarQuestion":
#                 menu_object=SimilarQuestionCreatePromptTemplate()
#                 logging.info("Question Generator text Object Created")
#                 try:
#                     validated_data = TranslationInput(**input_data)

#                     logging.info("Validated Data with Pydantic")
#                 except ValidationError as e:
#                     logger.error("Validation error: %s", e)
#                     raise
#             elif menu == "topic":
#                 menu_object=TopicBasedQuestionCreatePromptTemplate()
#                 logging.info("Question Generator text Object Created")
#                 try:
#                     validated_data = TranslationInput(**input_data)

#                     logging.info("Validated Data with Pydantic")
#                 except ValidationError as e:
#                     logger.error("Validation error: %s", e)
#                     raise


#             else:
#                 raise ValueError("Unsupported menu type")

#             promptobject = menu_object.create_prompttemplate(validated_data.dict())
#             logging.info("Prompt Created")

#             # Get the AI model to use
#             # model_object = ChatOpenAIModel()
#             if model_dict["model"] == "gpt-3.5-turbo" or model_dict["model"] == "gpt-4-1106-preview" :
#                 model_object = ChatOpenAIModel()
#                 logging.info("ChatOpenAI Object Created")
#                 model = model_object.create_model(model_dict)
#                 logging.info("Model Created")

#                 # Get chain object
#                 chain = promptobject | model
#                 logging.info("Chain Created")

#                 # Get the response by calling LCEL methods
# response_content, cost = await self.prompt_response.get_response(chain,
# validated_data)

#                 logging.info("Response received")
#                 print("--------------")
#                 print(response_content)
#                 print("--------------")
#                 if menu == "write_email" or menu=="entity" or menu=="enter_text" or menu== "similarQuestion" or menu=='topic':
#                     validate_content=response_content,cost

#                 else:
#                     validate_content = json_validate(response_content, cost)


#                 return validate_content

#             else:
#                 logging.info(model_dict)
#                 model_object = TogetherAIModel()
#                 logging.info("TogetherAI Object Created")
#                 model = model_object.create_model(model_dict)
#                 logging.info("TogetherAI Model Created")

#                 # Manually create the prompt using the prompt template
#                 chain = promptobject | model

#                 # prompt="""what is binary tree"""
#                 logging.info("Prompt Created")
#                 print(chain)

#                 # Invoke the Together model with the generated prompt
#                 response_content,_= await self.prompt_response.get_response(chain, validated_data)
#                 logging.info("Response received")
#                 print("----------")
#                 print(response_content)

#                 # validate_content = json_validate(response_content, cost)
#                 print("============================")

#                 return response_content


#         except Exception as e:
#             logger.exception("Exception in async_pipeline_process: %s", e)
#             raise

# async def start_point(menu: str, model_dict: Dict[str, Any], input_dict: Dict[str, Any]) -> str:
#     max_retries = 3  # Set your maximum number of retries
#     retry_delay_seconds = 1  # Set the delay between retries in seconds

#     for retry_count in range(max_retries):
#         try:
#             pipeline = Pipeline()
#             response = await pipeline.async_pipeline_process(menu, model_dict, input_dict)
#             print("hhhhhhhhh")
#             print(type(response))
#             # result = clean_output(response[0].content)


#             if model_dict["model"] == "gpt-3.5-turbo" or model_dict["model"] == "gpt-4-1106-preview" :
#                 if menu=="write_email" or menu=="entity" or menu == "enter_text" or menu== "similarQuestion" or menu=="topic":
#                     print(response)
#                     result=response[0].content
#                     cost = response[1]
#                 else:
#                     result = clean_output(response[0].content)
#                     cost = response[1]
#             else:
#                 result=response
#                 print(result)

#                 cost=0


#             # Log relevant information
#             logger.info("Menu: %s, Cost: %s, Result: %s", menu, cost, result)
#             return result, cost
#         except RetryableException as e:
#             logger.warning("Retrying (attempt %d) due to: %s", retry_count + 1, str(e))
#             await asyncio.sleep(retry_delay_seconds)  # Add delay before retrying if needed
#         except Exception as e:
#             logger.exception("Exception in start_point: %s", e)
#             raise  # Re-raise the exception to be handled by the view

#     # If all retries fail, handle the situation accordingly
#     logger.error("Maximum retries reached. Failed to process.")
#     raise RetryLimitExceededException("Maximum retries reached.")

# class RetryableException(Exception):
#     """Custom exception class for retryable errors."""
#     pass

# class RetryLimitExceededException(Exception):
#     """Custom exception class for exceeding maximum retries."""
#     pass

# import logging
# import asyncio
# import json
# from pathlib import Path
# from typing import Any, Dict

# from pydantic import ValidationError, BaseModel

# from prompts.src.menus.pydantic_translate import TranslationInput, clean_output
# from prompts.src.menus.pydantic_entity import EntityInput, clean_entity_output
# from prompts.src.menus.translate import TranslateCreatePromptTemplate
# from prompts.src.menus.EmailWriter import EmailWriterCreatePromptTemplate
# from prompts.src.menus.Transliteration import TransliterateCreatePromptTemplate
# from prompts.src.menus.EnterText import QuestionCreatePromptTemplate
# from prompts.src.menus.SimilarQuestion import SimilarQuestionCreatePromptTemplate
# from prompts.src.menus.topic import TopicBasedQuestionCreatePromptTemplate
# from prompts.src.menus.Entity import EntityPromptTemplate
# from prompts.src.models.openaimodels import ChatOpenAIModel
# from prompts.src.models.TogetherModels import TogetherAIModel
# from prompts.src.process_prompt import PromptResponse
# from utils.exceptions import RetryableException, RetryLimitExceededException
# from utils.logging_utils import logger
# from validate.jevaluate import json_validate

# # Load model config
# with open(Path(__file__).parent.parent / "model_config.json") as f:
#     MODEL_CONFIG = json.load(f)

# OPENAI_MODELS = MODEL_CONFIG["models"]["OpenAI"]
# TOGETHER_AI_MODELS = [
#     model for provider in MODEL_CONFIG["models"].keys()
#     if provider != "OpenAI" for model in MODEL_CONFIG["models"][provider]
# ]

# class TransliterationInput(BaseModel):
#     text: str
#     source: str
#     destination: str

# class Pipeline:
#     """Pipeline class for handling different AI models and prompts."""

#     def __init__(self):
#         self.prompt_response = PromptResponse()

#     def _is_openai_model(self, model_name: str) -> bool:
#         return model_name in OPENAI_MODELS

#     def _get_model_pricing(self, model_name: str) -> tuple:
#         """Get pricing information for a model."""
#         for provider in MODEL_CONFIG["pricing"]:
#             if model_name in MODEL_CONFIG["pricing"][provider]:
#                 pricing = MODEL_CONFIG["pricing"][provider][model_name]
#                 return pricing["input"] / 1_000_000, pricing["output"] / 1_000_000
#         return 0.0, 0.0  # Default to free if not found

#     async def async_pipeline_process(self, menu: str, model_dict: dict, input_data: dict) -> tuple:
#         logging.basicConfig(
#             filename="prompts/app.log",
#             level=logging.INFO,
#             filemode="w",
#             format="%(name)s - %(levelname)s - %(message)s",
#         )

#         try:
#             # Validate input data and create the prompt
#             if menu == "translate":
#                 menu_object = TranslateCreatePromptTemplate()
#                 logging.info("Translate Object Created")
#                 validated_data = TranslationInput(**input_data)
#             elif menu == "transliterate":
#                 menu_object = TransliterateCreatePromptTemplate()
#                 logging.info("Transliterate Object Created")
#                 validated_data = TranslationInput(**input_data)
#             elif menu == "entity":
#                 menu_object = EntityPromptTemplate()
#                 logging.info("Entity Recognizer Object Created")
#                 validated_data = TranslationInput(**input_data)
#             elif menu == "write_email":
#                 menu_object = EmailWriterCreatePromptTemplate()
#                 logging.info("EmailWriter Object Created")
#                 validated_data = TranslationInput(**input_data)
#             elif menu == "enter_text":
#                 menu_object = QuestionCreatePromptTemplate()
#                 logging.info("Question Generator text Object Created")
#                 validated_data = TranslationInput(**input_data)
#             elif menu == "similarQuestion":
#                 menu_object = SimilarQuestionCreatePromptTemplate()
#                 logging.info("Question Generator text Object Created")
#                 validated_data = TranslationInput(**input_data)
#             elif menu == "topic":
#                 menu_object = TopicBasedQuestionCreatePromptTemplate()
#                 logging.info("Question Generator text Object Created")
#                 validated_data = TranslationInput(**input_data)
#             else:
#                 raise ValueError("Unsupported menu type")

#             promptobject = menu_object.create_prompttemplate(validated_data.dict())
#             logging.info("Prompt Created")

#             if self._is_openai_model(model_dict["model"]):
#                 model_object = ChatOpenAIModel()
#                 logging.info("ChatOpenAI Object Created")
#                 model = model_object.create_model(model_dict)
#                 logging.info("Model Created")

#                 chain = promptobject | model
#                 logging.info("Chain Created")

#                 response_content, cost = await self.prompt_response.get_response(chain, validated_data)
#                 logging.info("Response received")

#                 if menu not in ["write_email", "entity", "enter_text", "similarQuestion", "topic"]:
#                     validate_content = json_validate(response_content, cost)
#                 else:
#                     validate_content = response_content, cost

#                 return validate_content
#             # In the Together AI model processing section of async_pipeline_process():
# # In the Together AI model processing section of async_pipeline_process():
#             # In the Together AI model processing section:
# else:
#     model_object = TogetherAIModel()
#     logging.info("TogetherAI Object Created")
#     model = model_object.create_model(model_dict)
#     logging.info("TogetherAI Model Created")

#     chain = promptobject | model
#     logging.info("Prompt Created")

#     try:
#         # Get the raw response
#         response = await chain.ainvoke(validated_data.dict())

#         # Debug output
#         print(f"DEBUG - Raw Together AI response: {response}")
#         logger.info(f"Raw Together AI response: {response}")

#         # Initialize values
#         response_content = str(response)
#         prompt_tokens = 0
#         completion_tokens = 0

#         # Try to parse the JSON response if it looks like JSON
#         if response_content.startswith('{') and response_content.endswith('}'):
#             try:
#                 response_json = json.loads(response_content)
#                 if isinstance(response_json, dict):
#                     response_content = response_json.get('output', response_content)
#             except json.JSONDecodeError:
#                 pass

#         # Calculate token counts (fallback method)
#         try:
#             # Simple estimation - count words and multiply by average tokens per word
#             input_text = validated_data.text
#             output_text = response_content

#             # Count words in input and output
#             input_words = len(input_text.split())
#             output_words = len(output_text.split())

#             # Estimate tokens (assuming ~1.5 tokens per word)
#             prompt_tokens = int(input_words * 1.5)
#             completion_tokens = int(output_words * 1.5)

#             # Ensure we have at least some tokens
#             prompt_tokens = max(prompt_tokens, 10)  # Minimum 10 tokens for prompt
# completion_tokens = max(completion_tokens, 3)  # Minimum 3 tokens for
# response

#             logger.info(f"Estimated tokens - Input: {input_words} words -> {prompt_tokens} tokens")
#             logger.info(f"Estimated tokens - Output: {output_words} words -> {completion_tokens} tokens")
#         except Exception as e:
#             logger.warning(f"Token estimation failed: {e}")
#             # Default values if estimation fails
#             prompt_tokens = 15
#             completion_tokens = 5

#         # Calculate cost
#         input_cost, output_cost = self._get_model_pricing(model_dict["model"])
#         cost = (prompt_tokens * input_cost) + (completion_tokens * output_cost)
#         cost_breakdown = (
#             f"Estimated Token Usage:\n"
#             f"Prompt Tokens: {prompt_tokens}\n"
#             f"Completion Tokens: {completion_tokens}\n"
#             f"Total Cost (USD): ${cost:.7f}"
#         )
#         logger.info(
#             cost_breakdown
#         )

#         return response_content, cost_breakdown

#     except Exception as e:
#         logger.error(f"Error processing Together AI response: {e}")
#         raise

#         except ValidationError as e:
#             logger.error("Validation error: %s", e)
#             raise
#         except Exception as e:
#             logger.exception("Exception in async_pipeline_process: %s", e)
#             raise

# async def start_point(menu: str, model_dict: Dict[str, Any], input_dict: Dict[str, Any]) -> tuple:
#     max_retries = 3
#     retry_delay_seconds = 1

#     for retry_count in range(max_retries):
#         try:
#             pipeline = Pipeline()
# response, cost = await pipeline.async_pipeline_process(menu, model_dict,
# input_dict)

#             if pipeline._is_openai_model(model_dict["model"]):
#                 if menu in ["write_email", "entity", "enter_text", "similarQuestion", "topic"]:
#                     result = response[0].content
#                     cost = response[1]
#                 else:
#                     result = clean_output(response[0].content)
#                     cost = response[1]
#             else:
#                 result = response
#                 cost = cost

#             logger.info("Menu: %s, Cost: %s, Result: %s", menu, cost, result)
#             return result, cost
#         except RetryableException as e:
#             logger.warning("Retrying (attempt %d) due to: %s", retry_count + 1, str(e))
#             await asyncio.sleep(retry_delay_seconds)
#         except Exception as e:
#             logger.exception("Exception in start_point: %s", e)
#             raise

#     logger.error("Maximum retries reached. Failed to process.")
#     raise RetryLimitExceededException("Maximum retries reached.")

# class RetryableException(Exception):
#     pass

# class RetryLimitExceededException(Exception):
#     pass

import logging
import asyncio
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict

from centralised_llm.src.llm_manager import create_llm_instance
from centralised_llm.src.llm_base import GenerateRequest
from prompts.src.guardrails import QuestionGuardrails
from utils.llm_pricing import compute_billed_cost_async

from pydantic import ValidationError, BaseModel

from prompts.src.menus.pydantic_translate import TranslationInput
from prompts.src.menus.translate import TranslateCreatePromptTemplate
from prompts.src.menus.EmailWriter import EmailWriterCreatePromptTemplate
from prompts.src.menus.Transliteration import TransliterateCreatePromptTemplate
from prompts.src.menus.EnterText import QuestionCreatePromptTemplate
from prompts.src.menus.SimilarQuestion import (
    SimilarQuestionCreatePromptTemplate,
)
from prompts.src.menus.topic import TopicBasedQuestionCreatePromptTemplate
from prompts.src.menus.Entity import EntityPromptTemplate
from utils.exceptions import RetryableException, RetryLimitExceededException
from utils.logging_utils import logger
from pathlib import Path
import json

from pathlib import Path
import json


class TransliterationInput(BaseModel):
    text: str
    source: str
    destination: str


@dataclass
class PipelineResult:
    """Structured LLM outcome for prompts / EasyWithAI (billing + API responses)."""

    content: Any
    model_key: str
    prompt_tokens: int
    completion_tokens: int
    billed_cost: Decimal


class Pipeline:
    """
    A pipeline class that handles generating prompts, loading models, and
    processing prompts using the loaded models.
    """

    def __init__(self):
        """
        Initializes the pipeline with necessary components for prompt generation,
        model loading, and prompt processing.
        """
        pass

    async def async_pipeline_process(
        self, menu: str, model_dict: dict, input_data: dict
    ) -> PipelineResult:
        """
        Processes the entire pipeline from prompt generation to prompt processing and
        returns structured content, token counts, and DB-priced cost.
        """
        # Configure logging
        logging.basicConfig(
            filename="prompts/app.log",
            level=logging.INFO,
            filemode="w",
            format="%(name)s - %(levelname)s - %(message)s",
        )

        try:
            # Validate input data and create the prompt
            if menu == "translate":
                menu_object = TranslateCreatePromptTemplate()
                logging.info("Translate Object Created")
                try:
                    validated_data = TranslationInput(**input_data)
                    logging.info("Validated Data with Pydantic")
                except ValidationError as e:
                    logger.error("Validation error: %s", e)
                    raise
            elif menu == "transliterate":
                menu_object = TransliterateCreatePromptTemplate()
                logging.info("Transliterate Object Created")
                try:
                    validated_data = TranslationInput(**input_data)
                    logging.info("Validated Data with Pydantic")
                except ValidationError as e:
                    logger.error("Validation error: %s", e)
                    raise
            elif menu == "entity":
                menu_object = EntityPromptTemplate()
                logging.info("Entity Recognizer Object Created")
                try:
                    validated_data = TranslationInput(**input_data)
                    logging.info("Validated Data with Pydantic")
                except ValidationError as e:
                    logger.error("Validation error: %s", e)
                    raise
            elif menu == "write_email":

                menu_object = EmailWriterCreatePromptTemplate()

                logging.info("EmailWriter Object Created")
                try:
                    validated_data = TranslationInput(**input_data)

                    logging.info("Validated Data with Pydantic")
                except ValidationError as e:
                    logger.error("Validation error: %s", e)
                    raise
            elif menu == "enter_text":
                menu_object = QuestionCreatePromptTemplate()

                logging.info("Question Generator text Object Created")
                validated_data = input_data
            elif menu == "similarQuestion":
                menu_object = SimilarQuestionCreatePromptTemplate()
                logging.info("Question Generator text Object Created")
                validated_data = input_data
            elif menu == "topic":
                menu_object = TopicBasedQuestionCreatePromptTemplate()
                logging.info("Question Generator text Object Created")
                validated_data = input_data

            else:
                raise ValueError("Unsupported menu type")

            promptobject = menu_object.create_prompttemplate(
                validated_data.dict() if hasattr(validated_data, "dict") else validated_data
            )
            if promptobject is None:
                raise ValueError("Failed to create prompt template. Please check your question generation parameters.")
                
            logging.info("Prompt Created")

            # Use centralized LLM (OpenAI) for question generation
            logging.info("Using Centralized LLM with Guardrails")
            
            # GUARDRAIL: Validate input
            input_text = ""
            input_type = "text"
            
            if hasattr(validated_data, 'dict'):
                data_dict = validated_data.dict()
            else:
                data_dict = validated_data
            
            if menu == "enter_text":
                input_text = data_dict.get('text', '')
                input_type = "text"
            elif menu == "topic":
                input_text = data_dict.get('topicValue', '')
                input_type = "topic"
            elif menu == "similarQuestion":
                input_text = data_dict.get('similar_question', '')
                input_type = "similar"
            if menu in ["enter_text", "topic", "similarQuestion"]:
                if not input_text or str(input_text).strip() == "":
                    raise ValueError(f"Please provide non-empty input {input_type if input_type != 'similar' else 'question'} to generate questions.")

            if input_text:
                # Skip content filtering for transcriptions (they may contain educational discussion)
                # Only apply strict filtering to user-entered text and topics
                skip_filter = (menu == "enter_text")
                validation = QuestionGuardrails.validate_input(input_text, input_type, skip_content_filter=skip_filter)
                if not validation["valid"]:
                    logging.error(f"Input validation failed: {validation['error']}")
                    raise ValueError(validation["error"])
            
            # Format prompt and extract messages
            prompt_vars = validated_data.dict() if hasattr(validated_data, 'dict') else validated_data
            messages = promptobject.format_messages(**prompt_vars)
            
            # Separate system instruction and human prompt for better model adherence
            system_instruction = None
            human_messages = []
            
            for msg in messages:
                # LangChain messages have a .type attribute (system, human, ai, etc.)
                if hasattr(msg, 'type') and msg.type == 'system':
                    system_instruction = msg.content
                else:
                    human_messages.append(msg.content)
            
            # Fallback to older behavior if no system message extracted, 
            # or if multiple messages exist, join them
            formatted_prompt = "\n\n".join(human_messages)
            
            # Create LLM instance using centralized config
            llm_params = {
                "temperature": model_dict.get("temperature", 0),
                "max_tokens": model_dict.get("max_tokens", 2000),
                "response_mime_type": "application/json",
                "module": menu.capitalize()
            }
            if system_instruction:
                llm_params["system_instruction"] = system_instruction
                
            llm = create_llm_instance("gemini", llm_params)
            
            logging.info(f"System instruction present: {system_instruction is not None}")
            logging.info(f"Formatted human prompt length: {len(formatted_prompt)}")
            
            # Generate
            print(f"DEBUG PIPELINE: About to send prompt to LLM. System: {system_instruction is not None}, Prompt Length: {len(formatted_prompt)}")
            request = GenerateRequest(model="gemini", prompt=formatted_prompt)
            response = await llm.generate(request)
            
            # Check for errors in response
            if hasattr(response, 'error') and response.error:
                logging.error(f"LLM generation error: {response.error}")
                raise ValueError(f"Question generation failed: {response.error}")
            
            # Check for empty response before processing
            if response is None:
                logging.error("LLM returned None response")
                raise ValueError("LLM returned None response - check API connectivity and quota")
            
            # Check if response content is empty
            response_content = response.response if hasattr(response, 'response') else response
            if not response_content or len(str(response_content).strip()) == 0:
                logging.error(f"LLM returned empty response. Response object: {response}")
                raise ValueError(f"LLM returned empty response. This may indicate: API content filter blocked the request, API quota exceeded, or network issue. Please try again or check your API key and quotas.")
            
            logging.info(f"LLM Response length: {len(str(response_content))}, First 100 chars: {str(response_content)[:100]}")
            
            # GUARDRAIL: Validate output
            if menu in ["enter_text", "topic", "similarQuestion"]:
                validation = QuestionGuardrails.validate_json_output(response_content)
                if not validation["valid"]:
                    raise ValueError(validation["error"])
            
            # Wrap response
            class ResponseWrapper:
                def __init__(self, content, tokens_info):
                    self.content = content
                    self.response_metadata = {"token_usage": tokens_info}
            
            raw_model = getattr(response, "model", None) or ""
            pt = int(response.prompt_tokens or 0)
            ct = int(response.completion_tokens or 0)
            billed = await compute_billed_cost_async(raw_model, pt, ct)

            response_content = ResponseWrapper(
                response.response,
                {
                    "prompt_tokens": response.prompt_tokens,
                    "completion_tokens": response.completion_tokens,
                    "total_tokens": response.total_tokens,
                },
            )

            return PipelineResult(
                content=response_content,
                model_key=raw_model,
                prompt_tokens=pt,
                completion_tokens=ct,
                billed_cost=billed,
            )


        except Exception as e:
            logger.exception("Exception in async_pipeline_process: %s", e)
            raise


async def start_point(
    menu: str, model_dict: Dict[str, Any], input_dict: Dict[str, Any]
) -> PipelineResult:
    max_retries = 3  # Set your maximum number of retries
    retry_delay_seconds = 1  # Set the delay between retries in seconds

    for retry_count in range(max_retries):
        try:
            pipeline = Pipeline()
            pr = await pipeline.async_pipeline_process(menu, model_dict, input_dict)

            inner = pr.content
            result_content = inner.content if hasattr(inner, "content") else inner

            logger.info(
                "Menu: %s, billed_cost=%s, model=%s, in_tok=%s, out_tok=%s, Result_len=%s",
                menu,
                pr.billed_cost,
                pr.model_key,
                pr.prompt_tokens,
                pr.completion_tokens,
                len(str(result_content)),
            )
            return PipelineResult(
                content=result_content,
                model_key=pr.model_key,
                prompt_tokens=pr.prompt_tokens,
                completion_tokens=pr.completion_tokens,
                billed_cost=pr.billed_cost,
            )
        except RetryableException as e:
            logger.warning(
                "Retrying (attempt %d) due to: %s", retry_count + 1, str(e)
            )
            # Add delay before retrying if needed
            await asyncio.sleep(retry_delay_seconds)
        except Exception as e:
            logger.exception("Exception in start_point: %s", e)
            raise  # Re-raise the exception to be handled by the view

    # If all retries fail, handle the situation accordingly
    logger.error("Maximum retries reached. Failed to process.")
    raise RetryLimitExceededException("Maximum retries reached.")


class RetryableException(Exception):
    """Custom exception class for retryable errors."""


class RetryLimitExceededException(Exception):
    """Custom exception class for exceeding maximum retries."""
