from typing import List, Optional
from models import User, UserCreate, UserUpdate
from datetime import datetime

# In-memory database (list of dictionaries)
users_db: List[dict] = []
next_id = 1

def get_all_users() -> List[dict]:
    return users_db

def get_user_by_id(user_id: int) -> Optional[dict]:
    return next((user for user in users_db if user["id"] == user_id), None)

def create_user(user_data: UserCreate) -> dict:
    global next_id
    user = {
        "id": next_id,
        "name": user_data.name,
        "email": user_data.email,
        "age": user_data.age,
        "created_at": datetime.now()
    }
    users_db.append(user)
    next_id += 1
    return user

def update_user(user_id: int, user_data: UserUpdate) -> Optional[dict]:
    user = get_user_by_id(user_id)
    if user:
        if user_data.name is not None:
            user["name"] = user_data.name
        if user_data.email is not None:
            user["email"] = user_data.email
        if user_data.age is not None:
            user["age"] = user_data.age
        return user
    return None

def delete_user(user_id: int) -> bool:
    user = get_user_by_id(user_id)
    if user:
        users_db.remove(user)
        return True
    return False
