import re
import json
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


def repair_json_string(json_str: str) -> str:
    boundary_chars = {',', ':', '}', ']'}
    result = []
    in_string = False
    i = 0
    n = len(json_str)
    
    while i < n:
        char = json_str[i]
        
        # Handle escaped characters
        if char == '\\' and i + 1 < n:
            result.append(char)
            result.append(json_str[i+1])
            i += 2
            continue
            
        if char == '"':
            # Check if this is a boundary quote or an internal quote
            # Look ahead for the next non-whitespace character
            next_non_ws = None
            j = i + 1
            while j < n:
                if json_str[j] not in ' \t\n\r':
                    next_non_ws = json_str[j]
                    break
                j += 1
                
            if in_string:
                # We are currently in a string.
                # If the next non-whitespace character is a boundary char, this is the end of the string.
                if next_non_ws in boundary_chars:
                    in_string = False
                    result.append('"')
                else:
                    # Unescaped internal double quote! Escape it!
                    result.append('\\"')
            else:
                # We are not in a string. This double quote starts a new string.
                in_string = True
                result.append('"')
        elif char == '\n' and in_string:
            result.append('\\n')
        elif char == '\t' and in_string:
            result.append('\\t')
        else:
            result.append(char)
        i += 1
        
    repaired = "".join(result)
    
    # Strip trailing commas
    repaired = re.sub(r',\s*([\]}])', r'\1', repaired)
    
    return repaired


class QuestionGuardrails:
    """Guardrails for question generator - validates inputs and outputs"""
    
    # Inappropriate topics for educational content
    BLOCKED_TOPICS = [
        "violence", "weapon", "drug", "alcohol", "gambling",
        "explicit", "sexual", "hate", "discrimination", "illegal",
        "suicide", "self-harm", "terrorism", "abuse"
    ]
    
    # Maximum input lengths
    MAX_TEXT_LENGTH = 100000
    MAX_TOPIC_LENGTH = 500
    
    @staticmethod
    def validate_input(text: str, input_type: str = "text", skip_content_filter: bool = False) -> Dict[str, Any]:
        """
        Validate user input before sending to LLM
        
        Args:
            text: Input text to validate
            input_type: Type of input ("text", "topic", "transcription")
            skip_content_filter: If True, skip blocked topic checking (for transcriptions)
        """
        
        if not text or not text.strip():
            logger.warning("Empty input detected")
            return {"valid": False, "error": "Input cannot be empty"}
        
        max_length = QuestionGuardrails.MAX_TOPIC_LENGTH if input_type == "topic" else QuestionGuardrails.MAX_TEXT_LENGTH
        if len(text) > max_length:
            logger.warning(f"Input too long: {len(text)} characters")
            return {"valid": False, "error": f"Input too long (max {max_length} characters)"}
        
        # Skip content filtering for transcriptions (they may contain educational discussion of sensitive topics)
        if not skip_content_filter:
            text_lower = text.lower()
            for topic in QuestionGuardrails.BLOCKED_TOPICS:
                if topic in text_lower:
                    logger.warning(f"Blocked topic detected: {topic}")
                    return {
                        "valid": False, 
                        "error": "Cannot generate questions about inappropriate topics"
                    }
        
        # Check for excessive special characters (simple spam check)
        # Ratio of special chars to total length. Excluding whitespace.
        clean_text = ''.join(text.split())
        if not clean_text:
             return {"valid": False, "error": "Input contains only whitespace"}

        special_char_count = sum(1 for c in clean_text if not c.isalnum())
        special_char_ratio = special_char_count / len(clean_text)
        
        if special_char_ratio > 0.4 and len(clean_text) > 20: # Allow short inputs to have symbols (e.g. math)
            logger.warning(f"Too many special characters: {special_char_ratio:.2%}")
            return {"valid": False, "error": "Input contains too many special characters"}
        
        logger.info(f"Input validation passed for {input_type}")
        return {"valid": True}
    
    @staticmethod
    def validate_json_output(response: str) -> Dict[str, Any]:
        """Validate JSON output from LLM"""
        
        # Check for empty/None response
        if response is None:
            logger.error("Response is None - API returned no content")
            return {"valid": False, "error": "API returned empty response (None). This may indicate a safety block or server error. Please try again or adjust your input."}
        
        if not response or len(response.strip()) == 0:
            logger.error("Response is empty string")
            return {"valid": False, "error": "API returned empty response. This may indicate: 1) Content was blocked by safety filters, 2) Server error, or 3) Invalid input format. Please try with different content."}
        
        # Robust JSON extraction (searches for the first { or [ and last } or ])
        # This handles conversational text before or after the JSON
        json_match = re.search(r'([\{\[].*[\}\]])', response, re.DOTALL)
        if json_match:
            cleaned_response = json_match.group(1).strip()
        else:
            # Fallback for very simple responses that might not match the regex
            cleaned_response = response.strip()
            # Still try to remove markdown blocks if they are there but didn't match the regex
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            elif cleaned_response.startswith("```"):
                cleaned_response = cleaned_response[3:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
        
        cleaned_response = cleaned_response.strip()
        
        # Check again after cleaning
        if not cleaned_response or len(cleaned_response) < 5:
            logger.error(f"Response too short after cleaning: '{cleaned_response}'")
            return {"valid": False, "error": f"Response too short or invalid. API may have blocked content or response format is incorrect."}
        
        try:
            cleaned_response = repair_json_string(cleaned_response)
            data = json.loads(cleaned_response)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed: {e}")
            logger.error(f"Response was: {cleaned_response[:200]}")
            return {"valid": False, "error": f"Invalid JSON format: {str(e)}. Response was: {cleaned_response[:100]}..."}
        
        if isinstance(data, list):
            # If it's just a list, wrap it in the expected format
            data = {"questions": data}
        elif isinstance(data, dict):
            if "questions" not in data:
                # Check for common alternatives
                for alt_key in ["items", "results", "generated_questions"]:
                    if alt_key in data and isinstance(data[alt_key], list):
                        data["questions"] = data.pop(alt_key)
                        break
                
                # If no questions key found, but there's at least one list, maybe that's it?
                if "questions" not in data:
                    lists = [v for v in data.values() if isinstance(v, list)]
                    if len(lists) == 1:
                        data["questions"] = lists[0]
                
                # Final check
                if "questions" not in data:
                    logger.error("Missing 'questions' field and no common alternatives found")
                    logger.error(f"Data keys: {list(data.keys())}")
                    logger.error(f"Data preview: {str(data)[:300]}")
                    return {"valid": False, "error": f"Response missing 'questions' field. Keys found: {list(data.keys())}. Preview: {str(data)[:150]}"}
        else:
            logger.error(f"Unexpected data type after JSON conversion: {type(data)}")
            logger.error(f"Data value preview: {str(data)[:200]}")
            return {"valid": False, "error": f"Invalid JSON structure: expected object or list, got {type(data).__name__}. The AI returned: {str(data)[:100]}"}
        
        if not isinstance(data["questions"], list):
            logger.error("'questions' field is not a list")
            return {"valid": False, "error": "'questions' must be a list"}
        
        if len(data["questions"]) == 0:
            logger.error("No questions in response")
            return {"valid": False, "error": "No questions generated"}
        
        for i, q in enumerate(data["questions"]):
            if "question" not in q:
                logger.error(f"Question {i+1} missing 'question' field")
                return {"valid": False, "error": f"Question {i+1} missing 'question' field"}
            
            if "answer" not in q:
                logger.error(f"Question {i+1} missing 'answer' field")
                return {"valid": False, "error": f"Question {i+1} missing 'answer' field"}
            
            if not q["question"] or not q["question"].strip():
                logger.error(f"Question {i+1} is empty")
                return {"valid": False, "error": f"Question {i+1} is empty"}
        
        logger.info(f"Output validation passed: {len(data['questions'])} questions")
        return {"valid": True, "data": data}
    
    # File upload guardrails
    ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac']
    ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv']
    ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.docx', '.txt']
    
    # File size limits (in bytes)
    MAX_FILE_SIZE_FREE = 50 * 1024 * 1024  # 50 MB for free users
    MAX_FILE_SIZE_SUBSCRIBED = 500 * 1024 * 1024  # 500 MB for subscribed users
    
    # Duration limits (in seconds)
    MAX_DURATION_FREE = 3 * 60  # 3 minutes for free users
    MAX_DURATION_SUBSCRIBED = 50 * 60  # 50 minutes for subscribed users
    
    @staticmethod
    def validate_file_upload(file, is_subscribed: bool = False) -> Dict[str, Any]:
        """Validate uploaded audio/video/document files"""
        import os
        
        if not file:
            logger.warning("No file provided")
            return {"valid": False, "error": "No file uploaded"}
        
        # Get file extension
        file_name = file.name if hasattr(file, 'name') else str(file)
        file_ext = os.path.splitext(file_name)[1].lower()
        
        # Check file type
        allowed_extensions = (
            QuestionGuardrails.ALLOWED_AUDIO_EXTENSIONS + 
            QuestionGuardrails.ALLOWED_VIDEO_EXTENSIONS +
            QuestionGuardrails.ALLOWED_DOCUMENT_EXTENSIONS
        )
        
        if file_ext not in allowed_extensions:
            logger.warning(f"Invalid file type: {file_ext}")
            return {
                "valid": False, 
                "error": f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            }
        
        # Check file size
        file_size = file.size if hasattr(file, 'size') else 0
        max_size = QuestionGuardrails.MAX_FILE_SIZE_SUBSCRIBED if is_subscribed else QuestionGuardrails.MAX_FILE_SIZE_FREE
        
        if file_size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            logger.warning(f"File too large: {file_size} bytes (max: {max_size} bytes)")
            return {
                "valid": False,
                "error": f"File too large. Maximum size: {max_size_mb:.0f} MB"
            }
        
        # For audio/video files, we'll validate duration after upload
        # (duration check requires the file to be processed)
        
        logger.info(f"File upload validation passed: {file_name} ({file_size} bytes)")
        return {"valid": True, "file_type": file_ext}
    
    @staticmethod
    def validate_media_duration(duration_seconds: float, is_subscribed: bool = False) -> Dict[str, Any]:
        """Validate audio/video duration after processing"""
        
        max_duration = QuestionGuardrails.MAX_DURATION_SUBSCRIBED if is_subscribed else QuestionGuardrails.MAX_DURATION_FREE
        
        if duration_seconds > max_duration:
            max_minutes = max_duration / 60
            logger.warning(f"Media too long: {duration_seconds}s (max: {max_duration}s)")
            return {
                "valid": False,
                "error": f"Media too long. Maximum duration: {max_minutes:.0f} minutes"
            }
        
        logger.info(f"Media duration validation passed: {duration_seconds}s")
        return {"valid": True}
