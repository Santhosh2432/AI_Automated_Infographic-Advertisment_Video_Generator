import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

def test_connection():
    connection_string = os.getenv("MONGODB_CONNECTION_STRING")
    print(f"Testing connection to: {connection_string}")
    
    try:
        client = MongoClient(connection_string, serverSelectionTimeoutMS=5000)
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        print("Success: MongoDB is connected!")
    except Exception as e:
        print(f" Error: Could not connect to MongoDB. {e}")
        print("\nPossible issues:")
        print("1. pymongo is not installed (run: pip install pymongo)")
        print("2. MONGODB_CONNECTION_STRING in .env is incorrect")
        print("3. MongoDB service is not running locally")
        print("4. Firewall/Network rules are blocking the connection to Azure")

if __name__ == "__main__":
    test_connection()
