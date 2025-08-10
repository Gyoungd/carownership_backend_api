from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
from typing import Optional

app = FastAPI(
    title="Melbourne Mobility Insights API",
    description="ABS datasets API for Melbourne car ownership and population analytics (2016–2021)",
    version="2.0.0"
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

# ✅ 데이터 로딩 함수
def load_data():
    """데이터 파일들을 로드하고 전역 변수로 저장"""
    global ownership_df, population_df
    
    try:
        # Car Ownership 데이터 로드
        if os.path.exists('paasengercar_ownership_cleaned.csv'):
            ownership_df = pd.read_csv('paasengercar_ownership_cleaned.csv')
            print("✅ Car ownership data loaded successfully")
        else:
            print("❌ Car ownership CSV file not found")
            ownership_df = pd.DataFrame()
        
        # Population 데이터 로드  
        if os.path.exists('population.csv'):
            population_df = pd.read_csv('population.csv')
            print("✅ Population data loaded successfully")
        else:
            print("❌ Population CSV file not found")
            population_df = pd.DataFrame()
            
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        ownership_df = pd.DataFrame()
        population_df = pd.DataFrame()

# 데이터 로드 실행
load_data()

# ✅ 데이터 유효성 검사 함수
def validate_dataframe(df: pd.DataFrame, data_type: str):
    """데이터프레임이 비어있는지 확인"""
    if df.empty:
        raise HTTPException(status_code=503, detail=f"{data_type} data not available")
    return True

# ==================== CAR OWNERSHIP ENDPOINTS ====================

@app.get("/ownership", tags=["Car Ownership"])
def get_all_ownership():
    """모든 차량 소유권 데이터 반환"""
    validate_dataframe(ownership_df, "Car ownership")
    return ownership_df.to_dict(orient="records")

@app.get("/ownership/{state}", tags=["Car Ownership"])
def get_ownership_by_state(state: str):
    """특정 주의 차량 소유권 데이터 반환"""
    validate_dataframe(ownership_df, "Car ownership")
    
    data = ownership_df[ownership_df['State'].str.lower() == state.lower()]
    if data.empty:
        raise HTTPException(status_code=404, detail=f"No car ownership data found for state: {state}")
    return data.to_dict(orient="records")

@app.get("/ownership/{state}/{year}", tags=["Car Ownership"])
def get_ownership_by_state_year(state: str, year: int):
    """특정 주의 특정 연도 차량 소유권 데이터 반환"""
    validate_dataframe(ownership_df, "Car ownership")
    
    data = ownership_df[(ownership_df['State'].str.lower() == state.lower()) & (ownership_df['Year'] == year)]
    if data.empty:
        raise HTTPException(status_code=404, detail=f"No car ownership data found for {state} in {year}")
    return data.to_dict(orient="records")

# ==================== POPULATION ENDPOINTS ====================

@app.get("/population", tags=["Population"])
def get_all_population():
    """모든 인구 데이터 반환 (Melbourne CBD - Total 제외, 개별 지역만)"""
    try:
        validate_dataframe(population_df, "Population")
        
        # "Melbourne CBD - Total"을 제외하고 개별 지역만 반환
        filtered_df = population_df[population_df['region_name'] != 'Melbourne CBD - Total'].copy()
        
        # Frontend 친화적 region_name 변환
        filtered_df['display_name'] = filtered_df['region_name'].str.replace('Melbourne CBD - ', '')
        
        result = filtered_df.to_dict(orient="records")
        print(f"✅ Returning {len(result)} population records (excluding Total)")
        return result
    except Exception as e:
        print(f"❌ Error in get_all_population: {e}")
        raise HTTPException(status_code=500, detail=f"Population data processing error: {str(e)}")

@app.get("/population/{area}", tags=["Population"])
def get_population_by_area(area: str):
    """특정 지역의 인구 데이터 반환 (예: east, west, north, total)"""
    validate_dataframe(population_df, "Population")
    
    # 지역명 매핑 (total 추가)
    area_mapping = {
        'east': 'Melbourne CBD - East',
        'west': 'Melbourne CBD - West', 
        'north': 'Melbourne CBD - North',
        'total': 'Melbourne CBD - Total'  # 추가!
    }
    
    if area.lower() not in area_mapping:
        raise HTTPException(status_code=404, detail=f"Invalid area: {area}. Use: east, west, north, total")
    
    target_region = area_mapping[area.lower()]
    data = population_df[population_df['region_name'] == target_region].copy()
    
    if data.empty:
        raise HTTPException(status_code=404, detail=f"No population data found for area: {area}")
    
    # Frontend 친화적 display_name 추가
    data['display_name'] = data['region_name'].str.replace('Melbourne CBD - ', '')
    
    return data.to_dict(orient="records")

@app.get("/population/{area}/{year}", tags=["Population"])
def get_population_by_area_year(area: str, year: int):
    """특정 지역의 특정 연도 인구 데이터 반환"""
    validate_dataframe(population_df, "Population")
    
    # 지역명 매핑 (total 추가)
    area_mapping = {
        'east': 'Melbourne CBD - East',
        'west': 'Melbourne CBD - West',
        'north': 'Melbourne CBD - North',
        'total': 'Melbourne CBD - Total'
    }
    
    if area.lower() not in area_mapping:
        raise HTTPException(status_code=404, detail=f"Invalid area: {area}. Use: east, west, north, total")
    
    target_region = area_mapping[area.lower()]
    data = population_df[
        (population_df['region_name'] == target_region) & 
        (population_df['year'] == year)
    ].copy()
    
    if data.empty:
        raise HTTPException(status_code=404, detail=f"No population data found for {area} in {year}")
    
    # Frontend 친화적 display_name 추가
    data['display_name'] = data['region_name'].str.replace('Melbourne CBD - ', '')
    
    return data.to_dict(orient="records")

# ==================== UTILITY ENDPOINTS ====================

@app.get("/", tags=["General"])
def read_root():
    """API 정보 및 상태 확인"""
    return {
        "message": "Melbourne Mobility Insights API",
        "version": "2.0.0",
        "available_endpoints": {
            "car_ownership": ["/ownership", "/ownership/{state}", "/ownership/{state}/{year}"],
            "population": ["/population", "/population/{area}", "/population/{area}/{year}"]
        },
        "data_status": {
            "car_ownership_loaded": not ownership_df.empty,
            "population_loaded": not population_df.empty
        }
    }

@app.get("/health", tags=["General"])
def health_check():
    """서비스 상태 확인"""
    return {
        "status": "healthy",
        "car_ownership_records": len(ownership_df),
        "population_records": len(population_df)
    }
