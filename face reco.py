import cv2
import numpy as np
from tensorflow.keras.models import load_model

# Load trained model
model = load_model("emotion_model.h5")

# Emotion labels
emotion_labels = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"]

# Initialize webcam
cap = cv2.VideoCapture(0)
face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)  # Convert to grayscale
    faces = face_detector.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)  # Detect faces

    for (x, y, w, h) in faces:
        face = gray[y:y+h, x:x+w]  # Extract face ROI
        face = cv2.resize(face, (48, 48)).reshape(1, 48, 48, 1) / 255.0  # Resize and normalize

        prediction = model.predict(face)
        emotion = emotion_labels[np.argmax(prediction)]  # Get predicted emotion

        # Draw rectangle and label
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(frame, emotion, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    cv2.imshow("Emotion Detection", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
