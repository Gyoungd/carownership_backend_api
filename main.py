from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI(
    title="Car Ownership API",
    description="ABS Annual Car Ownership dataset API (2016–2021)",
    version="1.0.0"
)

# ✅ CORS 설정
origins = [
    "http://localhost:5173",             # Vite 개발 서버
    "https://<프론트엔드_배포_도메인>",    # 실제 프론트엔드 배포 주소 (예: Netlify, Vercel)
    "*"                                  # 모든 도메인 허용 (개발 단계에서만)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE 등 모든 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

# ✅ CSV 데이터 로드
df = pd.read_csv('paasengercar_ownership_cleaned.csv')

# ✅ 엔드포인트: 전체 데이터
@app.get("/ownership")
def get_all_ownership():
    return df.to_dict(orient="records")

# ✅ 엔드포인트: 특정 주(state) 데이터
@app.get("/ownership/{state}")
def get_ownership_by_state(state: str):
    data = df[df['State'].str.lower() == state.lower()]
    if data.empty:
        raise HTTPException(status_code=404, detail="State not found")
    return data.to_dict(orient="records")

# ✅ 엔드포인트: 특정 주 + 특정 연도 데이터
@app.get("/ownership/{state}/{year}")
def get_ownership_by_state_year(state: str, year: int):
    data = df[(df['State'].str.lower() == state.lower()) & (df['Year'] == year)]
    if data.empty:
        raise HTTPException(status_code=404, detail="No data for this state and year")
    return data.to_dict(orient="records")
