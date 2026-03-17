from pymongo import MongoClient
from backend.config import settings

# Get connection string from settings
connection_string = settings.MONGODB_CONNECTION_STRING

client = MongoClient(connection_string)
db = client.get_database("ai_automated_infographic_video_generator") # Matches your Compass DB
users_collection = db.get_collection("users")
videos_collection = db.get_collection("videos")

def get_users_collection():
    return users_collection

def get_videos_collection():
    return videos_collection
