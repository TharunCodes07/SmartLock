
# SmartLock Web

SmartLock Web is an IoT-based smart lock system with web client and server components, face recognition, and real-time communication features. This project integrates Python scripts for device control and machine learning, and a Next.js web client for user interaction and management.

## Features
- Smart lock control and monitoring
- Face recognition using a trained model
- Real-time signaling server for communication
- User authentication and profile management
- Camera and family member management
- Modern UI with Next.js and TypeScript
- Database integration with Prisma

## Project Structure
- **Python Scripts**: Device control, face recognition, signaling, watchdog, and database interaction
- **Next.js Web Client**: Located in `src/` and `public/` for UI and API routes
- **Prisma**: Database schema and integration

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.8+
- pip (for Python dependencies)
- (Optional) Docker for database

### Installation
1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```
2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   *(Create `requirements.txt` if not present, based on your Python scripts' imports)*
3. **Set up the database:**
   ```bash
   npx prisma migrate dev
   ```

### Running the Project
- **Start the Next.js web client:**
  ```bash
  npm run dev
  ```
- **Run Python scripts as needed:**
  ```bash
  python lock_system.py
  # or other scripts as required
  ```

## Folder Structure
- `src/` - Next.js app source code
- `public/` - Static assets
- `prisma/` - Prisma schema
- Python scripts at root for IoT and ML features

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
