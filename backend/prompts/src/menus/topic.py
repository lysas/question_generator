from typing import List, Optional, Dict, Any
from prompts.src.schemas import QuestionOutputList

from pydantic import BaseModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)


def get_option_example(option_type: str, num_options: int) -> Dict[str, str]:
    """
    Generates an example string for MCQ options and a sample answer format.
    
    :param option_type: The style of options (e.g., "numerical", "alphabetical", "alphabetical_uppercase", "roman_numerals").
    :param num_options: The number of options to generate.
    :returns: A dictionary with 'example_string' and 'sample_answer'.
    """
    options = []
    sample_answer = ""
    
    if option_type == "numerical":
        # e.g., 1) Option 1, 2) Option 2
        options = [f"   {i+1}) [Option {i+1}]" for i in range(num_options)]
        sample_answer = "e.g., '2'"
    
    elif option_type == "roman_numerals":
        # e.g., I) Option 1, II) Option 2
        roman_map = {
            1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 
            6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X",
        }
        options = [
            f"   {roman_map.get(i+1, str(i+1))}) [Option {i+1}]"
            for i in range(num_options)
        ]
        sample_answer = "e.g., 'II'"
        
    elif option_type == "alphabetical_lowercase":
        # e.g., a) Option 1, b) Option 2
        options = [f"   {chr(97 + i)}) [Option {i+1}]" for i in range(num_options)]  # 97 is 'a'
        sample_answer = "e.g., 'b'"
        
    else:  # Default to uppercase alphabetical (for 'alphabetical' or any other value)
        # e.g., A) Option 1, B) Option 2
        options = [f"   {chr(65 + i)}) [Option {i+1}]" for i in range(num_options)]  # 65 is 'A'
        sample_answer = "e.g., 'B'"

    return {
        "example_string": "\n".join(options),
        "sample_answer": sample_answer,
    }

class TopicBasedQuestionCreatePromptTemplate:
    """
    Class for creating optimized prompt templates for topic-based question generation.
    Strictly follows all parameters and provides perfect formatting for each question type.
    """

    def create_prompttemplate(self, input_data: dict) -> ChatPromptTemplate:
        """
        Generates questions with strict parameter adherence and perfect formatting.

        :param input_data: Dictionary containing all question generation parameters
        :returns: ChatPromptTemplate object with precise instructions
        """
        try:
            # Extract key parameters with defaults
            provide_answer = input_data.get("provideAnswerValue", "Yes")
            explanation_detail = input_data.get("explanationValue", "Not required")
            question_type = input_data.get("questionType", "Short-answer Questions")
            input_data.get("formatValue", "Structured")
            
            # Get dynamic option examples
            try:
                num_options = int(input_data.get("numberOfOptionsValue", 4))
            except (ValueError, TypeError):
                num_options = 4
            # Default to 'alphabetical' (Uppercase)
            raw_option_type_value = input_data.get("optionTypeValue", "alphabetical").strip()

            # Normalize UI labels to backend types
            # Extract only letter chars so 'a, b,' correctly detects as lowercase
            _lt = "".join(c for c in raw_option_type_value if c.isalpha())
            if any(c.isdigit() for c in raw_option_type_value):
                option_type = "numerical"
            elif "roman" in raw_option_type_value.lower() or ("I" in _lt and "II" in raw_option_type_value.upper() and _lt == _lt.upper()):
                option_type = "roman_numerals"
            elif _lt and _lt == _lt.lower():
                option_type = "alphabetical_lowercase"
            else:
                option_type = "alphabetical"

            option_example_data = get_option_example(option_type, num_options)
            option_example_string = option_example_data["example_string"]
            sample_answer_format = option_example_data["sample_answer"]

            option_type_description = ""
            if option_type == "numerical":
                option_type_description = "numerical"
            elif option_type == "roman_numerals":
                option_type_description = "roman numeral"
            elif option_type == "alphabetical_lowercase":
                option_type_description = "lowercase alphabetical"
            else: # "alphabetical" or any other value
                option_type_description = "uppercase alphabetical"

            topic_value = input_data.get("topicValue", "")
            subtopic_value = input_data.get("subtopicValue", "")
            example_value = input_data.get("exampleValue", "")
            concept_value = input_data.get("conceptValue", "")
            constraints_value = input_data.get("constraintsValue", "")
            keywords_value = input_data.get("keywordsValue", "")

            raw_num_missing_words = input_data.get("numberOfMissingWordsValue")
            try:
                num_missing_words = int(raw_num_missing_words) if raw_num_missing_words is not None else 1
            except ValueError:
                num_missing_words = 1 # Default to 1 if conversion fails

            system_template = (
                "You are an expert educational question generator. Strictly follow these rules:\n"
                "1. Generate exactly {numQuestionsValue} questions — ALL must be of type: '{questionType}'. Do NOT mix question types under any circumstance.\n"
                f"2. For 'Fill in the blanks' questions, ensure exactly {num_missing_words} blanks are present.\n"
                "3. Base questions on Topic: {topicValue}"
                + ("\n3. Subtopic focus: {subtopicValue}" if subtopic_value else "")
                + ("\n4. Follow example pattern: {exampleValue}" if example_value else "")
                + ("\n5. Emphasize concept: {conceptValue}" if concept_value else "")
                + ("\n6. Apply constraints: {constraintsValue}" if constraints_value else "")
                + ("\n7. Include keywords: {keywordsValue}" if keywords_value else "")
                + "\n"
                + f"8. Provide Answer: {{provideAnswerValue}}\n"
                f"9. Explanation: {{explanationValue}}\n"
                + (f"   - If explanation is required, ensure it is exactly {explanation_detail} long." if "sentence" in explanation_detail.lower() else "") + "\n"
                f"10. Format output as: {{formatValue}}\n"
                f"11. Never deviate from specified parameters\n"
                f"12. For each question type, provide appropriate answer format (not just Yes/No)\n"
                f"13. **STRICT REQUIREMENT: Output ONLY the final valid JSON. Do NOT include any conversational text, explanations, or acknowledgment before or after the JSON.**\n"
                + (f"14. For MCQ questions, strictly generate options *exactly* as demonstrated in the FORMAT EXAMPLE, using the {option_type_description} style (e.g., A, B, C or 1, 2, 3 or I, II, III or a, b, c) and preserving the exact casing/numbering for options." if question_type == 'MCQ' else "")
            )

            # Define type-specific answer formats
            answer_formats = {
                "MCQ": f"   Answer: [Correct option label and full text, e.g., 'b) {sample_answer_format}...']\n",
                "Fill in the blanks": "   Answer: [Correct word(s) to fill in the blank(s)]\n",
                "Match the following": "   Answer: a-ii, b-i, c-iv, etc.\n",
                "True/False": "   Answer: [True or False]\n",
                "Short-answer Questions": "   Answer: [Brief, specific answer to the question]\n",
                "Essay Questions": "   Answer: [Key points expected in the essay]\n",
                "Numerical Problems": "   Answer: [Numerical solution with step-by-step calculation]\n",
                "Programming Exercise": "   Answer: [Code solution]\n",
                "Statement Problems": "   Answer: [Correct option based on statements, e.g., 'I and II are correct']\n",
                "Derivations": "   Answer: [Step-by-step mathematical or logical derivation concluding with the final result]\n",
                "Case Studies": "   Answer: [Detailed analysis and solution to the case presented]\n",
                "Data Analysis and Interpretation": "   Answer: [Specific insights or answers derived from the data analysis]\n",
                "Puzzles": "   Answer: [The solution to the puzzle with a brief explanation of the logic]\n",
                "Riddles": "   Answer: [The answer to the riddle]\n",
            }

            # Get the appropriate answer format for the question type
            answer_format = answer_formats.get(
                question_type,
                "   Answer: [Appropriate answer for the question]\n",
            )

            # Prepare answer section based on parameters
            answer_section = ""
            if provide_answer == "Yes":
                answer_section = answer_format
                if explanation_detail != "Not required":
                    answer_section += f"   Explanation: [Provide {explanation_detail} explanation]\n"

            # Enhanced type-specific requirements
            type_specific = {
                "MCQ": (
                    "Options: {numberOfOptionsValue} ({optionTypeValue} style)\n"
                    "FORMAT EXAMPLE (follow EXACTLY this option style, including casing):\n"
                    "1. [Clear question stem about {topicValue}]\n"
                    "   {option_example_string}\n"
                    "IMPORTANT: Do NOT use any other format (e.g., if shown as 'a)', do not write 'A)'; if shown as '1)', do not use letters).\n"
                    f"{answer_section}"
                ),
                "Fill in the blanks": (
                    "Missing Words: {numberOfMissingWordsValue} (shown as {representingWordsValue})\n"
                    "FORMAT EXAMPLE:\n"
                    "1. [Sentence about topic with {representingWordsValue} for missing words].\n"
                    "IMPORTANT: If {representingWordsValue} is 'brackets', ensure the brackets are EMPTY in the question text (e.g., 'The capital of France is [ ].'). Do NOT put the answer inside the brackets.\n"
                    "{answer_section}"
                ),
                "Match the following": (
                    "Items: {numberOfItemsValue} pairs per question\n"
                    "PERFECT FORMAT:\n"
                    "Match the following concepts:\n"
                    "   Column A\t\tColumn B\n"
                    "   a. [Item 1]\t\ti. [Match 1]\n"
                    "   b. [Item 2]\t\tii. [Match 2]\n"
                    "   ...\n"
                    "{answer_section}\n\n"
                ),
                "True/False": (
                    "FORMAT EXAMPLE:\n"
                    "[Clear statement about the topic]. (True/False)\n"
                    "{answer_section}"
                ),
                "Short-answer Questions": (
                    "FORMAT EXAMPLE:\n"
                    "[Direct question about the topic]?\n"
                    "{answer_section}"
                ),
                "Essay Questions": (
                    "FORMAT EXAMPLE:\n"
                    "[In-depth question requiring detailed explanation].\n"
                    "{answer_section}"
                ),
                "Numerical Problems": (
                    "FORMAT EXAMPLE:\n"
                    "[Calculative problem about the topic]\n"
                    "{answer_section}"
                ),
                "Programming Exercise": (
                    "FORMAT EXAMPLE:\n"
                    "[Programming task based on topic concepts]\n"
                    "{answer_section}"
                ),
                "Statement Problems": (
                    "FORMAT EXAMPLE:\n"
                    "Consider the following statements:\n"
                    "   I. [Statement 1]\n"
                    "   II. [Statement 2]\n"
                    "Which of the following is correct?\n"
                    "   A) Only I\n"
                    "   B) Only II\n"
                    "   C) Both I and II\n"
                    "   D) Neither I nor II\n"
                    "{answer_section}"
                ),
                "Derivations": (
                    "FORMAT EXAMPLE:\n"
                    "Derive the expression for [Concept Name].\n"
                    "{answer_section}"
                ),
                "Case Studies": (
                    "FORMAT EXAMPLE:\n"
                    "CASE SCENARIO: [Brief description of the scenario].\n"
                    "QUESTION: [Question requiring analysis of the case].\n"
                    "{answer_section}"
                ),
                "Data Analysis and Interpretation": (
                    "FORMAT EXAMPLE:\n"
                    "Based on the data [provided/referenced], analyze [aspect].\n"
                    "{answer_section}"
                ),
                "Puzzles": (
                    "FORMAT EXAMPLE:\n"
                    "[Puzzle description requiring logical reasoning].\n"
                    "{answer_section}"
                ),
                "Riddles": (
                    "FORMAT EXAMPLE:\n"
                    "[Riddle text]. What am I?\n"
                    "{answer_section}"
                ),
            }
            
            type_req = type_specific.get(
                question_type,
                "Match the specified parameters exactly.",
            ).format(
                answer_section=answer_section,
                topicValue=topic_value,
                option_example_string=option_example_string,
                essayLengthValue=input_data.get("essayLengthValue", "3-5 paragraphs"),
                numberOfOptionsValue=num_options,
                optionTypeValue=option_type,
                numberOfMissingWordsValue=input_data.get("numberOfMissingWordsValue"),
                representingWordsValue=input_data.get("representingWordsValue", "blanks"),
                numberOfItemsValue=input_data.get("numberOfItemsValue", "5"),
            )

            # Human message template
            topic_template = (
                "TOPIC: {topicValue}\n"
                "SUBTOPIC: {subtopicValue}\n"
                "CONCEPT: {conceptValue}\n"
                "EXAMPLE: {exampleValue}\n"
                "KEYWORDS: {keywordsValue}\n"
                "CONSTRAINTS: {constraintsValue}\n\n"
                "QUESTION REQUIREMENTS:\n"
                "Type: {questionType}\n"
                "Bloom's Level: {bloomValue}\n"
                "Difficulty: {levelValue}\n"
                "Learning Objective: {learningObj}\n"
                "{type_specific_requirements}\n"
            )

            # Output format rules
            output_format = (
                "STRICT OUTPUT RULES:\n"
                "0. IMPORTANT: Do NOT include any question that is NOT of type: '{questionType}'\n"
                "1. Provide Answer: "
                + (
                    "Yes - include relevant answers"
                    if provide_answer == "Yes"
                    else "No"
                )
                + "\n"
                "2. Explanation: "
                + (
                    "Explanation"
                    if explanation_detail != "Not required"
                    else "Not included"
                )
                + "\n"
                "3. Maintain perfect formatting for {questionType}\n"
                "4. Number all questions sequentially starting from 1\n"
                "5. Ensure questions directly relate to the specified topic and incorporate any subtopics, concepts, and keywords\n"
                "6. Match the specified difficulty ({levelValue}) and Bloom's level ({bloomValue})\n"
                "7. For each question type, the answer must be relevant and appropriate (as shown in FORMAT EXAMPLE):\n"
                f"   - MCQ: Specify the correct option ({sample_answer_format})\n"
                "   - Fill in the blanks: Provide the missing word(s)\n"
                "   - Match the following: Show which items match (e.g., a-ii, b-i)\n"
                "   - True/False: State True or False\n"
                "   - Short-answer: Give a concise, specific answer\n"
                "   - Essay Questions: Provide key points expected in the answer\n"
                "   - Numerical Problems: Show the numerical answer with workings\n"
                "   - Programming Exercise: Include the actual code solution"
            )
            
            # Define the output requirements - conditionally include explanation field
            if explanation_detail != "Not required":
                json_structure_instruction = (
                    "CRITICAL OUTPUT FORMAT:\n"
                    "You MUST return the result as a VALID JSON object and nothing else.\n"
                    "DO NOT wrap your response in markdown code blocks like ```json ... ```.\n"
                    "ALL string values must be properly escaped (use \\\" for quotes inside strings, escape newlines as \\n).\n"
                    "OUTPUT SCHEMA:\n"
                    "{{\n"
                    '  "questions": [\n'
                    "    {{\n"
                    '      "question": "Question text ONLY (do NOT include question numbers here, e.g., NO \'1. \') ", \n'
                    '      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"], // CRITICAL: MUST include labels (A., B., etc.) based on style\n'
                     '      "answer": "Correct answer label and full text (e.g., \'b) Option text\')",\n'
                    f'      "explanation": "Provide {explanation_detail} explanation"\n'
                    "    }}\n"
                    "  ]\n"
                    "}}\n"
                    "CRITICAL: Ensure valid JSON syntax with proper commas between array items. ONLY output the JSON."
                )
            else:
                json_structure_instruction = (
                    "CRITICAL OUTPUT FORMAT:\n"
                    "You MUST return the result as a VALID JSON object and nothing else.\n"
                    "DO NOT wrap your response in markdown code blocks like ```json ... ```.\n"
                    "ALL string values must be properly escaped (use \\\" for quotes inside strings, escape newlines as \\n).\n"
                    "OUTPUT SCHEMA:\n"
                    "{{\n"
                    '  "questions": [\n'
                    "    {{\n"
                    '      "question": "Question text ONLY (do NOT include question numbers here, e.g., NO \'1. \') ", \n'
                    '      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"], // CRITICAL: MUST include labels (A., B., etc.) based on style\n'
                     '      "answer": "Correct answer label and full text (e.g., \'b) Option text\')"\n'
                    "    }}\n"
                    "  ]\n"
                    "}}\n"
                    "CRITICAL: Ensure valid JSON syntax with proper commas between array items. ONLY output the JSON."
                )

            # Always generate JSON for backend parsing, formatValue only affects frontend display
            final_instruction = "\n\n" + json_structure_instruction

            chat_template = ChatPromptTemplate.from_messages(
                [
                    SystemMessagePromptTemplate.from_template(system_template),
                    HumanMessagePromptTemplate.from_template(
                        topic_template.format(
                            type_specific_requirements=type_req, **input_data
                        )
                        + "\n\n"
                        + output_format.format(**input_data)
                        + final_instruction
                    ),
                ],
            )
            return chat_template

        except Exception as e:
            print(f"Prompt creation error: {e}")
            return None

# Create the parser for structured output
parser = PydanticOutputParser(pydantic_object=QuestionOutputList)
