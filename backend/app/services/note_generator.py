"""Note Generator Module"""

from typing import List, Dict, Optional
import json
import re

from app.services.llm_service import generate_with_prompt, generate_structured_output


async def generate_summary(context: str, topic: Optional[str] = None) -> str:
    """Generate a concise summary."""
    topic_focus = f" focusing on {topic}" if topic else ""
    
    prompt = f"""Create a comprehensive summary of the following study material{topic_focus}.

The summary should:
1. Highlight main concepts and key points
2. Be organized in a logical structure
3. Use bullet points for clarity
4. Include important facts and definitions

Content:
{context}

Generate the summary:"""

    return await generate_with_prompt(prompt, temperature=0.5)


async def generate_topic_notes(context: str, topic: Optional[str] = None) -> str:
    """Generate structured topic-wise notes."""
    topic_focus = f" with focus on {topic}" if topic else ""
    
    prompt = f"""Create organized study notes from the following content{topic_focus}.

Structure with:
1. Clear headings and subheadings
2. Key concepts explained simply
3. Important definitions highlighted
4. Examples where relevant
5. Summary points

Use markdown formatting.

Content:
{context}

Generate the study notes:"""

    return await generate_with_prompt(prompt, temperature=0.5, max_tokens=3000)


async def generate_mcqs(context: str, num_questions: int = 5) -> List[Dict]:
    """Generate multiple choice questions."""
    prompt = f"""Generate {num_questions} multiple choice questions.

For each question:
1. Clear, unambiguous question
2. Exactly 4 options (A, B, C, D)
3. One correct answer
4. Brief explanation

Respond with JSON array:
[
  {{
    "question": "What is...?",
    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
    "correct_answer": "A. Option 1",
    "explanation": "This is correct because..."
  }}
]

Content:
{context}

Generate {num_questions} MCQs as JSON:"""

    response = await generate_structured_output(prompt, "", output_format="json")
    
    try:
        json_match = re.search(r'\[.*\]', response, re.DOTALL)
        if json_match:
            mcqs = json.loads(json_match.group())
        else:
            mcqs = json.loads(response)
        
        validated = []
        for mcq in mcqs:
            if all(key in mcq for key in ["question", "options", "correct_answer"]):
                validated.append({
                    "question": mcq["question"],
                    "options": mcq["options"][:4],
                    "correct_answer": mcq["correct_answer"],
                    "explanation": mcq.get("explanation", "")
                })
        
        return validated[:num_questions]
        
    except json.JSONDecodeError:
        return []


async def generate_explanation(context: str, topic: str) -> str:
    """Generate a simple explanation of a concept."""
    prompt = f"""Explain "{topic}" in simple terms.

Guidelines:
1. Start with a simple definition
2. Explain as if teaching a beginner
3. Use analogies and examples
4. Break down complex parts
5. End with a summary

Context:
{context}

Explain "{topic}":"""

    return await generate_with_prompt(prompt, temperature=0.6)


async def generate_definitions(context: str, topic: Optional[str] = None) -> str:
    """Extract and define key terms."""
    topic_focus = f" related to {topic}" if topic else ""
    
    prompt = f"""Extract and define key terms{topic_focus}.

For each term:
1. Clear definition
2. Add context or examples

Format as glossary:
**Term**: Definition.

Content:
{context}

Generate definitions:"""

    return await generate_with_prompt(prompt, temperature=0.4)
