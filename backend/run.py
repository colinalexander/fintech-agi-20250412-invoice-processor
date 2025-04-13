import uvicorn
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8081))  # Use port 8081 by default
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
