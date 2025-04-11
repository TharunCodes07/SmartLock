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
import sys
import websockets
import asyncio
import base64
import ssl
import queue

# Load environment variables
load_dotenv()

# Get USER_ID and cam_id from environment
CURRENT_USER_ID = os.getenv("USER_ID")
if CURRENT_USER_ID is None:
    print("No USER_ID provided.")
    sys.exit(1)

cam_id = os.getenv("cam_id")
if cam_id is None:
    print("No cam_id provided.")
    sys.exit(1)

# Supabase setup
url = "https://tfrzjfhvdcytuyxbxfhq.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcnpqZmh2ZGN5dHV5eGJ4ZmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNjAxMTYsImV4cCI6MjA1OTkzNjExNn0.Xo2D1OlmeHTX_yXaBl8MmFglRxEY1IDTT5R-gqyKhyQ"
supabase: Client = create_client(url, key)

# Emotion detection model
emotion_model = load_model("./emotion_model.h5")
emotion_labels = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"]
face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# Directories and constants
UNKNOWN_FACES_DIR = "./unknown_faces"
os.makedirs(UNKNOWN_FACES_DIR, exist_ok=True)
RESIZE_SCALE = 0.25
PROCESS_EVERY_N_FRAMES = 5
UNKNOWN_TOLERANCE = 0.5
EMAIL_ADDRESS = "suganthk2005@gmail.com"
EMAIL_PASSWORD = "faou eenk vswm eqan"
RECIPIENT_EMAIL = "suganthsowhan@gmail.com"

# Queue for frames to be sent over WebSocket
frame_queue = queue.Queue(maxsize=10)

# Lock for thread-safe access to known faces
known_faces_lock = threading.Lock()

# Global variables for known faces
known_face_encodings = []
known_face_names = []

# Define a unique camera ID for WebSocket (distinct from cam_id)
cameraId = "1"  # This is the camera's identifier for streaming, not the database ID

def load_known_faces_from_supabase():
    """Fetch face image URLs from Supabase and encode them"""
    global known_face_encodings, known_face_names
    new_encodings = []
    new_names = []
    response = supabase.table("Family").select("name,image").eq("userId", CURRENT_USER_ID).execute()
    if not response.data:
        print("No users found in Supabase.")
    else:
        for user in response.data:
            name = user["name"]
            image_url = user.get("image")
            if not image_url:
                continue
            try:
                resp = requests.get(image_url, stream=True)
                if resp.status_code == 200:
                    img_array = np.asarray(bytearray(resp.content), dtype=np.uint8)
                    image = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                    encodings = face_recognition.face_encodings(rgb_image)
                    if encodings:
                        new_encodings.append(encodings[0])
                        new_names.append(name)
                        print(f"Loaded {name} from Cloudinary")
                    else:
                        print(f"No face detected for {name}")
                else:
                    print(f"Failed to fetch image for {name}")
            except Exception as e:
                print(f"Error loading image for {name}: {e}")
    with known_faces_lock:
        known_face_encodings = new_encodings
        known_face_names = new_names

def get_family_ids():
    """Retrieve current family member IDs from Supabase"""
    res = supabase.table("Family").select("id").eq("userId", CURRENT_USER_ID).execute()
    return set(row["id"] for row in res.data)

def monitor_family_table():
    """Monitor Family table for new members and reload known faces"""
    last_ids = get_family_ids()
    while True:
        time.sleep(10)  # Check every 10 seconds
        current_ids = get_family_ids()
        if current_ids != last_ids:
            print("New family member detected! Reloading known faces...")
            load_known_faces_from_supabase()
            last_ids = current_ids

def send_email_alert(image_path):
    """Send email with the unknown face image in a separate thread"""
    def send_email():
        try:
            msg = EmailMessage()
            msg['Subject'] = 'Unknown Face Detected'
            msg['From'] = EMAIL_ADDRESS
            msg['To'] = RECIPIENT_EMAIL
            msg.set_content('Security Alert: An unknown face has been detected.')
            with open(image_path, 'rb') as f:
                img_data = f.read()
                msg.add_attachment(img_data, maintype='image', subtype='jpeg',
                                   filename=os.path.basename(image_path))
            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
                smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
                smtp.send_message(msg)
            print(f"Alert sent to {RECIPIENT_EMAIL}")
        except Exception as e:
            print(f"Failed to send email: {e}")
    email_thread = threading.Thread(target=send_email)
    email_thread.start()

def detect_emotion(face_image):
    """Detect emotion from a face image (only for known faces)"""
    try:
        gray_face = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        gray_face = cv2.resize(gray_face, (48, 48))
        gray_face = gray_face.reshape(1, 48, 48, 1) / 255.0
        prediction = emotion_model.predict(gray_face, verbose=0)
        return emotion_labels[np.argmax(prediction)]
    except Exception as e:
        print(f"Emotion detection error: {e}")
        return "Unknown"

def create_info_panel(name, emotion, width=300, height=480):
    """Create a side panel with face information"""
    panel = np.zeros((height, width, 3), dtype=np.uint8)
    cv2.putText(panel, "Face Information", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(panel, f"Name: {name}", (10, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
    cv2.putText(panel, f"Emotion: {emotion}", (10, 110),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
    return panel

async def send_video(uri, frame_queue):
    """Send video frames over WebSocket from the queue"""
    ssl_context = ssl._create_unverified_context()
    try:
        async with websockets.connect(uri, ssl=ssl_context) as websocket:
            print("[Client] Connected to server")
            while True:
                try:
                    frame = frame_queue.get(timeout=1)  # Wait up to 1 second for a frame
                    _, buffer = cv2.imencode('.jpg', frame)
                    jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                    await websocket.send(jpg_as_text)
                    await asyncio.sleep(0.1)  # Control frame rate
                except queue.Empty:
                    continue
                except Exception as e:
                    print(f"[Client] Error: {e}")
                    break
    except Exception as e:
        print(f"[Client] Connection error: {e}")

def websocket_thread_func(uri, frame_queue):
    """Run the WebSocket event loop in a separate thread"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(send_video(uri, frame_queue))
    loop.run_forever()

def main():
    # Initial load of known faces
    print("Loading known faces from Supabase...")
    load_known_faces_from_supabase()
    print(f"{len(known_face_encodings)} known faces loaded.")

    # Start monitoring thread for family table changes
    monitor_thread = threading.Thread(target=monitor_family_table)
    monitor_thread.daemon = True  # Thread will terminate when main thread does
    monitor_thread.start()

    # Set up WebSocket URI with cameraId (distinct from cam_id)
    uri = f"wss://ef7a-2401-4900-6337-aaef-e90f-bb90-6966-59b6.ngrok-free.app/camera/{cameraId}"
    
    # Start WebSocket thread
    websocket_thread = threading.Thread(target=websocket_thread_func, args=(uri, frame_queue))
    websocket_thread.daemon = True  # Thread will terminate when main thread does
    websocket_thread.start()

    # Initialize video capture
    video_capture = cv2.VideoCapture(0)
    if not video_capture.isOpened():
        print("Error: Could not open camera")
        sys.exit(1)
    video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    print("Starting real-time face recognition and streaming. Press 'q' to quit...")
    saved_unknown_encodings = []
    frame_count = 0
    last_face_locations = []
    last_names = []
    last_emotions = []

    while True:
        ret, frame = video_capture.read()
        if not ret:
            print("Error: Failed to capture frame")
            break

        # Add frame to queue for WebSocket streaming
        if not frame_queue.full():
            frame_queue.put(frame)

        # Prepare display frame
        display_frame = frame.copy()
        info_panel = create_info_panel("No face detected", "None", height=frame.shape[0])

        # Display last detected faces
        for (top, right, bottom, left), name, emotion in zip(last_face_locations, last_names, last_emotions):
            color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
            cv2.rectangle(display_frame, (left, top), (right, bottom), color, 2)
            label = f"{name}: {emotion}" if name != "Unknown" else name
            cv2.rectangle(display_frame, (left, bottom - 25), (right, bottom), color, cv2.FILLED)
            cv2.putText(display_frame, label, (left + 6, bottom - 6),
                        cv2.FONT_HERSHEY_DUPLEX, 0.5, (255, 255, 255), 1)
            if name != "Unknown":
                info_panel = create_info_panel(name, emotion, height=frame.shape[0])

        combined_frame = np.hstack((display_frame, info_panel))
        cv2.imshow('Face Recognition & Emotion Detection', combined_frame)

        # Process frames for face recognition every N frames
        if frame_count % PROCESS_EVERY_N_FRAMES == 0:
            small_frame = cv2.resize(frame, (0, 0), fx=RESIZE_SCALE, fy=RESIZE_SCALE)
            rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
            face_locations = face_recognition.face_locations(rgb_small_frame)

            last_face_locations = []
            last_names = []
            last_emotions = []

            if face_locations:
                face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
                for face_encoding, (top, right, bottom, left) in zip(face_encodings, face_locations):
                    with known_faces_lock:
                        matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
                        face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
                    name = "Unknown"
                    emotion = "Unknown"

                    if len(face_distances) > 0 and matches[np.argmin(face_distances)]:
                        best_match_index = np.argmin(face_distances)
                        with known_faces_lock:
                            name = known_face_names[best_match_index]
                        
                        # Update camera status in Supabase using cam_id
                        supabase.table("Camera").update({"status": "Unlocked"}).eq("id", cam_id).execute()
                        print(f"[CAMERA] Camera {cam_id} unlocked.")
                        def lock_camera():
                            supabase.table("Camera").update({"status": "Locked"}).eq("id", cam_id).execute()
                            print(f"[CAMERA] Camera {cam_id} locked again.")
                        threading.Timer(15, lock_camera).start()

                        # Detect emotion for known face
                        top_full, right_full, bottom_full, left_full = [int(coord / RESIZE_SCALE) for coord in (top, right, bottom, left)]
                        face_image = frame[top_full:bottom_full, left_full:right_full]
                        emotion = detect_emotion(face_image)

                        # Update emotion in Supabase if applicable
                        if emotion in ['Angry', 'Fear', 'Sad']:
                            user_res = supabase.table("Family").select("*").eq("name", name).eq("userId", CURRENT_USER_ID).limit(1).execute()
                            if user_res.data:
                                user_id = user_res.data[0]["id"]
                                current_emotion = user_res.data[0].get("emotion")
                                if current_emotion != emotion:
                                    supabase.table("Family").update({"emotion": emotion}).eq("id", user_id).execute()
                                    print(f"[UPDATE] {name}: {current_emotion} → {emotion}")
                    else:
                        # Handle unknown face
                        is_new_face = all(
                            not face_recognition.compare_faces([saved], face_encoding, tolerance=UNKNOWN_TOLERANCE)[0]
                            for saved in saved_unknown_encodings
                        )
                        if is_new_face:
                            top_full, right_full, bottom_full, left_full = [int(coord / RESIZE_SCALE) for coord in (top, right, bottom, left)]
                            unknown_face = frame[top_full:bottom_full, left_full:right_full]
                            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                            filename = f"unknown_{timestamp}.jpg"
                            filepath = os.path.join(UNKNOWN_FACES_DIR, filename)
                            cv2.imwrite(filepath, unknown_face)
                            saved_unknown_encodings.append(face_encoding)
                            send_email_alert(filepath)

                    # Store for display
                    top, right, bottom, left = [int(coord / RESIZE_SCALE) for coord in (top, right, bottom, left)]
                    last_face_locations.append((top, right, bottom, left))
                    last_names.append(name)
                    last_emotions.append(emotion)

        frame_count += 1
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    video_capture.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()