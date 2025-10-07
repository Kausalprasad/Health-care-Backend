# import asyncio, json, base64
# import websockets
# import cv2, numpy as np
# import torch
# from torchvision import transforms
# import mediapipe as mp

# MODEL_PATH = "C:/Users/Kaushal/Desktop/projects/Health-Care/health-app-backend/health-app-backend/python/models/melanoma/skin_malanom.pt"
# CLASS_NAMES = ["Benign", "Indeterminate", "Malignant"]

# print("📥 Loading model:", MODEL_PATH)
# try:
#     model = torch.jit.load(MODEL_PATH, map_location="cpu")
#     model.eval()
#     print("✅ Model loaded successfully")
# except Exception as e:
#     print("❌ Model load error:", e)
#     raise

# # Preprocessing
# transform = transforms.Compose([
#     transforms.ToPILImage(),
#     transforms.Resize((224, 224)),
#     transforms.ToTensor()
# ])

# # Initialize MediaPipe with DENSE settings
# print("🔧 Initializing MediaPipe for DENSE MESH...")
# mp_face_mesh = mp.solutions.face_mesh
# mp_hands = mp.solutions.hands
# mp_pose = mp.solutions.pose

# # OPTIMIZED face mesh - better detection
# face_mesh = mp_face_mesh.FaceMesh(
#     max_num_faces=1,
#     refine_landmarks=True,
#     min_detection_confidence=0.3,    # Lower for better detection
#     min_tracking_confidence=0.3      # Lower for smoother tracking
# )

# hands = mp_hands.Hands(
#     static_image_mode=False,
#     max_num_hands=2,
#     min_detection_confidence=0.7,
#     min_tracking_confidence=0.5
# )

# pose = mp_pose.Pose(
#     static_image_mode=False,
#     model_complexity=1,
#     smooth_landmarks=True,
#     min_detection_confidence=0.7,
#     min_tracking_confidence=0.5
# )
# print("✅ MediaPipe initialized for DENSE WHITE MESH")

# def get_dense_face_connections():
#     """Get MAXIMUM connections for dense white mesh"""
#     connections = []
    
#     try:
#         # 1. TESSELLATION - Most dense connections (triangular mesh)
#         if hasattr(mp_face_mesh, 'FACEMESH_TESSELATION'):
#             for connection in mp_face_mesh.FACEMESH_TESSELATION:
#                 connections.append([connection[0], connection[1]])
#         elif hasattr(mp_face_mesh, 'FACEMESH_TESSELLATION'):
#             for connection in mp_face_mesh.FACEMESH_TESSELLATION:
#                 connections.append([connection[0], connection[1]])
        
#         # 2. ALL other mesh connections
#         mesh_sets = [
#             'FACEMESH_CONTOURS',
#             'FACEMESH_FACE_OVAL', 
#             'FACEMESH_LEFT_EYE',
#             'FACEMESH_RIGHT_EYE',
#             'FACEMESH_LEFT_EYEBROW',
#             'FACEMESH_RIGHT_EYEBROW',
#             'FACEMESH_LIPS',
#             'FACEMESH_LEFT_IRIS',
#             'FACEMESH_RIGHT_IRIS'
#         ]
        
#         for mesh_name in mesh_sets:
#             if hasattr(mp_face_mesh, mesh_name):
#                 mesh_connections = getattr(mp_face_mesh, mesh_name)
#                 for connection in mesh_connections:
#                     connections.append([connection[0], connection[1]])
        
#         print(f"✅ Got {len(connections)} MediaPipe connections")
        
#     except Exception as e:
#         print(f"⚠️ MediaPipe connections error: {e}")
    
#     # 3. FALLBACK: Manual dense connections if MediaPipe fails
#     if len(connections) < 100:  # If we don't have enough connections
#         print("🔧 Adding manual dense connections...")
        
#         # Dense manual connections for 468 landmarks
#         manual_connections = []
        
#         # Connect nearby points (distance-based dense mesh)
#         for i in range(468):
#             for j in range(i + 1, min(i + 20, 468)):  # Connect to next 20 points
#                 manual_connections.append([i, j])
        
#         # Additional patterns for density
#         for i in range(0, 468, 3):  # Every 3rd point
#             for j in range(i + 1, min(i + 10, 468)):
#                 manual_connections.append([i, j])
        
#         connections.extend(manual_connections[:1000])  # Add up to 1000 connections
#         print(f"🔧 Added {len(manual_connections[:1000])} manual connections")
    
#     # Remove duplicates
#     unique_connections = []
#     seen = set()
#     for conn in connections:
#         key = tuple(sorted(conn))
#         if key not in seen:
#             seen.add(key)
#             unique_connections.append(conn)
    
#     print(f"🎯 Final connections: {len(unique_connections)}")
#     return unique_connections

# def extract_landmarks(rgb_frame):
#     """Extract ALL MediaPipe landmarks with DENSE face connections"""
#     landmarks_data = {
#         'face': [],
#         'hands': [],
#         'pose': [],
#         'face_connections': []
#     }
    
#     try:
#         # Face landmarks - Get ALL 468 points
#         face_results = face_mesh.process(rgb_frame)
#         if face_results.multi_face_landmarks:
#             for face_landmarks in face_results.multi_face_landmarks:
#                 # Get ALL 468 face landmarks
#                 face_points = []
#                 for landmark in face_landmarks.landmark:
#                     face_points.append({
#                         'x': landmark.x,
#                         'y': landmark.y,
#                         'z': landmark.z if hasattr(landmark, 'z') else 0
#                     })
#                 landmarks_data['face'] = face_points
                
#                 # Get DENSE connections
#                 landmarks_data['face_connections'] = get_dense_face_connections()
                
#                 print(f"🔴 Face: {len(face_points)} points, {len(landmarks_data['face_connections'])} connections")
        
#         # Hand landmarks
#         hand_results = hands.process(rgb_frame)
#         if hand_results.multi_hand_landmarks:
#             hands_list = []
#             for hand_landmarks in hand_results.multi_hand_landmarks:
#                 hand_points = []
#                 for landmark in hand_landmarks.landmark:
#                     hand_points.append({
#                         'x': landmark.x,
#                         'y': landmark.y,
#                         'z': landmark.z if hasattr(landmark, 'z') else 0
#                     })
#                 hands_list.append(hand_points)
#             landmarks_data['hands'] = hands_list
        
#         # Pose landmarks
#         pose_results = pose.process(rgb_frame)
#         if pose_results.pose_landmarks:
#             pose_points = []
#             for landmark in pose_results.pose_landmarks.landmark:
#                 pose_points.append({
#                     'x': landmark.x,
#                     'y': landmark.y,
#                     'z': landmark.z if hasattr(landmark, 'z') else 0
#                 })
#             landmarks_data['pose'] = pose_points
            
#     except Exception as e:
#         print(f"⚠️ Landmarks extraction error: {e}")
    
#     return landmarks_data

# async def handle(ws):
#     print("🔌 Client connected")
#     try:
#         async for message in ws:
#             try:
#                 # Parse message
#                 if message.startswith('{'):
#                     data = json.loads(message)
#                     base64_image = data.get('image', '')
#                     return_landmarks = data.get('return_landmarks', False)
#                 else:
#                     base64_image = message
#                     return_landmarks = True
                
#                 if not base64_image:
#                     continue
                
#                 # Decode image
#                 img_data = base64.b64decode(base64_image)
#                 np_arr = np.frombuffer(img_data, np.uint8)
#                 bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

#                 if bgr is None:
#                     await ws.send(json.dumps({"error": "decode_failed"}))
#                     continue

#                 rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
                
#                 # Get prediction
#                 inp = transform(rgb).unsqueeze(0)
#                 with torch.no_grad():
#                     out = model(inp)
#                     probs = torch.softmax(out, dim=1)[0].cpu().numpy()
#                     pred_idx = int(np.argmax(probs))
#                     conf = float(probs[pred_idx])

#                 # Prepare response
#                 resp = {
#                     "prediction": CLASS_NAMES[pred_idx],
#                     "confidence": round(conf, 4)
#                 }
                
#                 # Add DENSE landmarks
#                 if return_landmarks:
#                     landmarks = extract_landmarks(rgb)
#                     resp['landmarks'] = landmarks
                    
#                     # Debug info
#                     face_count = len(landmarks['face'])
#                     hands_count = len(landmarks['hands'])
#                     pose_count = len(landmarks['pose'])
#                     connections_count = len(landmarks['face_connections'])
#                     print(f"📊 {CLASS_NAMES[pred_idx]} ({conf:.1%}) + DENSE MESH: {face_count} face, {connections_count} connections, {hands_count} hands, {pose_count} pose")
#                 else:
#                     print(f"📊 {CLASS_NAMES[pred_idx]} ({conf:.1%}) - no landmarks")

#                 await ws.send(json.dumps(resp))
                
#             except json.JSONDecodeError:
#                 print("❌ Invalid JSON received")
#                 await ws.send(json.dumps({"error": "invalid_json"}))
#             except Exception as e:
#                 print(f"❌ Processing error: {e}")
#                 await ws.send(json.dumps({"error": str(e)}))
#     finally:
#         print("🔌 Client disconnected")

# async def main():
#     print("🚀 DENSE WHITE FACE MESH WebSocket Server: ws://0.0.0.0:8080")
#     print("🔥 Maximum density face mesh with WHITE CHAIN EFFECT!")
#     async with websockets.serve(handle, "0.0.0.0", 8080, max_size=4_000_000):
#         await asyncio.Future()

# if __name__ == "__main__":
#     asyncio.run(main())



import asyncio, json, base64
import websockets
import cv2, numpy as np
import torch
from torchvision import transforms
import mediapipe as mp

MODEL_PATH = "C:/Users/Kaushal/Desktop/projects/Health-Care/health-app-backend/health-app-backend/python/models/melanoma/skin_malanom.pt"
CLASS_NAMES = ["Benign", "Indeterminate", "Malignant"]

print("📥 Loading model:", MODEL_PATH)
try:
    model = torch.jit.load(MODEL_PATH, map_location="cpu")
    model.eval()
    print("✅ Model loaded successfully")
except Exception as e:
    print("❌ Model load error:", e)
    raise

# Preprocessing
transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

# Initialize MediaPipe with DENSE settings
print("🔧 Initializing MediaPipe for DENSE MESH...")
mp_face_mesh = mp.solutions.face_mesh
mp_hands = mp.solutions.hands
mp_pose = mp.solutions.pose

# MAXIMUM DETAIL face mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,  # Get ALL 468 landmarks
    min_detection_confidence=0.5,  # Lower for better detection
    min_tracking_confidence=0.4
)

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5
)

pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    smooth_landmarks=True,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5
)
print("✅ MediaPipe initialized for DENSE WHITE MESH")

def get_dense_face_connections():
    """Get MAXIMUM connections for dense white mesh"""
    connections = []
    
    try:
        # 1. TESSELLATION - Most dense connections (triangular mesh)
        if hasattr(mp_face_mesh, 'FACEMESH_TESSELATION'):
            for connection in mp_face_mesh.FACEMESH_TESSELATION:
                connections.append([connection[0], connection[1]])
        elif hasattr(mp_face_mesh, 'FACEMESH_TESSELLATION'):
            for connection in mp_face_mesh.FACEMESH_TESSELLATION:
                connections.append([connection[0], connection[1]])
        
        # 2. ALL other mesh connections
        mesh_sets = [
            'FACEMESH_CONTOURS',
            'FACEMESH_FACE_OVAL', 
            'FACEMESH_LEFT_EYE',
            'FACEMESH_RIGHT_EYE',
            'FACEMESH_LEFT_EYEBROW',
            'FACEMESH_RIGHT_EYEBROW',
            'FACEMESH_LIPS',
            'FACEMESH_LEFT_IRIS',
            'FACEMESH_RIGHT_IRIS'
        ]
        
        for mesh_name in mesh_sets:
            if hasattr(mp_face_mesh, mesh_name):
                mesh_connections = getattr(mp_face_mesh, mesh_name)
                for connection in mesh_connections:
                    connections.append([connection[0], connection[1]])
        
        print(f"✅ Got {len(connections)} MediaPipe connections")
        
    except Exception as e:
        print(f"⚠️ MediaPipe connections error: {e}")
    
    # 3. FALLBACK: Manual dense connections if MediaPipe fails
    if len(connections) < 100:  # If we don't have enough connections
        print("🔧 Adding manual dense connections...")
        
        # Dense manual connections for 468 landmarks
        manual_connections = []
        
        # Connect nearby points (distance-based dense mesh)
        for i in range(468):
            for j in range(i + 1, min(i + 20, 468)):  # Connect to next 20 points
                manual_connections.append([i, j])
        
        # Additional patterns for density
        for i in range(0, 468, 3):  # Every 3rd point
            for j in range(i + 1, min(i + 10, 468)):
                manual_connections.append([i, j])
        
        connections.extend(manual_connections[:1000])  # Add up to 1000 connections
        print(f"🔧 Added {len(manual_connections[:1000])} manual connections")
    
    # Remove duplicates
    unique_connections = []
    seen = set()
    for conn in connections:
        key = tuple(sorted(conn))
        if key not in seen:
            seen.add(key)
            unique_connections.append(conn)
    
    print(f"🎯 Final connections: {len(unique_connections)}")
    return unique_connections

def extract_landmarks(rgb_frame):
    """Extract ALL MediaPipe landmarks with DENSE face connections"""
    landmarks_data = {
        'face': [],
        'hands': [],
        'pose': [],
        'face_connections': []
    }
    
    try:
        # Face landmarks - Get ALL 468 points
        face_results = face_mesh.process(rgb_frame)
        if face_results.multi_face_landmarks:
            for face_landmarks in face_results.multi_face_landmarks:
                # Get ALL 468 face landmarks
                face_points = []
                for landmark in face_landmarks.landmark:
                    face_points.append({
                        'x': landmark.x,
                        'y': landmark.y,
                        'z': landmark.z if hasattr(landmark, 'z') else 0
                    })
                landmarks_data['face'] = face_points
                
                # Get DENSE connections
                landmarks_data['face_connections'] = get_dense_face_connections()
                
                print(f"🔴 Face: {len(face_points)} points, {len(landmarks_data['face_connections'])} connections")
        
        # Hand landmarks
        hand_results = hands.process(rgb_frame)
        if hand_results.multi_hand_landmarks:
            hands_list = []
            for hand_landmarks in hand_results.multi_hand_landmarks:
                hand_points = []
                for landmark in hand_landmarks.landmark:
                    hand_points.append({
                        'x': landmark.x,
                        'y': landmark.y,
                        'z': landmark.z if hasattr(landmark, 'z') else 0
                    })
                hands_list.append(hand_points)
            landmarks_data['hands'] = hands_list
        
        # Pose landmarks
        pose_results = pose.process(rgb_frame)
        if pose_results.pose_landmarks:
            pose_points = []
            for landmark in pose_results.pose_landmarks.landmark:
                pose_points.append({
                    'x': landmark.x,
                    'y': landmark.y,
                    'z': landmark.z if hasattr(landmark, 'z') else 0
                })
            landmarks_data['pose'] = pose_points
            
    except Exception as e:
        print(f"⚠️ Landmarks extraction error: {e}")
    
    return landmarks_data

async def handle(ws):
    print("🔌 Client connected")
    try:
        async for message in ws:
            try:
                # Parse message
                if message.startswith('{'):
                    data = json.loads(message)
                    base64_image = data.get('image', '')
                    return_landmarks = data.get('return_landmarks', False)
                else:
                    base64_image = message
                    return_landmarks = True
                
                if not base64_image:
                    continue
                
                # Decode image
                img_data = base64.b64decode(base64_image)
                np_arr = np.frombuffer(img_data, np.uint8)
                bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                if bgr is None:
                    await ws.send(json.dumps({"error": "decode_failed"}))
                    continue

                rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
                
                # Get prediction
                inp = transform(rgb).unsqueeze(0)
                with torch.no_grad():
                    out = model(inp)
                    probs = torch.softmax(out, dim=1)[0].cpu().numpy()
                    pred_idx = int(np.argmax(probs))
                    conf = float(probs[pred_idx])

                # Prepare response
                resp = {
                    "prediction": CLASS_NAMES[pred_idx],
                    "confidence": round(conf, 4)
                }
                
                # Add DENSE landmarks
                if return_landmarks:
                    landmarks = extract_landmarks(rgb)
                    resp['landmarks'] = landmarks
                    
                    # Debug info
                    face_count = len(landmarks['face'])
                    hands_count = len(landmarks['hands'])
                    pose_count = len(landmarks['pose'])
                    connections_count = len(landmarks['face_connections'])
                    print(f"📊 {CLASS_NAMES[pred_idx]} ({conf:.1%}) + DENSE MESH: {face_count} face, {connections_count} connections, {hands_count} hands, {pose_count} pose")
                else:
                    print(f"📊 {CLASS_NAMES[pred_idx]} ({conf:.1%}) - no landmarks")

                await ws.send(json.dumps(resp))
                
            except json.JSONDecodeError:
                print("❌ Invalid JSON received")
                await ws.send(json.dumps({"error": "invalid_json"}))
            except Exception as e:
                print(f"❌ Processing error: {e}")
                await ws.send(json.dumps({"error": str(e)}))
    finally:
        print("🔌 Client disconnected")

async def main():
    print("🚀 DENSE WHITE FACE MESH WebSocket Server: ws://0.0.0.0:8080")
    print("🔥 Maximum density face mesh with WHITE CHAIN EFFECT!")
    async with websockets.serve(handle, "0.0.0.0", 8080, max_size=4_000_000):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())