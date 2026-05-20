import logging
import asyncio
from asgiref.sync import sync_to_async
from django.http import HttpResponse
from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes, permission_classes
from authentication.models import User
from adrf.decorators import api_view

from prompts.models import (
    Translation,
    Transliteration,
    Subscription,
    Entity,
    EmailWriter,
    GeneratedQuestion,
    UserFeedback,
)
from promptRightProd.parameters import input_dict, model_dict
from prompts.src.pipeline import start_point, PipelineResult
from utils.llm_pricing import compute_billed_cost_async, normalize_model_key
from prompts.src.guardrails import repair_json_string


from pydantic import ValidationError
import json
import re
from utils.email_utils import send_exception_email
from utils.exceptions import (
    AnotherException,
    InputLengthExceededException,
    RetryableException,
    RetryLimitExceededException,
    SomeSpecificException,
)
from prompts.utils import RazorpayOrder
import time
from prompts.serializers import SubscriptionSerializer, UserFeedbackSerializer
from .decorators import anonymous_rate_limit, credit_check_decorator
import os
import tempfile
import sys
from google import genai
from google.genai import types as genai_types
from centralised_llm.src.llm_manager import generate_with_file
import mimetypes
# Ensure we can find binary utilities if needed
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

logger = logging.getLogger(__name__)
def _organization_feature_block_response(request, feature_key):
    tenant = getattr(request, "tenant", None)
    tenant_type = getattr(tenant, "type", None)
    if tenant_type != "ORGANIZATION":
        return None
    org = getattr(tenant, "organization_profile", None)
    if org is None:
        return Response(
            {"error": "Organization context not found."},
            status=status.HTTP_403_FORBIDDEN,
        )
    allowed = {
        "question_whiz": bool(getattr(org, "question_whiz_enabled", False)),
    }.get(feature_key, True)
    if allowed:
        return None
    return Response(
        {
            "error": "This feature is disabled for your organization subscription. Please contact your admin.",
            "feature": feature_key,
        },
        status=status.HTTP_403_FORBIDDEN,
    )



# List to store input texts and responses for each translation
translation_history = []
email_history = []
# cost calculation


def cost_cal(input_str: str) -> float:
    # Split the string by '$' and take the part after it
    try:
        dollar_part = input_str.split("$")[-1].strip()
        return float(dollar_part)
    except (IndexError, ValueError):
        raise ValueError("Cost value not found or invalid format.")


def _usage_from_pipeline(pr: PipelineResult, input_length: int) -> dict:
    """Fields for API response and credit_check_decorator / UsageHistory."""
    return {
        "cost": float(pr.billed_cost),
        "model": pr.model_key,
        "model_key": normalize_model_key(pr.model_key),
        "prompt_tokens": pr.prompt_tokens,
        "completion_tokens": pr.completion_tokens,
        "input_length": input_length,
    }


async def async_get_prompt(request):
    """
    Asynchronous view function to handle prompt retrieval.
    """
    if request.method == "POST":
        menu = request.POST.get("user_text", "")
        try:
            pr = await start_point(menu, model_dict, input_dict)
            return HttpResponse(pr.content)
        except Exception as e:
            logger.exception("An unexpected error occurred: %s", str(e))
            return Response(
                {
                    "error": "An unexpected error occurred. Please try again or contact support."
                },
                status=500,
            )
    else:
        return render(request, "email.html")


def save_translation_sync(request, translation_request, response, cost):
    """
    Synchronous function to save translation in the database.
    """
    user = None

    # Try to get user from request.user
    if hasattr(request, "user") and request.user.is_authenticated:
        user = request.user
    else:
        # Fallback: Try to get user by email
        user_email = (
            request.query_params.get("email")
            if hasattr(request, "query_params")
            else None
        )
        if user_email:
            try:
                from django.contrib.auth import get_user_model

                User = get_user_model()
                user = User.objects.filter(email=user_email).first()
            except Exception as e:
                logger.error(f"Error finding user by email: {e}")

    print(f"User for translation save: {user}")

    return Translation.objects.create(
        user=user,
        input_text=translation_request["text"],
        input_source=translation_request["source"],
        input_destination=translation_request["destination"],
        input_domain=translation_request.get("domain", ""),
        input_subdomain=translation_request.get("subdomain", ""),
        output_response=str(response),
        cost=str(cost),
    )


async def save_translation_async(request, translation_request, response, cost):
    """
    Asynchronous function to save translation in the database.
    """
    return await sync_to_async(save_translation_sync)(
        request, translation_request, response, cost
    )


def save_transliteration_sync(request, translation_request, response, cost):
    """
    Synchronous function to save transliteration in the database.
    """
    user = None

    # Try to get user from request.user
    if hasattr(request, "user") and request.user.is_authenticated:
        user = request.user
    else:
        # Fallback: Try to get user by email
        user_email = (
            request.query_params.get("email")
            if hasattr(request, "query_params")
            else None
        )
        if user_email:
            try:
                from django.contrib.auth import get_user_model

                User = get_user_model()
                user = User.objects.filter(email=user_email).first()
            except Exception as e:
                logger.error(f"Error finding user by email: {e}")
    return Transliteration.objects.create(
        user=user,
        input_text=translation_request["text"],
        input_source=translation_request["source"],
        input_destination=translation_request["destination"],
        output_response=str(response),
        cost=str(cost),
    )


async def save_transliteration_async(
    request, translation_request, response, cost
):
    """
    Asynchronous function to save transliteration in the database.
    """
    return await sync_to_async(save_transliteration_sync)(
        request, translation_request, response, cost
    )


def save_entity_sync(request, entity_request, response, cost):
    user = None

    # Try to get user from request.user
    if hasattr(request, "user") and request.user.is_authenticated:
        user = request.user
    else:
        # Fallback: Try to get user by email
        user_email = (
            request.query_params.get("email")
            if hasattr(request, "query_params")
            else None
        )
        if user_email:
            try:
                from django.contrib.auth import get_user_model

                User = get_user_model()
                user = User.objects.filter(email=user_email).first()
            except Exception as e:
                logger.error(f"Error finding user by email: {e}")
    return Entity.objects.create(
        user=user,
        input_text=entity_request["text"],
        entity=entity_request["Entity"],
        custom_entity=entity_request["CustomEntity"],
        output_response=str(response),
        cost=str(cost),
    )


async def save_entity_async(request, entity_request, response, cost):
    return await sync_to_async(save_entity_sync)(
        request, entity_request, response, cost
    )


def save_counts_of_user(request):
    if isinstance(request.user, User):
        user = User.objects.get(email=request.user.email)
        if user.free_trial_hits < 1000:
            user.free_trial_hits += 1
            user.save()
        else:
            return False


async def save_count_async(request):
    return await sync_to_async(save_counts_of_user)(request)


@api_view(["GET"])
@credit_check_decorator
@anonymous_rate_limit
async def get_translation(request, *args, **kwargs):
    """
    Asynchronous view function to handle translation requests.
    """
    print("[TRANSLATION VIEW] Processing translation request")
    user_email = request.query_params.get("email")
    if not user_email:
        return Response(
            {"error": "Authentication required. Email is missing."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    global translation_history

    if request.method == "GET":
        try:
            res = await save_count_async(request)
            if not res:
                return Response(
                    {"translation": "Dear user kindly subscribe"},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )
        except Exception:
            pass

        try:
            menu = "translate"
            max_length_limit = 1000
            input_text = request.query_params.get("inputText", "")

            if not input_text:
                return Response(
                    {"error": "Input text is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if len(input_text) > max_length_limit:
                return Response(
                    {
                        "error": f"Input text exceeds the maximum length limit of {max_length_limit} characters."
                    },
                    status=400,
                )

            translation_request = {
                "text": input_text,
                "source": request.query_params.get(
                    "sourceLanguage", "English"
                ),
                "destination": request.query_params.get(
                    "destinationLanguage", ""
                ),
                "domain": request.query_params.get("domain", ""),
                "subdomain": request.query_params.get("subDomain", ""),
            }
            model_dict = {
                "model": request.query_params.get("model", "gpt-3.5-turbo"),
                "temperature": float(
                    request.query_params.get("temperature", 0.7)
                ),
                "max_tokens": int(request.query_params.get("maxOutput", 1000)),
                "top_k": int(request.query_params.get("TopK", 1)),
            }

            pr = await start_point(menu, model_dict, translation_request)
            await save_translation_async(
                request, translation_request, pr.content, str(pr.billed_cost)
            )
            translation_history.append(
                {
                    "input": input_text,
                    "response": pr.content,
                    "timestamp": time.time(),
                }
            )

            return Response(
                {
                    "translation": pr.content,
                    "service_type": "translation",
                    **_usage_from_pipeline(pr, len(input_text)),
                }
            )

        except SomeSpecificException:
            logger.exception("A specific error occurred during translation.")
            return Response(
                {"error": "A specific error occurred during translation."},
                status=500,
            )

        except AnotherException:
            logger.exception("Another error occurred during translation.")
            return Response(
                {"error": "Another error occurred during translation."},
                status=500,
            )

        except RetryableException as e:
            logger.warning(
                "A retryable error occurred: %s. Retrying...", str(e)
            )
            retry_count = 0
            while retry_count < 3:
                try:
                    pr = await start_point(menu, model_dict, translation_request)
                    await save_translation_async(
                        request, translation_request, pr.content, str(pr.billed_cost)
                    )
                    return Response(
                        {
                            "translation": pr.content,
                            "service_type": "translation",
                            **_usage_from_pipeline(pr, len(input_text)),
                        }
                    )
                except RetryableException as e:
                    retry_count += 1
                    logger.warning("Retry %d failed: %s", retry_count, str(e))
                    continue

            logger.error("Max retries exceeded for translation.")
            raise RetryLimitExceededException(
                "Max retries exceeded for translation."
            )

        except InputLengthExceededException:
            logger.exception("Input text length exceeded the limit.")
            return Response(
                {"error": "Input text length exceeded the limit."}, status=400
            )

        except Exception as e:
            logger.exception("An unexpected error occurred: %s", str(e))
            send_exception_email("admin@example.com", str(e))
            return Response(
                {
                    "error": "An unexpected error occurred. Please try again or contact support."
                },
                status=500,
            )


def save_email_sync(request, email_request, response, cost):
    """
    Synchronous function to save email in the database.
    """
    user = None

    # Try to get user from request.user
    if hasattr(request, "user") and request.user.is_authenticated:
        user = request.user
    else:
        # Fallback: Try to get user by email
        user_email = (
            request.query_params.get("email")
            if hasattr(request, "query_params")
            else None
        )
        if user_email:
            try:
                from django.contrib.auth import get_user_model

                User = get_user_model()
                user = User.objects.filter(email=user_email).first()
            except Exception as e:
                logger.error(f"Error finding user by email: {e}")
    return EmailWriter.objects.create(
        user=user,
        selectedType=email_request["type_of_mail"],
        tone=email_request["tone"],
        recipient=email_request["recipient"],
        purpose=email_request["purpose"],
        personalized=email_request["content"],
        generated_email=str(response),
        cost=str(cost),
    )


async def save_email_async(request, email_request, response, cost):
    """
    Asynchronous function to save email in the database.
    """
    return await sync_to_async(save_email_sync)(
        request, email_request, response, cost
    )


@api_view(["GET"])
@credit_check_decorator
@anonymous_rate_limit
async def get_email(request, *args, **kwargs):
    """
    Asynchronous view function to handle email writing requests.
    """
    print("[TRANSLATION VIEW] Processing email writer request")
    user_email = request.query_params.get("email")
    if not user_email:
        return Response(
            {"error": "Authentication required. Email is missing."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    global email_history

    if request.method == "GET":
        try:
            res = await save_count_async(request)
            if not res:
                return Response(
                    {"email": "Dear user kindly subscribe"},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )
        except Exception:
            pass

        try:
            menu = "write_email"

            max_length_limit = 1000
            input_text = request.query_params.get("personalized", "")

            if len(input_text) > max_length_limit:
                return Response(
                    {
                        "error": "Input text exceeds the maximum length limit of {} characters.".format(
                            max_length_limit
                        )
                    },
                    status=400,
                )

            email_request = {
                "type_of_mail": request.query_params.get("selectedType", ""),
                "tone": request.query_params.get("tone", ""),
                "recipient": request.query_params.get("recipient", ""),
                "purpose": request.query_params.get("purpose", ""),
                "content": input_text,
            }
            model_dict = {
                "model": request.query_params.get("model", ""),
                "temperature": request.query_params.get("temperature", ""),
                "max_tokens": request.query_params.get("maxOutput", ""),
                "top_k": request.query_params.get("TopK", ""),
            }
            print(email_request)

            pr = await start_point(menu, model_dict, email_request)

            email_history.append({"input": input_text, "response": pr.content})

            await save_email_async(request, email_request, pr.content, str(pr.billed_cost))

            return Response(
                {
                    "email": pr.content,
                    "service_type": "emailwriter",
                    **_usage_from_pipeline(pr, len(input_text)),
                }
            )

        except SomeSpecificException:
            logger.exception(
                "A specific error occurred during email composition."
            )
            return Response(
                {
                    "error": "A specific error occurred during email composition."
                },
                status=500,
            )

        except AnotherException:
            logger.exception(
                "Another error occurred during email composition."
            )
            return Response(
                {"error": "Another error occurred during email composition."},
                status=500,
            )

        except RetryableException as e:
            logger.warning(
                "A retryable error occurred: %s. Retrying...", str(e)
            )
            retry_count = 0
            while retry_count < 3:
                try:
                    pr = await start_point(menu, model_dict, email_request)
                    await save_email_async(
                        request, email_request, pr.content, str(pr.billed_cost)
                    )
                    return Response(
                        {
                            "email": pr.content,
                            "service_type": "emailwriter",
                            **_usage_from_pipeline(pr, len(input_text)),
                        }
                    )
                except RetryableException as e:
                    retry_count += 1
                    logger.warning("Retry %d failed: %s", retry_count, str(e))
                    continue

            logger.error("Max retries exceeded for email composition.")
            raise RetryLimitExceededException(
                "Max retries exceeded for email composition."
            )

        except InputLengthExceededException:
            logger.exception("Input text length exceeded the limit.")
            return Response(
                {"error": "Input text length exceeded the limit."}, status=400
            )

        except Exception as e:
            logger.exception("An unexpected error occurred: %s", str(e))
            send_exception_email("admin@example.com", str(e))
            return Response(
                {
                    "error": "An unexpected error occurred. Please try again or contact support."
                },
                status=500,
            )


@api_view(["GET"])
@credit_check_decorator
@anonymous_rate_limit
async def get_transliteration(request, *args, **kwargs):
    """
    Asynchronous view function to handle transliteration requests.
    """
    if request.method == "GET":
        try:
            res = await save_count_async(request)
            if not res:
                return Response(
                    {"transliteration": "Dear user kindly subscribe"},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )
        except Exception:
            pass

        try:
            menu = "transliterate"

            max_length_limit = 1000
            input_text = request.query_params.get("inputText", "")

            if len(input_text) > max_length_limit:
                return Response(
                    {
                        "error": "Input text exceeds the maximum length limit of {} characters.".format(
                            max_length_limit
                        )
                    },
                    status=400,
                )

            translation_request = {
                "text": input_text,
                "source": request.query_params.get("sourceLanguage", ""),
                "destination": request.query_params.get(
                    "destinationLanguage", ""
                ),
            }
            model_dict = {
                "model": request.query_params.get("model", ""),
                "temperature": request.query_params.get("temperature", ""),
                "max_tokens": request.query_params.get("maxOutput", ""),
                "top_k": request.query_params.get("TopK", ""),
            }

            pr = await start_point(menu, model_dict, translation_request)

            await save_transliteration_async(
                request, translation_request, pr.content, str(pr.billed_cost)
            )
            print(pr.content)

            return Response(
                {
                    "transliteration": pr.content,
                    "service_type": "transliteration",
                    **_usage_from_pipeline(pr, len(input_text)),
                }
            )

        except SomeSpecificException:
            logger.exception(
                "A specific error occurred during transliteration."
            )
            return Response(
                {"error": "A specific error occurred during transliteration."},
                status=500,
            )

        except AnotherException:
            logger.exception("Another error occurred during transliteration.")
            return Response(
                {"error": "Another error occurred during transliteration."},
                status=500,
            )

        except RetryableException as e:
            logger.warning(
                "A retryable error occurred: %s. Retrying...", str(e)
            )
            retry_count = 0
            while retry_count < 3:
                try:
                    pr = await start_point(menu, model_dict, translation_request)
                    await save_transliteration_async(
                        request, translation_request, pr.content, str(pr.billed_cost)
                    )
                    return Response(
                        {
                            "transliteration": pr.content,
                            "service_type": "transliteration",
                            **_usage_from_pipeline(pr, len(input_text)),
                        }
                    )
                except RetryableException as e:
                    retry_count += 1
                    logger.warning("Retry %d failed: %s", retry_count, str(e))
                    continue

            logger.error("Max retries exceeded for transliteration.")
            raise RetryLimitExceededException(
                "Max retries exceeded for transliteration."
            )

        except InputLengthExceededException:
            logger.exception("Input text length exceeded the limit.")
            return Response(
                {"error": "Input text length exceeded the limit."}, status=400
            )

        except Exception as e:
            logger.exception("An unexpected error occurred: %s", str(e))
            send_exception_email(
                "Exception Occurred", str(e)
            )
            return Response(
                {
                    "error": "An unexpected error occurred. Please try again or contact support."
                },
                status=500,
            )


@api_view(["GET"])
@credit_check_decorator
@anonymous_rate_limit
async def get_entity(request, *args, **kwargs):
    if request.method == "GET":
        try:
            res = await save_count_async(request)
            if not res:
                return Response(
                    {"entity": "Dear user kindly subscribe"},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )
        except Exception:
            pass

        try:
            menu = "entity"
            max_length_limit = 1000
            input_text = request.query_params.get("input", "")

            if len(input_text) > max_length_limit:
                return Response(
                    {
                        "error": f"Input text exceeds the maximum length limit of {max_length_limit} characters."
                    },
                    status=400,
                )

            entity_request = {
                "text": input_text,
                "Entity": request.query_params.get("entities", ""),
                "CustomEntity": request.query_params.get("customEntity", ""),
            }
            model_dict = {
                "model": request.query_params.get("model", ""),
                "temperature": request.query_params.get("temperature", ""),
                "max_tokens": request.query_params.get("maxOutput", ""),
                "top_k": request.query_params.get("TopK", ""),
            }

            pr = await start_point(menu, model_dict, entity_request)
            await save_entity_async(request, entity_request, pr.content, str(pr.billed_cost))
            print(f"{pr.content} this is ....")

            return Response(
                {
                    "entity": pr.content,
                    "service_type": "entity",
                    **_usage_from_pipeline(pr, len(input_text)),
                }
            )

        except SomeSpecificException:
            logger.exception(
                "A specific error occurred during entity extraction."
            )
            return Response(
                {
                    "error": "A specific error occurred during entity extraction."
                },
                status=500,
            )

        except AnotherException:
            logger.exception(
                "Another error occurred during entity extraction."
            )
            return Response(
                {"error": "Another error occurred during entity extraction."},
                status=500,
            )

        except RetryLimitExceededException as e:
            logger.exception(
                "Retry limit exceeded for entity extraction request: %s",
                str(e),
            )
            return Response(
                {
                    "error": "Retry limit exceeded for entity extraction request."
                },
                status=500,
            )

        except RetryableException as e:
            logger.exception(
                "Retryable error occurred during entity extraction request: %s",
                str(e),
            )
            return Response(
                {
                    "error": "Retryable error occurred during entity extraction request."
                },
                status=500,
            )

        except InputLengthExceededException as e:
            logger.exception(
                "Input length exceeded during entity extraction request: %s",
                str(e),
            )
            return Response(
                {
                    "error": "Input length exceeded during entity extraction request."
                },
                status=400,
            )

        except Exception as e:
            send_exception_email("Exception Occurred", str(e))
            logger.exception("An unexpected error occurred: %s", str(e))
            return Response(
                {
                    "error": "An unexpected error occurred. Please try again or contact support."
                },
                status=500,
            )


class SubscriptionViewset(APIView):
    permission_classes = [IsAuthenticated]
    queryset = Subscription.objects.all()

    def post(self, request):
        razorpay = RazorpayOrder()

        user = request.user
        try:
            data = request.data
            amount = data["amount"]

        except Exception:
            return Response(
                {"message": "amount is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the order
        try:
            orderCreate = razorpay.create_order(amount)
        except Exception:
            return Response(
                {"message": "key is not set"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            subscription = Subscription.objects.create(
                user=user, amount=amount, orderID=orderCreate["id"]
            )
            subscriptionSerializer = SubscriptionSerializer(subscription)
        except Exception:
            return Response(
                {"message": "Object is not created in subscription table"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {
                "message": "success",
                "subscription": subscriptionSerializer.data,
            },
            status=status.HTTP_201_CREATED,
        )



def process_json_response(response_content: str, requested_format: str = "JSON") -> dict:
    """Helper to parse and validate LLM JSON response"""
    # Backend always generates JSON, formatValue only controls frontend display
    try:
        # More robust JSON extraction
        # First try to remove markdown fences if present
        clean_content = response_content.strip()
        if clean_content.startswith("```"):
            # Remove the first and last lines (fences)
            lines = clean_content.splitlines()
            if len(lines) > 2:
                # Find the first line after ```json or similar
                start_idx = 1 if not lines[0].strip().endswith('{') and not lines[0].strip().endswith('[') else 0
                # Find the last line before ```
                end_idx = -1 if lines[-1].strip() == "```" else len(lines)
                clean_content = "\n".join(lines[start_idx:end_idx]).strip()

        # Fallback to regex if logic above didn't yield valid JSON
        json_match = re.search(r'([\{\[].*[\}\]])', clean_content, re.DOTALL)
        if json_match:
            clean_content = json_match.group(1).strip()
        
        # Self-heal unescaped quotes and trailing commas
        repaired_content = repair_json_string(clean_content)
        
        # Parse JSON directly
        data = json.loads(repaired_content)
        
        # Normalize structure
        if isinstance(data, list):
            return {"questions": data}
        elif isinstance(data, dict):
            if "questions" not in data:
                for alt_key in ["items", "results", "generated_questions"]:
                    if alt_key in data and isinstance(data[alt_key], list):
                        data["questions"] = data.pop(alt_key)
                        return data
                # If no questions key found, but there's at least one list, maybe that's it?
                lists = [v for v in data.values() if isinstance(v, list)]
                if len(lists) == 1:
                    return {"questions": lists[0]}
            return data
        return {"questions": [], "raw_fallback": response_content, "error": "Invalid JSON structure"}

    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"JSON parsing failed: {e}")
        # Return fallback structure
        return {"questions": [], "raw_fallback": response_content, "error": str(e)}


@api_view(["GET"])
@credit_check_decorator
@anonymous_rate_limit
async def get_question(request, *args, **kwargs):
    """
    Asynchronous view function to handle question generation requests.
    """
    global question_request
    if request.method == "GET":
        from asgiref.sync import sync_to_async
        blocked = await sync_to_async(_organization_feature_block_response)(request, "question_whiz")
        if blocked:
            return blocked
        try:
            # Check and save user hit counts
            res = await save_count_async(request)
            if not res:
                return Response(
                    {"question": "Dear user kindly subscribe"},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )
        except Exception:
            pass

        try:
            # Maximum input text length limit
            max_length_limit = 1000

            # Retrieve query parameters
            question_type = request.query_params.get("questionType", "")
            num_questions = request.query_params.get("numQuestionsValue", "")
            bloom = request.query_params.get("bloomValue", "")
            level = request.query_params.get("levelValue", "")
            num_options = request.query_params.get("numberOfOptionsValue", "")
            option_type = request.query_params.get("optionTypeValue", "")
            num_missing_words = request.query_params.get(
                "numberOfMissingWordsValue", ""
            )
            representing_words = request.query_params.get(
                "representingWordsValue", ""
            )
            num_items = request.query_params.get("numberOfItemsValue", "")
            learning_obj = request.query_params.get("learningObj", "")
            provide_answer = request.query_params.get("provideAnswerValue", "")
            explanation = request.query_params.get("explanationValue", "")
            format_value = request.query_params.get("formatValue", "")
            text = request.query_params.get("enterTheText", "")
            similar_question = request.query_params.get("similarQuestion", "")
            topicValue = request.query_params.get("topicValue", "")
            subtopicValue = request.query_params.get("subtopicValue", "")
            exampleValue = request.query_params.get("exampleValue", "")
            conceptValue = request.query_params.get("conceptValue", "")
            constraintsValue = request.query_params.get("constraintsValue", "")
            keywordsValue = request.query_params.get("keywordsValue", "")
            showTopic = request.query_params.get("showTopic", "")
            showContent = request.query_params.get("showContent", "")
            showSimilar = request.query_params.get("showSimilar", "")

            # Construct the question request
            question_request = {
                "questionType": question_type,
                "numQuestionsValue": num_questions,
                "bloomValue": bloom,
                "levelValue": level,
                "numberOfOptionsValue": num_options,
                "optionTypeValue": option_type,
                "numberOfMissingWordsValue": num_missing_words,
                "representingWordsValue": representing_words,
                "numberOfItemsValue": num_items,
                "learningObj": learning_obj,
                "provideAnswerValue": provide_answer,
                "explanationValue": explanation,
                "formatValue": format_value,
            }

            # Use centralized LLM config (model defined in llm_config.json)
            model_dict = {
                "temperature": 0,
                "max_tokens": 2000,
            }

            # Generate question using the pipeline
            if showContent == "true":
                question_request["text"] = text
                pr = await start_point("enter_text", model_dict, question_request)
                service_type = "question_content"
            elif showSimilar == "true":
                question_request["similar_question"] = similar_question
                pr = await start_point("similarQuestion", model_dict, question_request)
                service_type = "question_similar"
            elif showTopic == "true":
                question_request["topicValue"] = topicValue
                question_request["subtopicValue"] = subtopicValue
                question_request["exampleValue"] = exampleValue
                question_request["conceptValue"] = conceptValue
                question_request["constraintsValue"] = constraintsValue
                question_request["keywordsValue"] = keywordsValue
                pr = await start_point("topic", model_dict, question_request)
                service_type = "question_topic"
            else:
                return Response(
                    {"error": "Specify showContent, showSimilar, or showTopic."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            respons = pr.content
            cost = str(pr.billed_cost)

            # Log token usage and cost
            logger.info(
                f"[TOKEN USAGE] Tab: {service_type} | Cost: ${float(pr.billed_cost):.6f}"
            )

            # Calculate input length based on the type of question generation
            input_length = 0
            if showContent == "true":
                input_length = len(text)
            elif showSimilar == "true":
                input_length = len(similar_question)
            elif showTopic == "true":
                input_length = len(str(question_request))

            # Process the response for JSON output
            formatted_respons = process_json_response(respons, format_value)
            
            # Save the raw response in the database
            await save_question_async(request, question_request, respons, cost)

            return Response(
                {
                    "question": formatted_respons,
                    "service_type": service_type,
                    **_usage_from_pipeline(pr, input_length),
                }
            )

        except SomeSpecificException:
            logger.exception(
                "A specific error occurred during question generation."
            )
            return Response(
                {
                    "error": "A specific error occurred during question generation."
                },
                status=500,
            )

        except AnotherException:
            logger.exception(
                "Another error occurred during question generation."
            )
            return Response(
                {
                    "error": "Another error occurred during question generation."
                },
                status=500,
            )

        except RetryableException as e:
            logger.warning(
                "A retryable error occurred: %s. Retrying...", str(e)
            )
            retry_count = 0
            while retry_count < 3:
                try:
                    pr_retry = await start_point(
                        "enter_text", model_dict, question_request
                    )
                    await save_translation_async(
                        request, question_request, pr_retry.content, str(pr_retry.billed_cost)
                    )
                    return Response(
                        {
                            "question": pr_retry.content,
                            "service_type": service_type,
                            **_usage_from_pipeline(pr_retry, input_length),
                        }
                    )
                except RetryableException as e:
                    retry_count += 1
                    logger.warning("Retry %d failed: %s", retry_count, str(e))
                    continue

            logger.error("Max retries exceeded for question generation.")
            raise RetryLimitExceededException(
                "Max retries exceeded for question generation."
            )

        except InputLengthExceededException:
            logger.exception("Input text length exceeded the limit.")
            return Response(
                {
                    "error": f"Input text length exceeded the limit of {max_length_limit} characters."
                },
                status=400,
            )

        except ValueError as e:
            logger.warning("Validation error during question generation: %s", str(e))
            return Response(
                {
                    "error": str(e)
                },
                status=400,
            )

        except Exception as e:
            logger.exception("An unexpected error occurred: %s", str(e))
            send_exception_email(
                "Exception Occurred", str(e)
            )
            return Response(
                {
                    "error": "An unexpected error occurred. Please try again or contact support."
                },
                status=500,
            )


async def save_question_async(request, question_request, response, cost):
    return await sync_to_async(save_question_sync)(
        request, question_request, response, cost
    )


def save_question_sync(request, question_request, response, cost):
    """
    Synchronous function to save generated questions in the database.
    """
    user = request.user if isinstance(request.user, User) else None
    return GeneratedQuestion.objects.create(
        user=user,
        question_type=question_request.get("questionType"),
        num_questions=question_request.get("numQuestionsValue"),
        bloom=question_request.get("bloomValue"),
        level=question_request.get("levelValue"),
        num_options=question_request.get("numberOfOptionsValue"),
        option_type=question_request.get("optionTypeValue"),
        num_missing_words=question_request.get("numberOfMissingWordsValue"),
        representing_words=question_request.get("representingWordsValue"),
        num_items=question_request.get("numberOfItemsValue"),
        learning_obj=question_request.get("learningObj"),
        provide_answer=question_request.get("provideAnswerValue"),
        explanation=question_request.get("explanationValue"),
        # Remove or handle format field appropriately
        response=str(response),
        cost=str(cost),
    )


@api_view(["POST"])
def submit_feedback(request):
    """
    Handle user feedback submission from the frontend
    """
    print("=== Feedback submission received ===")
    print("Request method:", request.method)
    print("Request data:", request.data)
    print("Request user:", request.user)
    print(
        "Request META:",
        {k: v for k, v in request.META.items() if k.startswith("HTTP_")},
    )

    try:
        serializer = UserFeedbackSerializer(data=request.data)
        print("Serializer data:", request.data)
        print("Serializer is valid:", serializer.is_valid())

        if serializer.is_valid():
            print("Serializer errors:", serializer.errors)

            # Get user from request if authenticated
            user = None
            if hasattr(request, "user") and request.user.is_authenticated:
                user = request.user
                print("User authenticated:", user.email)
            else:
                print("User not authenticated")

                # Try to get user from Authorization header (JWT token)
                auth_header = request.META.get("HTTP_AUTHORIZATION", "")
                if auth_header.startswith("Bearer "):
                    token = auth_header.split(" ")[1]
                    print("JWT token found:", token[:20] + "...")

                    try:
                        from rest_framework_simplejwt.tokens import AccessToken
                        from django.contrib.auth import get_user_model

                        User = get_user_model()

                        # Decode the token
                        access_token = AccessToken(token)
                        user_id = access_token["user_id"]
                        user = User.objects.get(id=user_id)
                        print("User found from JWT:", user.email)
                    except Exception as e:
                        print("Error decoding JWT token:", str(e))
                        user = None
            print("User for feedback:", user)

            # Get IP address
            ip_address = None
            if hasattr(request, "META"):
                x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
                if x_forwarded_for:
                    ip_address = x_forwarded_for.split(",")[0].strip()
                else:
                    ip_address = request.META.get("REMOTE_ADDR")
            print("IP address:", ip_address)

            # Create feedback object
            feedback = UserFeedback.objects.create(
                user=user,
                emoji_rating=serializer.validated_data.get("emoji_rating"),
                comment=serializer.validated_data.get("comment"),
                ip_address=ip_address,
            )

            print("Feedback created successfully:", feedback.id)

            return Response(
                {
                    "message": "Feedback submitted successfully",
                    "feedback_id": feedback.id,
                },
                status=status.HTTP_201_CREATED,
            )
        else:
            print("Serializer validation failed:", serializer.errors)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        print("Exception in submit_feedback:", str(e))
        logger.exception("Error submitting feedback: %s", str(e))
        return Response(
            {"error": "An error occurred while submitting feedback"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_feedback_list(request):
    """
    Get all feedback for admin dashboard
    """
    try:
        # Check if user is admin
        if (
            not hasattr(request, "user")
            or not request.user.is_authenticated
            or not request.user.is_admin
        ):
            return Response(
                {"error": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get all feedback with user information
        feedback_list = UserFeedback.objects.select_related("user").order_by(
            "-created"
        )

        feedback_data = []
        for feedback in feedback_list:
            feedback_data.append(
                {
                    "id": feedback.id,
                    "user_email": (
                        feedback.user.email if feedback.user else "Anonymous"
                    ),
                    "user_name": (
                        feedback.user.username
                        if feedback.user
                        else "Anonymous"
                    ),
                    "emoji_rating": feedback.emoji_rating,
                    "comment": feedback.comment,
                    "ip_address": feedback.ip_address,
                    "created": feedback.created.strftime("%Y-%m-%d %H:%M:%S"),
                    "modified": feedback.modified.strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                }
            )

        return Response(
            {"data": feedback_data, "count": len(feedback_data)},
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.exception("Error fetching feedback list: %s", str(e))
        return Response(
            {"error": "An error occurred while fetching feedback"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([AllowAny])
@credit_check_decorator
async def query_with_pdf(request):
    def log_debug(msg):
        # Question generator debug file logging intentionally disabled.
        return

    try:
        blocked = _organization_feature_block_response(request, "question_whiz")
        if blocked:
            return blocked
        temp_file_path = None
        log_debug("ENTRY: query_with_pdf")
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded."}, status=400)

        is_hw = "hw-to-questions" in request.path
        doc_mode = request.data.get("doc_mode", "normal") # 'normal' or 'handwritten'
        
        log_debug(f"File: {file.name}, HW Mode: {is_hw}, Doc Mode: {doc_mode}")
        content = ""

        if file.name.lower().endswith(".pdf"):
            service_type = "hw_pdf" if (is_hw or doc_mode == "handwritten") else "question_pdf"
            
            # If handwritten mode, we bypass standard extraction and use multimodal pipeline later
            if is_hw or doc_mode == "handwritten":
                log_debug("Handwritten PDF mode selected. Passing to multimodal pipeline.")
                content = "HANDWRITTEN_MODE_TRIGGER" # Sentinel to trigger multimodal branch
            else:
                import PyPDF2
                pdf_reader = PyPDF2.PdfReader(file)
                content = " ".join([page.extract_text() for page in pdf_reader.pages if page.extract_text()])
                
                # OCR Fallback: If no text was extracted, switch to handwritten mode automatically
                if not content or len(content.strip()) < 20: 
                    log_debug("No text extracted from PDF. Falling back to Scanned/Handwritten mode.")
                    content = "HANDWRITTEN_MODE_TRIGGER"
                    service_type = "hw_pdf_fallback"
        elif file and file.name.lower().endswith(".docx"):
            service_type = "question_docx"
            from docx import Document
            doc = Document(file)
            content = "\n".join([para.text for para in doc.paragraphs])
            
            # OCR Fallback for DOCX
            if not content or len(content.strip()) < 20: 
                log_debug("No text extracted from DOCX. Falling back to Scanned/Handwritten mode.")
                content = "HANDWRITTEN_MODE_TRIGGER"
                service_type = "hw_docx_fallback"
        elif file and file.name.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm', '.mp3', '.wav', '.m4a')):
            service_type = "question_media"
            try:
                # Save uploaded file to a temporary file
                ext = os.path.splitext(file.name)[1]
                if not ext:
                    ext = mimetypes.guess_extension(file.content_type) or ".mp4"
                
                fd, temp_file_path = tempfile.mkstemp(suffix=ext)
                with os.fdopen(fd, 'wb') as temp_file:
                    for chunk in file.chunks():
                        temp_file.write(chunk)
                
                # Initialize Centralized LLM for Transcription
                
                # Generate transcription (Multimodal: Hearing + Seeing)
                try:
                    # Using 'gemini' model name which maps to GeminiLLM in config
                    response = await generate_with_file(
                        model_name="gemini",
                        file_path=temp_file_path,
                        prompt=(
                            "Listen carefully and provide a complete word-for-word transcription of all spoken content in this file. "
                            "If it is a video, also describe any important text, formulas, or diagrams shown on screen. "
                            "Output ONLY the text or description of the content. "
                            "Do not include any introductory text, apologies, or conversational filler. "
                            "CRITICAL: If you are unable to process the file for any reason, "
                            "your response MUST start with the word 'ERROR:' followed by the reason."
                        ),
                        temperature=0.7,
                        max_tokens=2000
                    )
                    
                    if hasattr(response, 'error') and response.error:
                        # Check for specific error messages to maintain current error handling
                        error_str = str(response.error).lower()
                        if "429" in error_str or "quota" in error_str or "resource_exhausted" in error_str:
                             raise Exception("Gemini API Rate Limit Exceeded. You are on the Free Tier and have hit the usage limit. Please wait a minute or try again later.")
                        if "400" in error_str or "token" in error_str or "context" in error_str:
                             raise Exception("Video too long! The AI token limit was exceeded. Please try a shorter video (under 50 mins).")
                        raise Exception(f"Transcription failed: {response.error}")

                    content = response.response
                    if hasattr(response, 'cost'):
                    
                        # Validate transcription content - detect AI error/apology messages
                        if content:
                            content_lower = content.lower().strip()
                            error_indicators = [
                                "i apologize", "i'm sorry", "i am sorry",
                                "unable to transcribe", "cannot transcribe",
                                "unable to process", "cannot process",
                                "no audio", "no speech", "no content",
                                "error occurred", "error code",
                                "i cannot access", "unable to access",
                                "i'm unable to", "i am unable to",
                                "error:", "the provided file", "could not find",
                                "cannot fulfill", "unable to help",
                            ]
                            is_error_response = any(indicator in content_lower[:400] for indicator in error_indicators) or content_lower.startswith("error:")
                            
                            if is_error_response or len(content.strip()) < 100:
                                
                                # Specific guidance for API key errors which might be hallucinations or environmental issues
                                if "api key" in content_lower:
                                    error_msg = (
                                        "The AI encountered an API Key issue during transcription. "
                                        "I have attempted to fix your .env configuration. Please restart your server and try again. "
                                        "If it persists, verify your GEMINI_API_KEY is active in the Google Cloud Console."
                                    )
                                else:
                                    error_msg = content if content_lower.startswith("error:") else "The AI could not extract enough meaningful content from this video/audio file."
                                
                                raise Exception(
                                    f"{error_msg} (Reason: 1) File has no audio, 2) Audio is too quiet/unclear, 3) Unsupported format)."
                                )

                except Exception as e:
                    # Catch and re-raise to be handled by outer except
                    raise e
                
            except Exception as e:
                import traceback
                traceback.print_exc()
                raise e
            finally:
                # Cleanup local temp file
                if temp_file_path and os.path.exists(temp_file_path):
                    try:
                        # On Windows, we might need a small delay
                        await asyncio.sleep(0.5)
                        os.remove(temp_file_path)
                    except Exception as cleanup_err:
                        logger.warning("Could not remove temp file: %s", cleanup_err)

        # Handle Handwritten/Scanned Document using Multimodal Pipeline
        if content == "HANDWRITTEN_MODE_TRIGGER":
            try:
                # 1. Save to temp file
                ext = os.path.splitext(file.name)[1]
                with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                    for chunk in file.chunks():
                        tmp.write(chunk)
                    temp_file_path = tmp.name
                
                # 2. Extract parameters
                def get_p(key, default):
                    val = request.data.get(key, default)
                    return val[0] if isinstance(val, list) and len(val) > 0 else val

                question_type = get_p("questionType", get_p("question_type", "MCQ"))
                num_questions = get_p("num_questions", get_p("numQuestionsValue", "5"))
                difficulty = get_p("difficulty", get_p("levelValue", "Medium"))
                blooms = get_p("bloom_level", get_p("bloomValue", "Understanding"))
                option_type = get_p("option_type", get_p("optionTypeValue", "A, B"))
                provide_answer = get_p("provide_answer", get_p("provideAnswerValue", "Yes"))
                explanation = get_p("explanation", get_p("explanationValue", "Not required"))
                result_format = get_p("output_format", get_p("formatValue", "JSON"))
                num_options = get_p("num_options", get_p("numberOfOptionsValue", "4"))

                # 3. Specific Academic Prompt for Handwriting/Homework
                include_explanations = str(explanation).lower() not in ["false", "no", "not required", "none"]
                
                # Dynamic JSON Template (Match image pipeline)
                fields = ['"number": 1', '"question": "Question text"']
                if question_type == "MCQ":
                    fields.append(f'"options": ["Option labeling {option_type}"]')
                if provide_answer == "Yes":
                    fields.append('"answer": "Correct answer"')
                if include_explanations:
                    fields.append('"explanation": "Explanation text"')
                
                item_format = ",\n      ".join(fields)
                json_template = f"""{{
  "classification": "{question_type}",
  "questions": [
    {{
      {item_format}
    }}
  ]
}}"""

                academic_prompt = f"""You are a STRICT academic question generator.
Your task is to generate questions ONLY according to the user-specified constraints from the uploaded content.

========================
CONTENT ANALYSIS
========================
Analyze the uploaded document. It looks like a scanned file or handwritten notes.
Carefully extract and analyze all educational concepts. This may include handwriting, diagrams, formulas, or tables.

========================
QUESTION FORMAT
========================
Type: {question_type}
Number: {num_questions}
Bloom's Level: {blooms}
Difficulty: {difficulty}
Learning Objective: {get_p("learning_obj", "Not specified")}

========================
STRUCTURE RULES
========================
If Type is MCQ: 
- Number of options: {num_options}
- LABEL format: {option_type}
- The options array MUST include the labels exactly as specified.

========================
OUTPUT FORMAT
========================
Format: {result_format}
JSON Schema:
{json_template}

========================
STRICT RULES (MANDATORY)
========================
- Output ONLY valid JSON.
- Generate EXACTLY {num_questions} questions.
"""

                # 4. Generate with Gemini Multimodal
                response = await generate_with_file(
                    model_name="gemini",
                    file_path=temp_file_path,
                    prompt=academic_prompt,
                    temperature=0.2,
                    max_tokens=4000
                )

                if hasattr(response, 'error') and response.error:
                    raise Exception(f"AI Processing failed: {response.error}")

                final_questions = process_json_response(response.response, result_format)
                
                # Save and return
                cost = getattr(response, 'cost', 0)
                await save_question_async(request, request.data, final_questions, cost)

                final_output = {
                    "service_type": service_type,
                    "cost": float(cost),
                    "file_type": ext
                }
                
                if isinstance(final_questions, dict):
                    final_output.update(final_questions)
                else:
                    final_output["questions"] = final_questions

                return Response(final_output)

            except Exception as e:
                logger.error(f"Handwritten processing failed: {str(e)}")
                return Response({"error": f"Failed to process handwritten/scanned document: {str(e)}"}, status=500)
            finally:
                if temp_file_path and os.path.exists(temp_file_path):
                    os.remove(temp_file_path)

        # Image processing
        elif file.name.lower().endswith(('.jpg', '.jpeg', '.png')):
            service_type = "question_image"

            from PIL import Image
            import io
            # Keep image flow consistent with centralized Gemini config.
            api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get(
                "GOOGLE_API_KEY"
            )
            if not api_key:
                log_debug("GEMINI_API_KEY/GOOGLE_API_KEY missing")
                return Response(
                    {
                        "error": "Gemini API key not found. Set GEMINI_API_KEY (or GOOGLE_API_KEY)."
                    },
                    status=500,
                )

            api_key = api_key.strip()
            model_name = "models/gemini-2.0-flash"
            gemini_client = genai.Client(api_key=api_key)
            log_debug(f"Initialized Gemini Model: {model_name}")

            # Read file content safely
            if hasattr(file, 'seek'):
                file.seek(0)
            file_content = file.read()
            log_debug(f"Image read. Size: {len(file_content)} bytes")

            # Verify and RESIZE image using PIL
            try:
                image = Image.open(io.BytesIO(file_content))

                # Store original format BEFORE any processing
                original_format = image.format if image.format else "JPEG"

                # Check format strictly
                if image.format not in ['JPEG', 'PNG']:
                    log_debug(f"Invalid image format: {image.format}")
                    return Response({"error": f"Unsupported image format: {image.format}. Only JPEG and PNG are allowed."}, status=400)

                # Convert to RGB if necessary (e.g. for RGBA PNGs)
                if image.mode in ("RGBA", "P"):
                    image = image.convert("RGB")

                # Resize if larger than 768px to reduce token weight
                MAX_SIZE = 768
                if max(image.size) > MAX_SIZE:
                    log_debug(f"Resizing image from {image.size}...")
                    image.thumbnail((MAX_SIZE, MAX_SIZE), Image.Resampling.LANCZOS)
                    log_debug(f"Resized to {image.size}")

                    # Update file_content with resized image
                    buffer = io.BytesIO()
                    image.save(buffer, format="JPEG", quality=85)
                    file_content = buffer.getvalue()

                log_debug(f"Image processed. Format: {original_format}, Size: {image.size}, Bytes: {len(file_content)}")
            except Exception as img_err:
                log_debug(f"Image processing failed: {img_err}")
                return Response({"error": "Invalid or corrupted image file."}, status=400)

            # Helper to safely extract single value from request data
            def get_param(key, default):
                val = request.data.get(key, default)
                if isinstance(val, list) and len(val) > 0:
                    return val[0]
                return val

            # Extract parameters
            question_type = get_param("questionType", get_param("question_type", "MCQ"))
            num_questions = get_param("num_questions", get_param("numQuestionsValue", "5"))
            difficulty_level = get_param("difficulty", get_param("levelValue", "Medium"))
            blooms_level = get_param("bloom_level", get_param("bloomValue", "Understanding"))
            learning_objective = get_param("learning_obj", get_param("learningObj", "Not specified"))

            num_options = get_param("num_options", get_param("numberOfOptionsValue", "4"))
            option_type = get_param("option_type", get_param("optionTypeValue", "A,B"))
            blank_representation = get_param("num_missing_words", get_param("representingWordsValue", "_______"))

            provide_answer = get_param("provide_answer", get_param("provideAnswerValue", "Yes"))

            # Handle explanation toggle
            exp_raw = get_param("explanation", get_param("explanationValue", "Not required"))
            explanation_requirement = str(exp_raw)
            include_explanations = explanation_requirement.lower() not in ["false", "no", "not required", "none"]

            result_format = get_param("output_format", get_param("formatValue", "JSON"))

            # Optimized Single-Stage Pipeline
            try:
                log_debug(f"Calling Gemini with STRICT Academic Prompt...")

                # Dynamic JSON Template
                fields = ['"number": 1', '"question": "Question text"']

                if question_type == "MCQ":
                    fields.append(f'"options": ["Option labeling {option_type}"]')

                if provide_answer == "Yes":
                    fields.append('"answer": "Correct answer"')

                if include_explanations:
                    fields.append('"explanation": "Explanation text"')

                item_format = ",\n      ".join(fields)

                json_template = f"""{{
  "classification": "[Type]",
  "questions": [
    {{
      {item_format}
    }}
  ]
}}"""

                combined_prompt = f"""You are a STRICT academic question generator.

Your task is to generate questions ONLY according to the user-specified constraints.
You must NOT assume defaults.
You must NOT change the question format.
You must NOT generate MCQs unless explicitly asked.
If a condition is "Not specified", do not infer or add it.

Failure to follow any rule is considered an incorrect response.
Generate questions from the uploaded image content using the following user specifications.

========================
IMAGE CONTENT ANALYSIS
========================

IMPORTANT: You must generate educational questions from ANY type of image uploaded:

1. **Text-based images** (textbooks, notes): Extract and analyze text.
2. **Diagram-based images** (flowcharts, graphs): Analyze visual elements.
3. **Mixed content**: Analyze both.
4. **Visual/Photographic**: Generate creative educational questions about context/purpose.

========================
QUESTION FORMAT
========================

Type of Question: {question_type}
Number of Questions: {num_questions}
Bloom's Taxonomy Level: {blooms_level}
Difficulty Level: {difficulty_level}
Learning Objective: {learning_objective}

========================
QUESTION STRUCTURE RULES
========================

If Type of Question is MCQ:
- Number of options: {num_options}
- **CRITICAL: Option labeling format**: {option_type}
- The options array MUST include the labels exactly as specified in the '{option_type}' format (e.g., if option_type is '1, 2', options must start with '1.', '2.', '3.', '4.').
- Do not output plain text options; always include the label prefixes.
- Only one correct answer.

If Type of Question is Fill in the Blanks:
- Represent missing words using: {blank_representation}

If Type of Question is True/False:
- Provide ONLY statements.

========================
ANSWER FORMAT RULES
========================

Provide Answer: {provide_answer}
Explanation Requirement: {explanation_requirement}

========================
OUTPUT FORMAT
========================

Result Format: {result_format}
JSON Schema:
{json_template}

========================
STRICT RULES (MANDATORY)
========================

- Generate EXACTLY {num_questions} questions.
- Follow ONLY the selected question type ({question_type}).
- Output ONLY the final valid JSON.
"""

                mime = f"image/{original_format.lower()}"
                if mime == "image/jpg":
                    mime = "image/jpeg"
                image_blob = genai_types.Blob(data=file_content, mime_type=mime)
                image_part = genai_types.Part(inline_data=image_blob)
                text_part = genai_types.Part.from_text(text=combined_prompt)
                combined_response = await gemini_client.aio.models.generate_content(
                    model=model_name,
                    contents=[
                        genai_types.Content(parts=[text_part, image_part]),
                    ],
                    config=genai_types.GenerateContentConfig(
                        response_mime_type="application/json",
                    ),
                )
                raw_text = combined_response.text.strip()
                log_debug("Gemini combined response received.")

                # Centralized Logging for Image Usage
                p_tokens = 0
                c_tokens = 0
                billed = await compute_billed_cost_async(model_name, 0, 0)
                try:
                    usage = combined_response.usage_metadata
                    p_tokens = getattr(usage, "prompt_token_count", 0)
                    c_tokens = getattr(usage, "candidates_token_count", 0)
                    t_tokens = getattr(usage, "total_token_count", p_tokens + c_tokens)

                    billed = await compute_billed_cost_async(model_name, p_tokens, c_tokens)

                    logger.info(
                        f"[TOKEN USAGE] Tab: question_image | Cost: ${float(billed):.6f}"
                    )
                    log_debug(
                        f"Usage logged centrally: {t_tokens} tokens, ${float(billed):.6f}"
                    )
                except Exception as log_err:
                    log_debug(f"Logging failed: {log_err}")

                # Attempt to parse JSON correctly
                try:
                    final_output = process_json_response(raw_text, result_format)

                    if "error" in final_output and not final_output.get("questions"):
                        log_debug(f"JSON Parsing failed or returned error: {final_output.get('error')}")
                        return Response(final_output, status=400)

                    usage_payload = {
                        "service_type": service_type,
                        "cost": float(billed),
                        "model": model_name,
                        "model_key": normalize_model_key(model_name),
                        "prompt_tokens": p_tokens,
                        "completion_tokens": c_tokens,
                        "input_length": p_tokens + c_tokens,
                    }
                    if isinstance(final_output, dict):
                        final_output = {**final_output, **usage_payload}
                    else:
                        final_output = {"questions": final_output, **usage_payload}
                    return Response(final_output, status=200)

                except Exception as json_err:
                    log_debug(f"JSON Parsing failed: {json_err}")
                    return Response({
                        "raw_output": raw_text,
                        "error": "Failed to format as structured JSON, returning raw text."
                    }, status=200)

            except Exception as gen_err:
                log_debug(f"Combined Gemini call failed: {gen_err}")
                if "429" in str(gen_err) or "ResourceExhausted" in str(gen_err):
                    return Response({"error": "Gemini API rate limit exceeded. Please wait 60 seconds and try again."}, status=429)
                return Response({"error": "Failed to generate questions from image."}, status=500)

        # Explicit validation for unsupported types before falling through
        elif not file.name.lower().endswith(('.pdf', '.docx', '.mp4', '.avi', '.mov', '.mkv', '.webm', '.mp3', '.wav', '.m4a')):
            return Response({"error": "Unsupported file type. Only PDF, DOCX, Video, and Image (JPG, PNG) files are supported."}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

    # Use centralized LLM config (model defined in llm_config.json)
    model_dict = {
        "temperature": 0,
        "max_tokens": 2000,
    }
    # Helper to safely extract parameters with fallbacks
    def get_val(keys, default=""):
        if isinstance(keys, str):
            keys = [keys]
        for key in keys:
            val = request.data.get(key)
            if val is not None and val != "":
                return val
        return default

    question_request = {
        "text": content,
        "subject": get_val(["subject", "subjectValue"]),
        "qp_pat": get_val(["qp_pat", "questionType"]),
        "topics": get_val(["topics", "topicValue"]),
        "filename": get_val(["filename", "fileName"]),
        "questionType": get_val(["questionType", "qp_pat"], "Short-answer Questions"),
        "numQuestionsValue": get_val(["num_questions", "numQuestionsValue"], "5"),
        "bloomValue": get_val(["bloom_level", "bloomValue"]),
        "levelValue": get_val(["difficulty", "levelValue"]),
        "learningObj": get_val(["learning_obj", "learningObj"]),
        "numberOfOptionsValue": get_val(["num_options", "numberOfOptionsValue"]),
        "optionTypeValue": get_val(["option_type", "optionTypeValue"]),
        "numberOfMissingWordsValue": get_val(["num_missing_words", "numberOfMissingWordsValue"]),
        "representingWordsValue": get_val(["missing_word_style", "representingWordsValue"]),
        "numberOfItemsValue": get_val(["num_items", "numberOfItemsValue"]),
        "provideAnswerValue": get_val(["provide_answer", "provideAnswerValue"], "Yes"),
        "explanationValue": get_val(["explanation", "explanationValue"]),
        "formatValue": get_val(["output_format", "formatValue"], "JSON"),
    }
    
    
    # Validate content before proceeding to question generation
    if not content or len(content.strip()) < 50:
        return Response({
            "error": "Could not extract enough content from the uploaded file to generate questions. "
                     "Please ensure the file contains readable text (for PDFs/DOCX) or clear audio/video content."
        }, status=400)
    
    try:
        pr = await start_point("enter_text", model_dict, question_request)

        logger.info(
            f"[TOKEN USAGE] Tab: {service_type} | Cost: ${float(pr.billed_cost):.6f}"
        )

        formatted_questions = process_json_response(
            pr.content, request.data.get("output_format", "JSON")
        )
        return Response(
            {
                "questions": formatted_questions,
                "service_type": service_type,
                "format": request.data.get("output_format", "JSON"),
                "format": request.data.get("output_format", "JSON"),
                **_usage_from_pipeline(pr, len(content)),
            }
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


async def save_question_async(request, question_request, questions, cost):
    """
    Asynchronous function to save generated questions in the database.
    """
    user = None
    if hasattr(request, "user") and request.user.is_authenticated:
        user = request.user
    
    # Save to DB via sync_to_async
    return await sync_to_async(GeneratedQuestion.objects.create)(
        user=user,
        question_type=question_request.get("qp_pat", ""),
        num_questions=question_request.get("numQuestionsValue", ""),
        bloom=question_request.get("bloomValue", ""),
        level=question_request.get("levelValue", ""),
        num_options=question_request.get("numberOfOptionsValue", ""),
        option_type=question_request.get("optionTypeValue", ""),
        num_missing_words=question_request.get("num_missing_words", question_request.get("numberOfMissingWordsValue", "")),
        representing_words=question_request.get("missing_word_style", question_request.get("representingWordsValue", "")),
        num_items=question_request.get("num_items", question_request.get("numberOfItemsValue", "")),
        learning_obj=question_request.get("learning_obj", question_request.get("learningObj", "")),
        provide_answer=question_request.get("provide_answer", question_request.get("provideAnswerValue", "")),
        explanation=question_request.get("explanation", question_request.get("explanationValue", "")),
        format_value=question_request.get("output_format", question_request.get("formatValue", "")),
        response=str(questions),
        cost=str(cost)
    )


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
async def audio_to_questions(request):
    """
    Standalone endpoint for audio-to-text (Gemini) and question generation (GPT).
    """
    try:
        blocked = _organization_feature_block_response(request, "question_whiz")
        if blocked:
            return blocked
        temp_file_path = None
        transcribe_llm_response = None
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded."}, status=400)

        # 1. Save locally to a temporary file
        file_extension = os.path.splitext(file.name)[1]
        if not file_extension:
            file_extension = ".mp3" # Fallback
            
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            for chunk in file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name

        try:
            # 2. Use Centralized LLM for Transcription
            
            # Generate transcription (Multimodal: Hearing + Seeing)
            try:
                # Using 'gemini' model name which maps to GeminiLLM in config
                response = await generate_with_file(
                    model_name="gemini",
                    file_path=temp_file_path,
                    prompt=(
                        "Listen carefully and provide a complete word-for-word transcription of all spoken content in this audio recording. "
                        "Output ONLY the transcription of the content. "
                        "Do not include any introductory text, apologies, or conversational filler. "
                        "CRITICAL: If you are unable to process the file for any reason, "
                        "your response MUST start with the word 'ERROR:' followed by the reason."
                    ),
                    temperature=0.7,
                    max_tokens=2000
                )
                
                if hasattr(response, 'error') and response.error:
                    # Check for specific error messages to maintain current error handling
                    error_str = str(response.error).lower()
                    if "429" in error_str or "quota" in error_str or "resource_exhausted" in error_str:
                         raise Exception("Gemini API Rate Limit Exceeded. You are on the Free Tier and have hit the usage limit. Please wait a minute or try again later.")
                    if "400" in error_str or "token" in error_str or "context" in error_str:
                         raise Exception("Audio too long! The AI token limit was exceeded. Please try a shorter audio (under 50 mins).")
                    raise Exception(f"Transcription failed: {response.error}")

                transcription = response.response
                transcribe_llm_response = response
                # Validate transcription content - detect AI error/apology messages
                if transcription:
                    content_lower = transcription.lower().strip()
                    error_indicators = [
                        "i apologize", "i'm sorry", "i am sorry",
                        "unable to transcribe", "cannot transcribe",
                        "unable to process", "cannot process",
                        "no audio", "no speech", "no content",
                        "error occurred", "error code",
                        "i cannot access", "unable to access",
                        "i'm unable to", "i am unable to",
                        "error:", "the provided file", "could not find",
                        "cannot fulfill", "unable to help",
                    ]
                    is_error_response = any(indicator in content_lower[:400] for indicator in error_indicators) or content_lower.startswith("error:")
                    
                    if is_error_response or len(transcription.strip()) < 100:
                        
                        # Specific guidance for API key errors which might be hallucinations
                        if "api key" in content_lower:
                             error_msg = (
                                "The AI encountered an API Key issue during transcription. "
                                "I have attempted to fix your .env configuration. Please restart your server and try again. "
                                "If it persists, verify your GEMINI_API_KEY is active in the Google Cloud Console."
                            )
                        else:
                            error_msg = transcription if content_lower.startswith("error:") else "The AI could not extract enough meaningful content from this audio file."
                            
                        raise Exception(
                            f"{error_msg} (Reason: 1) File has no audio, 2) Audio is too quiet/unclear, 3) Unsupported format)."
                        )

            except Exception as e:
                # Catch and re-raise to be handled by outer except
                raise e
            
        finally:
            # Cleanup local file
            if os.path.exists(temp_file_path):
                # Small delay to ensure handle is released
                await asyncio.sleep(0.5)
                try:
                    os.remove(temp_file_path)
                except Exception as cleanup_err:
                    logger.warning("Could not remove temp file: %s", cleanup_err)

        # 4. Generate Questions via GPT
        # Use centralized LLM config (model defined in llm_config.json)
        model_dict = {
            "temperature": 0,
            "max_tokens": 2000,
        }
        
        # Build question request
        question_request = {
            "text": transcription,
            "subject": request.data.get("subject", "General"),
            "questionType": request.data.get("qp_pat", "MCQ"),
            "learningObj": request.data.get("learning_obj", ""),
            "qp_pat": request.data.get("qp_pat", "MCQ"),
            "topics": request.data.get("topics", "General"),
            "numQuestionsValue": request.data.get("num_questions", "5"),
            "bloomValue": request.data.get("bloom_level", "Not Specified"),
            "levelValue": request.data.get("difficulty", "Medium"),
            "provideAnswerValue": request.data.get("provide_answer", "Yes"),
            "explanationValue": request.data.get("explanation", "Not required"),
            "formatValue": request.data.get("output_format", "JSON"),
        }
        
        # Handle conditional parameters
        if question_request["qp_pat"] == "MCQ":
            question_request["numberOfOptionsValue"] = request.data.get("num_options", "4")
            question_request["optionTypeValue"] = request.data.get("option_type", "A, B,")
        elif question_request["qp_pat"] == "Fill in the blanks":
            question_request["numberOfMissingWordsValue"] = request.data.get("num_missing_words", "1")
            question_request["representingWordsValue"] = request.data.get("missing_word_style", "underscore")
        elif question_request["qp_pat"] == "Match the following":
            question_request["numberOfItemsValue"] = request.data.get("num_items", "4")

        # Validate transcription before proceeding to question generation
        if not transcription or len(transcription.strip()) < 50:
            return Response({
                "error": "Could not extract enough content from the audio file to generate questions. "
                         "Please ensure the audio has clear speech content."
            }, status=400)

        pr = await start_point("enter_text", model_dict, question_request)

        logger.info(
            f"[TOKEN USAGE] Tab: audio_standalone | Cost: ${float(pr.billed_cost):.6f}"
        )

        formatted_questions = process_json_response(
            pr.content, request.data.get("formatValue", "JSON")
        )

        # 5. Save to Database
        await save_question_async(request, request.data, pr.content, str(pr.billed_cost))

        t_pt = t_ct = 0
        t_model = ""
        t_billed = await compute_billed_cost_async("", 0, 0)
        if transcribe_llm_response is not None and not getattr(
            transcribe_llm_response, "error", None
        ):
            t_model = getattr(transcribe_llm_response, "model", "") or ""
            t_pt = int(transcribe_llm_response.prompt_tokens or 0)
            t_ct = int(transcribe_llm_response.completion_tokens or 0)
            t_billed = await compute_billed_cost_async(t_model, t_pt, t_ct)

        combined_cost = float(t_billed + pr.billed_cost)
        usage = {
            "cost": combined_cost,
            "model": f"transcription+{pr.model_key}",
            "model_key": normalize_model_key(pr.model_key),
            "prompt_tokens": t_pt + pr.prompt_tokens,
            "completion_tokens": t_ct + pr.completion_tokens,
            "input_length": len(transcription or ""),
            "transcription_prompt_tokens": t_pt,
            "transcription_completion_tokens": t_ct,
            "question_prompt_tokens": pr.prompt_tokens,
            "question_completion_tokens": pr.completion_tokens,
        }

        return Response(
            {
                "questions": formatted_questions,
                "transcription": transcription,
                "format": "JSON",
                **usage,
            }
        )

    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)

