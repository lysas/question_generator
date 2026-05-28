import pytest
import json
from deepeval import assert_test
from deepeval.test_case import LLMTestCase, SingleTurnParams
from deepeval.metrics import AnswerRelevancyMetric, GEval
from llm_client import GeminiGradingClient
from main import repair_json_string

@pytest.mark.deepeval
def test_questions_relevant_to_source(openai_api_key, gemini_api_key, sample_educational_text, build_sample_prompt):
    """Test that generated questions are relevant to the input source text."""
    client = GeminiGradingClient(api_key=gemini_api_key, model_name="gemini-2.0-flash")
    prompt = build_sample_prompt(sample_educational_text, num_questions=2, q_type="Fill in the blanks")
    
    response = client.generate_text(contents=[prompt])
    
    # Use Answer Relevancy Metric to ensure output matches input context
    relevancy_metric = AnswerRelevancyMetric(threshold=0.7)
    
    test_case = LLMTestCase(
        input=prompt,
        actual_output=response.response,
        retrieval_context=[sample_educational_text]
    )
    
    assert_test(test_case, [relevancy_metric])

@pytest.mark.deepeval
def test_questions_match_bloom_level(openai_api_key, gemini_api_key, sample_educational_text):
    """Test that generated questions align with requested Bloom's level."""
    client = GeminiGradingClient(api_key=gemini_api_key, model_name="gemini-2.0-flash")
    
    from main import build_question_prompt
    prompt = build_question_prompt(
        text=sample_educational_text,
        subject="Biology",
        qp_pat="MCQ",
        topics="Photosynthesis",
        num_questions=1,
        bloom_level="Evaluating", # High level bloom
        difficulty="Hard",
        provide_answer="Yes",
        explanation="Not required"
    )
    
    response = client.generate_text(contents=[prompt])
    
    bloom_metric = GEval(
        name="Bloom Level Match",
        criteria="Determine if the generated question tests high-level cognitive skills (Evaluating) rather than just simple factual recall. It should require judgment, critique, or assessment.",
        evaluation_params=[SingleTurnParams.ACTUAL_OUTPUT],
        threshold=0.7
    )
    
    test_case = LLMTestCase(
        input="Generate an evaluating-level question.",
        actual_output=response.response
    )
    
    assert_test(test_case, [bloom_metric])
