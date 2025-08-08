from fastapi import FastAPI, HTTPException
import pandas as pd

app = FastAPI()

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
