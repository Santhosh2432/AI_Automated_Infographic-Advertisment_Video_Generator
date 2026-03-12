import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Get connection string from environment
# Format: mongodb://user:password@host:port/dbname or Azure Cosmos DB string
connection_string = os.getenv("MONGODB_CONNECTION_STRING")

if not connection_string:
    # Fallback to local MongoDB if no URL provided
    connection_string = "mongodb://localhost:27017/"

client = MongoClient(connection_string)
db = client.get_database("ai_automated_infographic_video_generator") # Matches your Compass DB
users_collection = db.get_collection("users")
videos_collection = db.get_collection("videos")

def get_users_collection():
    return users_collection

def get_videos_collection():
    return videos_collection
