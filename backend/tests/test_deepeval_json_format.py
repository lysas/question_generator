import pytest
import json
from deepeval import assert_test
from deepeval.test_case import LLMTestCase, SingleTurnParams
from deepeval.metrics import JsonCorrectnessMetric, GEval
from llm_client import GeminiGradingClient
from main import repair_json_string

@pytest.fixture
def mcq_schema():
    return {
        "type": "object",
        "properties": {
            "questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "options": {"type": "array", "items": {"type": "string"}},
                        "answer": {"type": "string"},
                        "explanation": {"type": "string"}
                    },
                    "required": ["question", "options", "answer", "explanation"]
                }
            }
        },
        "required": ["questions"]
    }

@pytest.mark.deepeval
def test_mcq_json_schema_compliance(openai_api_key, gemini_api_key, sample_educational_text, build_sample_prompt, mcq_schema):
    """Test that generated MCQ output strictly follows the required JSON schema."""
    client = GeminiGradingClient(api_key=gemini_api_key, model_name="gemini-2.0-flash")
    prompt = build_sample_prompt(sample_educational_text, num_questions=1, q_type="MCQ", provide_answer="Yes")
    
    response = client.generate_text(contents=[prompt])
    clean_json = repair_json_string(response.response)
    
    # We dump the expected schema as a string for the expected_output
    schema_str = json.dumps(mcq_schema)
    
    # DeepEval JsonCorrectnessMetric compares actual JSON against an expected schema
    # (assuming expected_output is a valid JSON schema string or pydantic model)
    # However, since JsonCorrectnessMetric might require pydantic in some deepeval versions,
    # we can also use GEval to verify schema compliance robustly.
    
    schema_metric = GEval(
        name="Schema Compliance",
        criteria="Determine if the actual output is valid JSON and contains a 'questions' array, where each item has 'question', 'options' (array), 'answer', and 'explanation'.",
        evaluation_params=[SingleTurnParams.ACTUAL_OUTPUT],
        threshold=1.0
    )
    
    test_case = LLMTestCase(
        input="Generate JSON matching the schema.",
        actual_output=clean_json
    )
    
    assert_test(test_case, [schema_metric])

def test_repair_json_handles_truncation():
    """Unit test for the repair_json_string utility without needing LLM."""
    truncated_json = '{"questions": [{"question": "Q1", "answer": "A1"}, {"question": "Q2", "ans'
    repaired = repair_json_string(truncated_json)
    
    # It should at least be parseable
    try:
        parsed = json.loads(repaired)
        assert "questions" in parsed
        # Should have salvaged at least the first question
        assert len(parsed["questions"]) >= 1
        assert parsed["questions"][0]["question"] == "Q1"
    except json.JSONDecodeError:
        pytest.fail("repair_json_string failed to produce parseable JSON from truncated input")
