import pytest
import json
from deepeval import assert_test
from deepeval.test_case import LLMTestCase, SingleTurnParams
from deepeval.metrics import GEval
from llm_client import GeminiGradingClient
from main import repair_json_string

@pytest.mark.deepeval
def test_mcq_correctness(openai_api_key, gemini_api_key, sample_educational_text, build_sample_prompt):
    """Test that generated MCQs are factually correct based on the source text."""
    # 1. Setup Client
    client = GeminiGradingClient(api_key=gemini_api_key, model_name="gemini-2.0-flash")
    
    # 2. Build Prompt
    prompt = build_sample_prompt(sample_educational_text, num_questions=2, q_type="MCQ")
    
    # 3. Generate Content
    response = client.generate_text(contents=[prompt])
    assert not response.error, f"Generation failed: {response.error}"
    
    # 4. Parse Output
    try:
        clean_json = repair_json_string(response.response)
        parsed = json.loads(clean_json)
        questions = parsed.get("questions", [])
    except Exception as e:
        pytest.fail(f"Failed to parse LLM output: {e}\nOutput was: {response.response}")

    assert len(questions) > 0, "No questions were generated"
    
    # 5. Evaluate with DeepEval
    correctness_metric = GEval(
        name="Correctness",
        criteria="Determine if the 'actual output' (generated question and its correct answer) is factually correct based strictly on the 'expected output' (source text). It should not contain any information outside the source text.",
        evaluation_params=[SingleTurnParams.ACTUAL_OUTPUT, SingleTurnParams.EXPECTED_OUTPUT],
        threshold=0.7
    )
    
    # Test the first generated question
    q = questions[0]
    actual_output = f"Question: {q.get('question')}\nAnswer: {q.get('answer')}"
    
    test_case = LLMTestCase(
        input="Generate an MCQ question about photosynthesis.",
        actual_output=actual_output,
        expected_output=sample_educational_text
    )
    
    assert_test(test_case, [correctness_metric])

@pytest.mark.deepeval
def test_completeness_of_generation(openai_api_key, gemini_api_key, sample_educational_text, build_sample_prompt):
    """Test that the requested number of questions is actually generated."""
    client = GeminiGradingClient(api_key=gemini_api_key, model_name="gemini-2.0-flash")
    
    num_q = 3
    prompt = build_sample_prompt(sample_educational_text, num_questions=num_q, q_type="True/False")
    
    response = client.generate_text(contents=[prompt])
    
    completeness_metric = GEval(
        name="Completeness",
        criteria=f"Determine if the actual output contains exactly {num_q} distinct questions.",
        evaluation_params=[SingleTurnParams.ACTUAL_OUTPUT],
        threshold=0.9
    )
    
    test_case = LLMTestCase(
        input=f"Generate {num_q} True/False questions.",
        actual_output=response.response
    )
    
    assert_test(test_case, [completeness_metric])
