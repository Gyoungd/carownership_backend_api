from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI()

origins = [
    "http://localhost:5173",  # Vite dev server
    "https://<프론트엔드_배포_도메인>",  # 실제 배포 주소
    "*"  # 모든 도메인 허용 (개발 중 임시)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df = pd.read_csv('paasengercar_ownership_cleaned.csv')

@app.get("/ownership")
def get_all_ownership():
    return df.to_dict(orient="records")

@app.get("/ownership/{state}")
def get_ownership_by_state(state: str):
    data = df[df['State'].str.lower() == state.lower()]
    if data.empty:
        raise HTTPException(status_code=404, detail="State not found")
    return data.to_dict(orient="records")

@app.get("/ownership/{state}/{year}")
def get_ownership_by_state_year(state: str, year: int):
    data = df[(df['State'].str.lower() == state.lower()) & (df['Year'] == year)]
    if data.empty:
        raise HTTPException(status_code=404, detail="No data for this state and year")
    return data.to_dict(orient="records")
