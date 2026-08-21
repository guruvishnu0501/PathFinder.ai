import os
import json
import re
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from typing import List, Optional

from groq import AsyncGroq
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic_core import core_schema

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

# --- Initial Configuration ---
load_dotenv()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# --- Database Connection ---
MONGO_URI = os.getenv("MONGO_URI")
client = AsyncIOMotorClient(MONGO_URI)
db = client.pathfinder_db

# --- App & Rate Limiter Configuration ---
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Pathfinder AI API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
origins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# --- AI Model Configuration (Groq) ---
groq_api_key = os.getenv("GROQ_API_KEY") or os.getenv("API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY or API_KEY not found in .env file.")

groq_client = AsyncGroq(api_key=groq_api_key)
GROQ_MODEL = "groq/compound"

async def call_groq_completion(prompt: str, is_json: bool = False) -> str:
    models_to_try = [GROQ_MODEL, "groq/compound-mini"]
    last_error = None
    for model_name in models_to_try:
        try:
            chat_completion = await groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model_name,
            )
            raw = chat_completion.choices[0].message.content.strip()
            cleaned = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
            if is_json:
                json_match = re.search(r'\[\s*\{.*\}\s*\]', cleaned, re.DOTALL) or re.search(r'\{.*\}', cleaned, re.DOTALL)
                if json_match:
                    cleaned = json_match.group(0)
            return cleaned
        except Exception as e:
            last_error = e
    raise last_error

# --- Pydantic Data Models ---
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type: any, _handler: any) -> core_schema.CoreSchema:
        def validate_from_str(input_value: str) -> ObjectId:
            if not ObjectId.is_valid(input_value):
                raise ValueError(f"Invalid ObjectId: {input_value}")
            return ObjectId(input_value)
        return core_schema.union_schema(
            [core_schema.is_instance_schema(ObjectId), core_schema.no_info_plain_validator_function(validate_from_str)],
            serialization=core_schema.to_string_ser_schema(),
        )

class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: str
    role: str = "user"
    points: int = 0
    streak: int = 0
    last_quiz_date: Optional[datetime] = None
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str, datetime: lambda dt: dt.isoformat()})

class UserInDB(User):
    hashed_password: str

class UserInCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class QuizResultInSave(BaseModel):
    topic: str
    score: int
    totalQuestions: int
    quizData: list
    studyPlan: Optional[str] = None
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class QuizResult(QuizResultInSave):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    completedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: str
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})

class Topic(BaseModel):
    topic: str
    
class PlanRequest(BaseModel):
    topic: str
    quizData: list

class FollowUpRequest(BaseModel):
    topic: str
    question: str

# --- Security & Authentication Functions ---
def verify_password(plain_password, hashed_password): return pwd_context.verify(plain_password, hashed_password)
def get_password_hash(password): return pwd_context.hash(password)
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await db.users.find_one({"email": email})
    if user is None: raise credentials_exception
    return user

async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# --- Authentication Endpoints ---
@app.post("/signup", response_model=User)
async def create_user(user: UserInCreate):
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    user_document = {"email": user.email, "hashed_password": hashed_password, "role": "user", "points": 0, "streak": 0, "last_quiz_date": None}
    new_user = await db.users.insert_one(user_document)
    return await db.users.find_one({"_id": new_user.inserted_id})

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user["email"], "role": user.get("role", "user")}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/profile", response_model=User)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

# --- AI Endpoints ---
@app.post("/generate-quiz")
@limiter.limit("10/minute")
async def generate_quiz(request: Request, topic: Topic, current_user: User = Depends(get_current_user)):
    prompt = f"""
    You are an expert quiz creator designed to generate diverse and unique question sets on the topic '{topic.topic}'.

    Generate a 10-question multiple-choice quiz with the following strict difficulty distribution:
    - 3 easy questions
    - 3 medium level questions
    - 3 hard questions
    - 1 extremely hard question

    **Crucially, ensure the questions are varied and not just the most common ones.**
    Cover a wide range of sub-topics related to '{topic.topic}'. Each time you generate a quiz for this topic, try to create a fresh set of questions that have not been asked before.

    Return it as a single, valid JSON array. Each object in the array should have: "question", "options" (a list of 4 options), "answer" (matching one of options), and "sub_topic".
    Do not include any Markdown or text outside of the raw JSON array.
    """
    try:
        cleaned_response = await call_groq_completion(prompt, is_json=True)
        return {"quiz": json.loads(cleaned_response)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz from AI: {e}")

@app.post("/generate-plan")
@limiter.limit("10/minute")
async def generate_plan(request: Request, plan_req: PlanRequest, current_user: User = Depends(get_current_user)):
    incorrect_questions_str = "\n".join(f"- {q['question']}" for q in plan_req.quizData if not q.get('isCorrect'))
    if not incorrect_questions_str:
        return {"plan": "Great job! No incorrect answers found."}
    
    prompt = f"""
    You are an expert academic tutor. A student studying '{plan_req.topic}' answered these questions incorrectly:
    {incorrect_questions_str}

    Based on these, create a concise, 4-day study plan.
    Format the entire response using markdown. Use headings (e.g., ##), bold (**text**), and bullet points or numbered lists.
    **DO NOT use a table format.**
    For each day in the plan, provide these four sections clearly labeled as bolded text:
    - **Focus:**
    - **Concept:**
    - **Resource Link:**
    - **Practice Task:**
    """
    try:
        cleaned_plan = await call_groq_completion(prompt, is_json=False)
        return {"plan": cleaned_plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate study plan from AI: {e}")

@app.post("/explain-question")
@limiter.limit("15/minute")
async def explain_question(request: Request, payload: dict, current_user: User = Depends(get_current_user)):
    question = payload.get("question")
    answer = payload.get("answer")
    prompt = f"In simple terms for a beginner, explain why the correct answer to the question '{question}' is '{answer}'."
    try:
        cleaned_resp = await call_groq_completion(prompt, is_json=False)
        return {"explanation": cleaned_resp}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get explanation from AI: {e}")

@app.post("/ask-follow-up")
@limiter.limit("20/minute")
async def ask_follow_up(request: Request, payload: FollowUpRequest, current_user: User = Depends(get_current_user)):
    prompt = f"You are a friendly AI tutor named Pathfinder. A student studying '{payload.topic}' has asked: '{payload.question}'. Provide a clear, concise explanation. Format using simple markdown."
    try:
        cleaned_resp = await call_groq_completion(prompt, is_json=False)
        return {"answer": cleaned_resp}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get an answer from the AI tutor.")

# --- History Endpoints ---
@app.post("/save-result")
async def save_result(result: QuizResultInSave, current_user: User = Depends(get_current_user)):
    points_earned = result.score * 10
    today = datetime.now(timezone.utc).date()
    last_quiz_dt = current_user.get("last_quiz_date")
    last_quiz_date = last_quiz_dt.date() if last_quiz_dt else None
    update_fields = {"$inc": {"points": points_earned}}
    if last_quiz_date != today:
        if last_quiz_date == today - timedelta(days=1):
            update_fields["$inc"]["streak"] = 1
        else:
            update_fields["$set"] = {"streak": 1}
        update_fields.setdefault("$set", {})["last_quiz_date"] = datetime.now(timezone.utc)
    await db.users.update_one({"_id": current_user["_id"]}, update_fields)
    result_dict = result.dict()
    result_dict["user_id"] = str(current_user["_id"])
    result_dict["completedAt"] = datetime.now(timezone.utc)
    await db.results.insert_one(result_dict)
    return {"success": True}

@app.get("/history", response_model=List[QuizResult])
async def get_history(current_user: User = Depends(get_current_user)):
    return await db.results.find({"user_id": str(current_user["_id"])}).sort("completedAt", -1).to_list(100)

# --- Admin Endpoints ---
@app.get("/admin/users", response_model=List[User])
async def get_all_users(current_user: User = Depends(get_current_admin_user)):
    return await db.users.find().to_list(1000)

@app.get("/admin/results", response_model=List[QuizResult])
async def get_all_results(current_user: User = Depends(get_current_admin_user)):
    return await db.results.find().sort("completedAt", -1).to_list(1000)

