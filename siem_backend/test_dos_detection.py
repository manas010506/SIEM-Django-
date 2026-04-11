"""
Script to test DoS detection - FIXED VERSION
"""

import requests
import time
from concurrent.futures import ThreadPoolExecutor

# Configuration
BASE_URL = 'http://localhost:8000'
NUM_REQUESTS = 150
NUM_THREADS = 10

def get_token():
    """Get JWT token first"""
    response = requests.post(
        f'{BASE_URL}/api/auth/login/',
        json={'username': 'admin', 'password': 'admin123'}
    )
    if response.status_code == 200:
        token = response.json()['access']
        print(f"✅ Login successful, got token")
        return token
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.json())
        return None

def make_request(args):
    """Make a single authenticated request"""
    i, token = args
    try:
        response = requests.get(
            f'{BASE_URL}/api/logs/',
            headers={'Authorization': f'Bearer {token}'},
            timeout=5
        )
        print(f"Request {i}: {response.status_code}")
        return response.status_code
    except Exception as e:
        print(f"Request {i} failed: {e}")
        return None

def test_dos_detection():
    print("🔥 Testing DoS Detection")
    print("=" * 60)

    # Step 1: Get token
    token = get_token()
    if not token:
        print("Cannot proceed without token!")
        return

    # Step 2: Rapid requests WITH token
    print(f"\nMaking {NUM_REQUESTS} rapid requests...")
    start_time = time.time()

    args = [(i, token) for i in range(NUM_REQUESTS)]
    with ThreadPoolExecutor(max_workers=NUM_THREADS) as executor:
        results = list(executor.map(make_request, args))

    duration = time.time() - start_time
    successful = sum(1 for r in results if r == 200)

    print("=" * 60)
    print(f"✅ Done in {duration:.2f} seconds")
    print(f"Successful (200): {successful}/{NUM_REQUESTS}")
    print(f"Requests/second: {NUM_REQUESTS/duration:.2f}")
    print("\n🔍 Check your SIEM dashboard now!")

if __name__ == '__main__':
    print("⚠️  WARNING: Only run on development server!")
    confirm = input("Continue? (yes/no): ")
    if confirm.lower() == 'yes':
        test_dos_detection()
    else:
        print("Test cancelled.")