"""
Backend API tests for Share Design functionality
Tests POST /api/share and GET /api/shared/{share_id} endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://design-quoting.preview.emergentagent.com').rstrip('/')


class TestShareAPI:
    """Tests for Share Design API endpoints"""
    
    def test_health_check(self):
        """Verify API is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("✓ Health check passed")
    
    def test_create_share_design_basic(self):
        """Test POST /api/share creates a shared design with basic fields"""
        payload = {
            "name": "TEST_Basic Share Design",
            "grid": [{"id": "m1", "type": "Studio", "x": 0, "y": 0, "w": 5, "h": 8}],
            "walls": [],
            "furniture": [],
            "totalSqm": 14.4,
            "estimatedPrice": 35000,
            "moduleCount": 1
        }
        response = requests.post(f"{BASE_URL}/api/share", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "share_id" in data
        assert len(data["share_id"]) == 8  # Default share_id length
        print(f"✓ Created share design with ID: {data['share_id']}")
        return data["share_id"]
    
    def test_create_share_design_with_all_fields(self):
        """Test POST /api/share stores email, phone, projectName fields"""
        payload = {
            "name": "TEST_Full Share Design",
            "grid": [
                {"id": "m1", "type": "Studio", "label": "Studio Module", "x": 0, "y": 0, "w": 7, "h": 8, "sqm": 18.0, "price": 42000},
                {"id": "m2", "type": "Bedroom", "label": "Bedroom Module", "x": 7, "y": 0, "w": 5, "h": 8, "sqm": 12.0, "price": 35000}
            ],
            "walls": [
                {"id": "w1", "type": "MP-1", "label": "Standard Wall", "x": 0, "y": 0, "face": "W", "price": 3200}
            ],
            "furniture": [
                {"id": "f1", "type": "Sofa", "label": "Sofa", "x": 3, "y": 3, "width": 2.4, "depth": 1.0}
            ],
            "totalSqm": 30.0,
            "estimatedPrice": 80200,
            "moduleCount": 2,
            "clientFirstName": "TEST_John",
            "clientFamilyName": "Doe",
            "siteAddress": "123 Test Street, Auckland, NZ",
            "email": "test@example.com",
            "phone": "021 999 8888",
            "projectName": "TEST_Project Alpha"
        }
        response = requests.post(f"{BASE_URL}/api/share", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "share_id" in data
        share_id = data["share_id"]
        print(f"✓ Created share design with all fields, ID: {share_id}")
        
        # Verify data was stored correctly via GET
        get_response = requests.get(f"{BASE_URL}/api/shared/{share_id}")
        assert get_response.status_code == 200
        stored = get_response.json()
        
        # Verify all fields are stored
        assert stored["name"] == "TEST_Full Share Design"
        assert stored["email"] == "test@example.com"
        assert stored["phone"] == "021 999 8888"
        assert stored["projectName"] == "TEST_Project Alpha"
        assert stored["clientFirstName"] == "TEST_John"
        assert stored["clientFamilyName"] == "Doe"
        assert stored["siteAddress"] == "123 Test Street, Auckland, NZ"
        assert stored["totalSqm"] == 30.0
        assert stored["estimatedPrice"] == 80200
        assert stored["moduleCount"] == 2
        assert len(stored["grid"]) == 2
        assert len(stored["walls"]) == 1
        assert len(stored["furniture"]) == 1
        print("✓ All fields verified in stored design")
        return share_id
    
    def test_get_existing_shared_design(self):
        """Test GET /api/shared/{share_id} returns existing design v8a1g0dw"""
        response = requests.get(f"{BASE_URL}/api/shared/v8a1g0dw")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields from the test design
        assert data["share_id"] == "v8a1g0dw"
        assert data["name"] == "Beach House Test"
        assert data["projectName"] == "Beach House Test"
        assert data["clientFirstName"] == "Jane"
        assert data["clientFamilyName"] == "Smith"
        assert data["siteAddress"] == "140 Pine Hill Road, Dunedin, NZ"
        assert data["email"] == "jane@example.com"
        assert data["phone"] == "021 123 4567"
        assert data["totalSqm"] == 38.0
        assert data["estimatedPrice"] == 92700
        assert data["moduleCount"] == 3
        assert len(data["grid"]) == 3  # Studio, Bedroom, Deck
        assert len(data["walls"]) == 2
        assert len(data["furniture"]) == 2  # Sofa, Dining Table
        print("✓ Existing shared design v8a1g0dw verified")
    
    def test_get_nonexistent_shared_design(self):
        """Test GET /api/shared/{share_id} returns 404 for invalid ID"""
        response = requests.get(f"{BASE_URL}/api/shared/nonexistent123")
        assert response.status_code == 404
        print("✓ 404 returned for nonexistent share ID")
    
    def test_share_design_grid_structure(self):
        """Test that grid modules are stored with correct structure"""
        response = requests.get(f"{BASE_URL}/api/shared/v8a1g0dw")
        assert response.status_code == 200
        data = response.json()
        
        # Check first module structure
        module = data["grid"][0]
        assert "id" in module
        assert "type" in module
        assert "x" in module
        assert "y" in module
        assert "w" in module
        assert "h" in module
        assert "sqm" in module
        assert "price" in module
        print("✓ Grid module structure verified")
    
    def test_share_design_walls_structure(self):
        """Test that walls are stored with correct structure"""
        response = requests.get(f"{BASE_URL}/api/shared/v8a1g0dw")
        assert response.status_code == 200
        data = response.json()
        
        # Check first wall structure
        wall = data["walls"][0]
        assert "id" in wall
        assert "type" in wall
        assert "face" in wall
        assert "price" in wall
        print("✓ Wall structure verified")
    
    def test_share_design_furniture_structure(self):
        """Test that furniture items are stored with correct structure"""
        response = requests.get(f"{BASE_URL}/api/shared/v8a1g0dw")
        assert response.status_code == 200
        data = response.json()
        
        # Check first furniture item structure
        furniture = data["furniture"][0]
        assert "id" in furniture
        assert "type" in furniture
        assert "x" in furniture
        assert "y" in furniture
        assert "width" in furniture
        assert "depth" in furniture
        print("✓ Furniture structure verified")


class TestEntityAPIs:
    """Tests for entity APIs used by SharedDesign page"""
    
    def test_list_wall_images(self):
        """Test GET /api/entities/WallImage returns list"""
        response = requests.get(f"{BASE_URL}/api/entities/WallImage")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ WallImage list returned {len(data)} items")
    
    def test_list_floor_plan_images(self):
        """Test GET /api/entities/FloorPlanImage returns list"""
        response = requests.get(f"{BASE_URL}/api/entities/FloorPlanImage")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ FloorPlanImage list returned {len(data)} items")
    
    def test_list_wall_entries(self):
        """Test GET /api/entities/WallEntry returns list"""
        response = requests.get(f"{BASE_URL}/api/entities/WallEntry")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ WallEntry list returned {len(data)} items")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
