import os
import pytest
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@pytest.fixture(scope="session")
def openai_api_key():
    """Ensure OpenAI API key is available for DeepEval."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        pytest.skip("OPENAI_API_KEY not found in environment.")
    return api_key

@pytest.fixture(scope="session")
def gemini_api_key():
    """Ensure Gemini API key is available for generation."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        pytest.skip("GEMINI_API_KEY not found in environment.")
    return api_key

@pytest.fixture
def sample_educational_text():
    return """
    Photosynthesis is the process used by plants, algae and certain bacteria 
    to harness energy from sunlight and turn it into chemical energy. 
    It takes in carbon dioxide and water, and outputs oxygen and glucose.
    The process occurs primarily in the chloroplasts of plant cells, 
    which contain the green pigment chlorophyll.
    """

@pytest.fixture
def build_sample_prompt():
    def _build(text, num_questions=3, q_type="MCQ", provide_answer="Yes"):
        from main import build_question_prompt
        return build_question_prompt(
            text=text,
            subject="Biology",
            qp_pat=q_type,
            topics="Photosynthesis",
            num_questions=num_questions,
            bloom_level="Understanding",
            difficulty="Medium",
            provide_answer=provide_answer,
            explanation="Detailed",
            num_options=4,
            option_type="alphabetical"
        )
    return _build
