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

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        async def generate() -> AsyncGenerator[str, None]:
            try:
                # Create async OpenAI client
                async with AsyncOpenAI(api_key=request.api_key) as client:
                    stream = await client.chat.completions.create(
                        model=request.model,
                        messages=[
                            {"role": "system", "content": request.developer_message},
                            {"role": "user", "content": request.user_message}
                        ],
                        stream=True  # Enable streaming response
                    )
                    
                    # Yield each chunk of the response as it becomes available
                    async for chunk in stream:
                        if chunk.choices[0].delta.content is not None:
                            yield chunk.choices[0].delta.content
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
