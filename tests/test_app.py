from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_read_root():
    """Test that the root endpoint returns the index.html content"""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert b"<!DOCTYPE html>" in response.content

def test_get_activities():
    """Test that activities endpoint returns the activity list"""
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "Programming Class" in data
    assert all(key in data["Chess Club"] for key in ["description", "schedule", "max_participants", "participants"])

def test_signup_for_activity():
    """Test signing up for an activity"""
    activity_name = "Chess Club"
    email = "newstudent@mergington.edu"
    
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == f"Signed up {email} for {activity_name}"
    
    # Verify the student was added
    activities = client.get("/activities").json()
    assert email in activities[activity_name]["participants"]

def test_signup_duplicate():
    """Test that signing up twice fails"""
    activity_name = "Programming Class"
    email = "emma@mergington.edu"  # already registered
    
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]

def test_signup_nonexistent_activity():
    """Test signing up for a non-existent activity"""
    response = client.post("/activities/NonexistentClub/signup?email=student@mergington.edu")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_unregister_from_activity():
    """Test unregistering from an activity"""
    activity_name = "Chess Club"
    email = "daniel@mergington.edu"  # existing participant
    
    response = client.post(f"/activities/{activity_name}/unregister?email={email}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == f"Unregistered {email} from {activity_name}"
    
    # Verify the student was removed
    activities = client.get("/activities").json()
    assert email not in activities[activity_name]["participants"]

def test_unregister_not_registered():
    """Test unregistering when not registered"""
    activity_name = "Chess Club"
    email = "notregistered@mergington.edu"
    
    response = client.post(f"/activities/{activity_name}/unregister?email={email}")
    assert response.status_code == 400
    assert "not registered" in response.json()["detail"]

def test_unregister_nonexistent_activity():
    """Test unregistering from a non-existent activity"""
    response = client.post("/activities/NonexistentClub/unregister?email=student@mergington.edu")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]