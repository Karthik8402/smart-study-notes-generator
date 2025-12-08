"""
LLM Service Module

Handles integration with Large Language Models for text generation.
Uses Groq (FREE) with Llama models.
"""

from typing import List, Dict, Optional
from groq import AsyncGroq
import os

from app.config import settings


# Initialize Groq client
client: Optional[AsyncGroq] = None


def get_groq_client() -> AsyncGroq:
    """Get or create Groq client."""
    global client
    
    if client is None:
        api_key = settings.groq_api_key
        if not api_key:
            raise RuntimeError(
                "Groq API key not configured. "
                "Set GROQ_API_KEY in your .env file. "
                "Get a FREE key at: https://console.groq.com"
            )
        client = AsyncGroq(api_key=api_key)
    
    return client


async def generate_response(
    question: str,
    context: List[str],
    chat_history: List[Dict] = None,
    system_prompt: str = None
) -> str:
    """
    Generate a response using the LLM with RAG context.
    
    Args:
        question: User's question
        context: List of relevant context chunks from RAG
        chat_history: Previous chat messages for context
        system_prompt: Optional custom system prompt
        
    Returns:
        Generated response text
    """
    groq_client = get_groq_client()
    
    # Build system prompt
    if system_prompt is None:
        system_prompt = """You are a helpful study assistant that helps students understand their study materials.

Your role is to:
1. Answer questions accurately based on the provided context
2. Explain concepts in simple, easy-to-understand terms
3. Provide relevant examples when helpful
4. Be clear about what information comes from the context vs general knowledge
5. If the context doesn't contain enough information, say so honestly

Always be encouraging and supportive in your responses."""
    
    # Build context message
    context_text = "\n\n---\n\n".join(context) if context else "No specific context available."
    
    context_message = f"""Here is the relevant content from the student's study materials:

{context_text}

Use this context to help answer the student's question. If the context doesn't contain relevant information, you may use your general knowledge but make it clear."""
    
    # Build messages
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": context_message}
    ]
    
    # Add chat history (last few messages for context)
    if chat_history:
        for msg in chat_history[-6:]:  # Keep last 6 messages
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
    
    # Add current question
    messages.append({"role": "user", "content": question})
    
    try:
        response = await groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",  # Fast & FREE Llama model
            messages=messages,
            temperature=0.7,
            max_tokens=1500
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        raise RuntimeError(f"Error generating response: {str(e)}")


async def generate_with_prompt(
    prompt: str,
    context: str = "",
    temperature: float = 0.7,
    max_tokens: int = 2000
) -> str:
    """
    Generate text with a custom prompt.
    
    Args:
        prompt: The full prompt to send
        context: Optional context to include
        temperature: Creativity level (0-1)
        max_tokens: Maximum response length
        
    Returns:
        Generated text
    """
    groq_client = get_groq_client()
    
    messages = [{"role": "user", "content": prompt}]
    
    if context:
        messages.insert(0, {
            "role": "system",
            "content": f"Context:\n{context}"
        })
    
    try:
        response = await groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        raise RuntimeError(f"Error generating text: {str(e)}")


async def generate_structured_output(
    prompt: str,
    context: str,
    output_format: str = "json"
) -> str:
    """
    Generate structured output (JSON, list, etc.)
    
    Args:
        prompt: The generation prompt
        context: Context to use
        output_format: Expected format (json, list, etc.)
        
    Returns:
        Structured output as string
    """
    groq_client = get_groq_client()
    
    format_instruction = ""
    if output_format == "json":
        format_instruction = "\n\nRespond ONLY with valid JSON. Do not include any text before or after the JSON."
    
    messages = [
        {
            "role": "system",
            "content": f"You are a helpful assistant that generates structured content.{format_instruction}"
        },
        {
            "role": "user",
            "content": f"Context:\n{context}\n\n{prompt}"
        }
    ]
    
    try:
        response = await groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.5,  # Lower temperature for structured output
            max_tokens=2000
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        raise RuntimeError(f"Error generating structured output: {str(e)}")
