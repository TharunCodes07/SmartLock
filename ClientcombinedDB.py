import cv2
import numpy as np
import face_recognition
import os
import smtplib
from email.message import EmailMessage
import datetime
import threading
import requests
from tensorflow.keras.models import load_model
from supabase import create_client, Client
from dotenv import load_dotenv
import asyncio
import websockets
import base64
import ssl
import sys

load_dotenv()

# === CONFIGURATION ===
CURRENT_USER_ID = os.getenv("USER_ID")
CAM_ID = os.getenv("CAM_ID")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
RECIPIENT_EMAIL = os.getenv("RECIPIENT_EMAIL")
cameraId=3
WSS_URI = f"wss://9aa5-2401-4900-4df9-ef18-a461-a1f3-1f3b-c908.ngrok-free.app/camera/{cameraId}"  # e.g. wss://your-ngrok-url/camera/CAM_ID

if not all([CURRENT_USER_ID, CAM_ID, SUPABASE_URL, SUPABASE_KEY, WSS_URI]):
    print("Missing one or more required environment variables.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
emotion_model = load_model("./emotion_model.h5")
emotion_labels = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"]

UNKNOWN_FACES_DIR = "./unknown_faces"
os.makedirs(UNKNOWN_FACES_DIR, exist_ok=True)
RESIZE_SCALE = 0.25
PROCESS_EVERY_N_FRAMES = 5
UNKNOWN_TOLERANCE = 0.5
lock_timer = None
camera_unlocked = False

# === FUNCTIONS ===
def load_known_faces():
    encodings, names = [], []
    response = supabase.table("Family").select("name,image").eq("userId", CURRENT_USER_ID).execute()
    for member in response.data:
        name, img_url = member["name"], member.get("image")
        if not img_url:
            continue
        try:
            resp = requests.get(img_url, stream=True)
            if resp.status_code == 200:
                arr = np.asarray(bytearray(resp.content), dtype=np.uint8)
                image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                enc = face_recognition.face_encodings(rgb)
                if enc:
                    encodings.append(enc[0])
                    names.append(name)
                    print(f"[INFO] Loaded {name}")
        except Exception as e:
            print(f"[ERROR] {name}: {e}")
    return encodings, names

def send_email_alert(image_path):
    def run():
        try:
            msg = EmailMessage()
            msg["Subject"] = "Unknown Face Detected"
            msg["From"] = EMAIL_ADDRESS
            msg["To"] = RECIPIENT_EMAIL
            msg.set_content("Security Alert: An unknown face has been detected.")
            with open(image_path, "rb") as f:
                msg.add_attachment(f.read(), maintype="image", subtype="jpeg", filename=os.path.basename(image_path))
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
                smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
                smtp.send_message(msg)
            print("[EMAIL] Alert sent.")
        except Exception as e:
            print(f"[EMAIL ERROR] {e}")
    threading.Thread(target=run).start()

def detect_emotion(image):
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, (48, 48)).reshape(1, 48, 48, 1) / 255.0
        pred = emotion_model.predict(gray, verbose=0)
        return emotion_labels[np.argmax(pred)]
    except:
        return "Unknown"

def create_info_panel(name, emotion, height):
    panel = np.zeros((height, 300, 3), dtype=np.uint8)
    cv2.putText(panel, "Face Information", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)
    cv2.putText(panel, f"Name: {name}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 1)
    cv2.putText(panel, f"Emotion: {emotion}", (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 1)
    return panel

def lock_camera():
    global camera_unlocked
    supabase.table("Camera").update({"status": "Locked"}).eq("id", CAM_ID).execute()
    print(f"[CAMERA] Camera {CAM_ID} locked.")
    camera_unlocked = False

# === MAIN VIDEO LOOP ===
async def main():
    global lock_timer, camera_unlocked
    known_face_encodings, known_face_names = load_known_faces()
    print(f"[INFO] {len(known_face_encodings)} known faces loaded.")

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    if not cap.isOpened():
        print("[ERROR] Cannot open camera.")
        return

    saved_unknowns = []
    frame_count = 0

    ssl_context = ssl._create_unverified_context()

    async with websockets.connect(
        WSS_URI,
        ssl=ssl_context,
        ping_interval=30,     # ping every 30 seconds
        ping_timeout=30,      # wait 30 seconds for pong
        close_timeout=5       # timeout for close
    ) as websocket:
        print("[WSS] Connected to WebSocket")

        while True:
            ret, frame = cap.read()
            if not ret:
                print("[ERROR] Frame capture failed.")
                break

            # Send to WebSocket
            _, buffer = cv2.imencode('.jpg', frame)
            await websocket.send(base64.b64encode(buffer).decode('utf-8'))

            # Face detection logic
            display_frame = frame.copy()
            info_panel = create_info_panel("No face", "None", frame.shape[0])

            if frame_count % PROCESS_EVERY_N_FRAMES == 0:
                small = cv2.resize(frame, (0,0), fx=RESIZE_SCALE, fy=RESIZE_SCALE)
                rgb_small = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
                face_locations = face_recognition.face_locations(rgb_small)
                face_encodings = face_recognition.face_encodings(rgb_small, face_locations)

                for encoding, (top, right, bottom, left) in zip(face_encodings, face_locations):
                    name = "Unknown"
                    emotion = "Unknown"

                    matches = face_recognition.compare_faces(known_face_encodings, encoding)
                    face_distances = face_recognition.face_distance(known_face_encodings, encoding)

                    if matches and matches[np.argmin(face_distances)]:
                        best = np.argmin(face_distances)
                        name = known_face_names[best]

                        if not camera_unlocked:
                            supabase.table("Camera").update({"status": "Unlocked"}).eq("id", CAM_ID).execute()
                            print(f"[CAMERA] {CAM_ID} unlocked")
                            camera_unlocked = True

                        if lock_timer:
                            lock_timer.cancel()
                        lock_timer = threading.Timer(15, lock_camera)
                        lock_timer.start()

                        # Emotion detection
                        t, r, b, l = [int(coord / RESIZE_SCALE) for coord in (top, right, bottom, left)]
                        face_img = frame[t:b, l:r]
                        emotion = detect_emotion(face_img)
                        if(emotion != "Neutral"):
                            res = supabase.table("Family").select("*").eq("name", name).eq("userId", CURRENT_USER_ID).limit(1).execute()
                            user_id = res.data[0]["id"]
                            supabase.table("Family").update({"emotion": emotion}).eq("id", user_id).execute()
                            print(f"[EMOTION] {name} updated to {emotion}")
                    else:
                        if all(not face_recognition.compare_faces([s], encoding, tolerance=UNKNOWN_TOLERANCE)[0] for s in saved_unknowns):
                            t, r, b, l = [int(coord / RESIZE_SCALE) for coord in (top, right, bottom, left)]
                            unknown_img = frame[t:b, l:r]
                            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                            path = os.path.join(UNKNOWN_FACES_DIR, f"unknown_{ts}.jpg")
                            cv2.imwrite(path, unknown_img)
                            saved_unknowns.append(encoding)
                            send_email_alert(path)

                    t, r, b, l = [int(coord / RESIZE_SCALE) for coord in (top, right, bottom, left)]
                    color = (0,255,0) if name != "Unknown" else (0,0,255)
                    cv2.rectangle(display_frame, (l, t), (r, b), color, 2)
                    label = f"{name}: {emotion}" if name != "Unknown" else name
                    cv2.putText(display_frame, label, (l+6, b-6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)
                    info_panel = create_info_panel(name, emotion, frame.shape[0])

            cv2.imshow("Face Recognition & Emotion Detection", np.hstack((display_frame, info_panel)))
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

            frame_count += 1

    cap.release()
    cv2.destroyAllWindows()

async def run_forever():
    while True:
        try:
            await main()
            print("[WSS] Reconnecting...")
        except websockets.exceptions.ConnectionClosedError as e:
            print(f"[WSS] Connection closed: {e}. Reconnecting in 5s...")
            await asyncio.sleep(5)
        except Exception as e:
            print(f"[WSS] Unexpected error: {e}. Retrying in 5s...")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(run_forever())