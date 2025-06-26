import re
# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import AsyncOpenAI, AuthenticationError
from typing import Optional, AsyncGenerator

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://frontend-xi-six-85.vercel.app", "http://localhost:3000"],  # Your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-3.5-turbo"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication

def strip_latex_math(text: str) -> str:
    # Remove block math delimiters
    text = re.sub(r"\\\[([\s\S]*?)\\\]", r"\1", text)
    
    # Remove inline math delimiters
    text = re.sub(r"\\\((.*?)\\\)", r"\1", text)

    # Convert fractions: \frac{12}{4} → 12 / 4
    text = re.sub(r"\\frac\{([^{}]+)\}\{([^{}]+)\}", r"\1 / \2", text)

    # Optional: remove any remaining LaTeX backslashes
    text = text.replace("\\", "")

    return text

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:

        def build_dynamic_prompt(user_msg: str, developer_msg: str) -> tuple[str, float]:
            """Return a system prompt based on message content or default."""
            lower_msg = user_msg.lower()

            if "summarize" in lower_msg or "summary" in lower_msg:
                return (
                    "You are a professional editor. Read the provided paragraph and write a concise summary in 3-4 bullet points or a single paragraph.", 0.3
                )
            elif "rewrite" in lower_msg and "formal" in lower_msg:
                return (
                    "You are a formal writing assistant. Rewrite the given content in a polished, professional tone while preserving all facts.", 0.4
                )
            elif "write a story" in lower_msg or "short story" in lower_msg:
                return (
                    "You are a creative storyteller. Write a 100–150 word imaginative story with emotion, a twist, and a satisfying ending.", 0.9
                )
            elif "how many packs" in lower_msg:
                return (
                    "You are a math tutor. Solve the word problem with step-by-step reasoning and show clear math.", 0.2
                )
            else:
                # Fallback to provided system prompt or default assistant
                return (developer_msg or "You are a helpful assistant.", 0.7)

        system_prompt, temperature = build_dynamic_prompt(request.user_message, request.developer_message)

        async def generate() -> AsyncGenerator[str, None]:
            try:
                # Create async OpenAI client
                async with AsyncOpenAI(api_key=request.api_key) as client:
                    stream = await client.chat.completions.create(
                        model=request.model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": request.user_message}
                        ],
                        temperature=temperature,
                        stream=True  # Enable streaming response
                    )
                    
                    # Yield each chunk of the response as it becomes available
                    async for chunk in stream:
                        if chunk.choices[0].delta.content is not None:
                            clean_text = strip_latex_math(chunk.choices[0].delta.content)
                            yield clean_text

            except AuthenticationError as auth_error:
                print(f"Authentication error: {str(auth_error)}")
                raise HTTPException(status_code=401, detail="Invalid API key")
            except Exception as e:
                print(f"Error in stream: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        # Log the actual error for debugging
        print(f"Error in chat endpoint: {str(e)}")
        if isinstance(e, AuthenticationError):
            raise HTTPException(status_code=401, detail="Invalid API key")
        raise HTTPException(status_code=500, detail=str(e))

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
