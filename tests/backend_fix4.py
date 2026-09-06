import requests, random, datetime, json

BASE = "https://duty-planner-77.preview.emergentagent.com/api"

r = requests.post(f"{BASE}/auth/login", json={"nik": "ADMIN001", "password": "Admin@123"})
admin_hdr = {"Authorization": f"Bearer {r.json()['token']}"}

# Test 1: approve user with body
reg_nik = f"R{random.randint(10000,99999)}"
r = requests.post(f"{BASE}/auth/register", json={"nik": reg_nik, "name": "Reg", "email": f"{reg_nik}@t.com", "password": "Passw0rd!"})
reg_id = r.json().get("id")
print("register:", r.status_code, r.text[:200])
# Register response doesn't return id; need to fetch pending users
r = requests.get(f"{BASE}/users", headers=admin_hdr, params={"status": "pending"})
print("pending users:", r.status_code, r.text[:400])
matches = [u for u in r.json() if u["nik"] == reg_nik]
if matches:
    reg_id = matches[0]["id"]
    r = requests.post(f"{BASE}/users/{reg_id}/approve", headers=admin_hdr, json={"action": "approve"})
    print("approve:", r.status_code, r.text[:200])
    r = requests.post(f"{BASE}/auth/login", json={"nik": reg_nik, "password": "Passw0rd!"})
    print("login after approve:", r.status_code, r.text[:100])

# Test 2: shift cell with date field
suffix = random.randint(10000, 99999)
p_nik = f"P{suffix}"
r = requests.post(f"{BASE}/users", headers=admin_hdr, json={"nik": p_nik, "name": "TP", "email": f"p{suffix}@t.com"})
personil_id = r.json().get("id")
now = datetime.datetime.now()
date_str = f"{now.year}-{now.month:02d}-01"
r = requests.post(f"{BASE}/shifts/cell", headers=admin_hdr, json={"user_id": personil_id, "date": date_str, "shift": "pagi"})
print("shifts/cell with date:", r.status_code, r.text[:200])

# Test 3: summary structure
r = requests.get(f"{BASE}/summary", headers=admin_hdr, params={"year": now.year, "month": now.month})
j = r.json()
print("summary keys:", list(j.keys()) if isinstance(j, dict) else type(j))
if isinstance(j, dict) and j.get("summary"):
    print("first item keys:", list(j["summary"][0].keys()))
    print("has total_hours:", "total_hours" in j["summary"][0])

# cleanup
requests.delete(f"{BASE}/users/{personil_id}", headers=admin_hdr)
