import os
from celery import Celery
import time
import random
import requests

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

celery_app = Celery(
    "ai_worker",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND
)

@celery_app.task(name="process_hoof_diagnosis", bind=True)
def process_hoof_diagnosis(self, horse_id=None, callback_url=None):
    # 실제 딥러닝 연산(GPU)을 모사하는 딜레이
    time.sleep(5)
    
    grades = ["정상", "경미", "중등도", "심각"]
    grade = random.choice(grades)
    confidence = float(f"{random.uniform(85, 99):.2f}")
    
    result_payload = {
        "horse_id": horse_id,
        "task_id": self.request.id,
        "status": "SUCCESS",
        "analysis_type": "hoof",
        "result": {
            "grade": grade,
            "confidence": confidence,
            "message": "발굽 분석 모델 연산이 성공적으로 완료되었습니다."
        }
    }

    if callback_url:
        try:
            requests.post(callback_url, json=result_payload)
        except Exception as e:
            print(f"Failed to trigger hoof callback: {e}")

    return result_payload

@celery_app.task(name="process_lameness_diagnosis")
def process_lameness_diagnosis(horse_id=None, video_url=None, walk_direction="SIDE", walk_type="WALK", callback_url=None):
    time.sleep(5) # simulate processing
    
    # Randomly select a scenario based on the use case document specifications
    scenario = random.choice(["SUCCESS", "FAIL_1", "FAIL_2", "FAIL_3"])
    
    result_payload = {}
    
    if scenario == "SUCCESS":
        # Generate 13 joint points
        joint_names = [
            "Tail_root", "T_Coxae_L", "T_Coxae_R", "Stifle_joint_L", "Stifle_joint_R",
            "T_ischiadicum_L", "T_ischiadicum_R", "Hock_L", "Hock_R",
            "Fetlock_Rear_L", "Fetlock_Rear_R", "Hoof_Rear_L", "Hoof_Rear_R"
        ]
        
        joint_array = []
        for name in joint_names:
            joint_array.append({
                "name": name,
                "x": random.randint(50, 400),
                "y": random.randint(100, 600),
                "score": round(random.uniform(0.7, 0.99), 2)
            })
            
        result_payload = {
            "horse_id": horse_id,
            "status": "SUCCESS",
            "result": {
                "lameness_yn": "Y",
                "walk_type": walk_type,
                "walk_direction": walk_direction,
                "diagnosis": {
                    "affected_area": "REAR_LEFT", 
                    "problem_joint": "Stifle_joint_L",
                    "risk_level": "HIGH",
                    "description": "왼쪽 뒷무릎 관절의 각도가 정상 범위를 벗어났습니다."
                },
                "joint_array": joint_array
            }
        }
    elif scenario == "FAIL_1":
        result_payload = {
            "horse_id": horse_id,
            "status": "FAIL",
            "error": {
                "code": "JOINT_DETECTION_FAILED",
                "message": "관절 검출에 실패하였습니다. 선명한 영상으로 재촬영 해주세요."
            },
            "result": None
        }
    elif scenario == "FAIL_2":
        result_payload = {
            "horse_id": horse_id,
            "status": "FAIL",
            "error": {
                "code": "FRAME_EXTRACTION_FAILED",
                "message": "영상에서 프레임을 추출할 수 없습니다. 지원 형식(mp4/mov)을 확인해 주세요."
            },
            "result": None
        }
    else:
        result_payload = {
            "horse_id": horse_id,
            "status": "FAIL",
            "error": {
                "code": "INSUFFICIENT_FRAMES",
                "message": "유효 프레임이 부족합니다. 최소 3초 이상 촬영된 영상을 업로드 해주세요."
            },
            "result": None
        }
        
    if callback_url:
        try:
            requests.post(callback_url, json=result_payload)
        except Exception as e:
            print(f"Failed to trigger callback: {e}")
            
    return result_payload
