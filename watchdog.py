# watchdog.py
import subprocess as sp
import time
from supabase import create_client, Client
import os
# Supabase setup
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)
# Logged-in user ID
CURRENT_USER_ID = os.getenv("USER_ID")

def get_family_ids():
    res = supabase.table("Family").select("id").eq("userId", CURRENT_USER_ID).execute()
    return set(row["id"] for row in res.data)

def main():
    process = sp.Popen(["python", "ClientcombinedDB.py", CURRENT_USER_ID])
    print("[WATCHDOG] Face recognition started.")

    last_ids = get_family_ids()
    try:
        while True:
            time.sleep(10)

            current_ids = get_family_ids()
            if current_ids != last_ids:
                print("[WATCHDOG] New family member detected! Restarting system...")

                process.terminate()
                process.wait()
                print("[WATCHDOG] Process terminated.")

                process = sp.Popen(["python", "ClientcombinedDB.py", CURRENT_USER_ID])
                print("[WATCHDOG] Face recognition restarted.")
                last_ids = current_ids

    except KeyboardInterrupt:
        print("[WATCHDOG] Stopping...")
        process.terminate()

if __name__ == "__main__":
    main()