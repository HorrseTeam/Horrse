from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from worker import process_hoof_diagnosis, process_lameness_diagnosis, celery_app
import os

app = FastAPI(title="Horse Health AI Inference Server")

# 환경변수 ALLOWED_ORIGINS로 허용 출처 제어 (쉼표로 구분)
# 예: ALLOWED_ORIGINS=http://localhost:8081,http://192.168.1.100:8081
_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:8081")
ALLOWED_ORIGINS = [origin.strip() for origin in _origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.post("/ai/hoof")
async def analyze_hoof(
    horse_id: int = Form(...),
    file: UploadFile = File(...)
):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    import os
    base_url = os.getenv("CALLBACK_BASE_URL", "http://localhost:8080")
    callback_url = f"{base_url}/api/diagnosis/hoof-callback"
    
    # Send task to Celery Message Queue
    task = process_hoof_diagnosis.delay(horse_id=horse_id, callback_url=callback_url)
    return {"message": "Task queued", "task_id": task.id}

@app.post("/ai/lameness")
async def analyze_lameness(
    horse_id: int = Form(...),
    walk_direction: str = Form(...),
    walk_type: str = Form(...),
    file: UploadFile = File(...)
):
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # In a real system, the video would be uploaded to S3 or a local temp path.
    # We simulate an S3 video url based on the usecase diagram
    video_url = f"s3://horrse-bucket/videos/{horse_id}/{file.filename}"
    # Callback URL pointing securely to the Spring Backend using Env Variable
    import os
    base_url = os.getenv("CALLBACK_BASE_URL", "http://localhost:8080")
    callback_url = f"{base_url}/api/diagnosis/callback"
    
    # Send task to Celery Message Queue
    task = process_lameness_diagnosis.delay(
        horse_id=horse_id,
        video_url=video_url,
        walk_direction=walk_direction,
        walk_type=walk_type,
        callback_url=callback_url
    )
    return {"message": "Task queued", "task_id": task.id}

@app.get("/ai/status/{task_id}")
def get_status(task_id: str):
    task_result = celery_app.AsyncResult(task_id)
    result = {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result if task_result.ready() else None
    }
    return result

@app.get("/")
def read_root():
    return {"message": "AI Inference Server is running."}
