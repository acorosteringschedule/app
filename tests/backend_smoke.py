import requests, json, datetime, sys, io

BASE = "https://duty-planner-77.preview.emergentagent.com/api"
results = []
def log(name, ok, info=""):
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name} :: {info}")
    results.append({"name": name, "ok": ok, "info": str(info)[:400]})

# 1. Admin login
r = requests.post(f"{BASE}/auth/login", json={"nik": "ADMIN001", "password": "Admin@123"})
log("admin_login", r.status_code == 200 and "token" in r.json(), f"{r.status_code} {r.text[:200]}")
admin_token = r.json().get("token")
admin_hdr = {"Authorization": f"Bearer {admin_token}"}

# 2. /auth/me
r = requests.get(f"{BASE}/auth/me", headers=admin_hdr)
log("auth_me_admin", r.status_code == 200 and r.json().get("role") == "admin", f"{r.status_code} {r.text[:200]}")

# 3. POST /users without token -> 401/403
r = requests.post(f"{BASE}/users", json={"nik": "P999", "name": "X", "email": "x@x.com"})
log("create_user_no_token_401", r.status_code in (401, 403), f"{r.status_code}")

# 3b. POST /users as admin creates personil
import random
suffix = random.randint(10000, 99999)
p_nik = f"P{suffix}"
r = requests.post(f"{BASE}/users", headers=admin_hdr, json={"nik": p_nik, "name": "Test Personil", "email": f"p{suffix}@t.com"})
log("create_personil_admin", r.status_code in (200, 201), f"{r.status_code} {r.text[:200]}")
personil = r.json() if r.status_code in (200, 201) else {}
personil_id = personil.get("id")

# Login as personil (default pw = NIK)
r = requests.post(f"{BASE}/auth/login", json={"nik": p_nik, "password": p_nik})
log("personil_login_default_pw", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
personil_token = r.json().get("token") if r.status_code == 200 else None
p_hdr = {"Authorization": f"Bearer {personil_token}"} if personil_token else {}

# 3c. personil trying to create user -> 403
r = requests.post(f"{BASE}/users", headers=p_hdr, json={"nik": "PX", "name": "N", "email": "e@e.com"})
log("personil_cannot_create_user_403", r.status_code == 403, f"{r.status_code}")

# 4. GET /users lists personil
r = requests.get(f"{BASE}/users", headers=admin_hdr)
ok = r.status_code == 200 and isinstance(r.json(), list) and all(u.get("role") != "admin" for u in r.json())
log("list_users_excludes_admin", ok, f"{r.status_code} count={len(r.json()) if r.status_code==200 else 0}")

# 5. Register pending user, login fail, approve, login success
reg_nik = f"R{random.randint(10000,99999)}"
r = requests.post(f"{BASE}/auth/register", json={"nik": reg_nik, "name": "Reg User", "email": f"{reg_nik}@t.com", "password": "Passw0rd!"})
log("register_pending", r.status_code in (200, 201), f"{r.status_code} {r.text[:200]}")
reg_id = r.json().get("id") if r.status_code in (200,201) else None

r = requests.post(f"{BASE}/auth/login", json={"nik": reg_nik, "password": "Passw0rd!"})
log("pending_login_403", r.status_code == 403, f"{r.status_code}")

r = requests.post(f"{BASE}/users/{reg_id}/approve", headers=admin_hdr)
log("admin_approve_user", r.status_code == 200, f"{r.status_code} {r.text[:200]}")

r = requests.post(f"{BASE}/auth/login", json={"nik": reg_nik, "password": "Passw0rd!"})
log("approved_login_success", r.status_code == 200, f"{r.status_code}")

# 6. Shifts cell upsert (admin)
now = datetime.datetime.now()
year, month = now.year, now.month
r = requests.post(f"{BASE}/shifts/cell", headers=admin_hdr, json={"user_id": personil_id, "year": year, "month": month, "day": 1, "shift": "pagi"})
log("shift_cell_upsert_admin", r.status_code == 200, f"{r.status_code} {r.text[:200]}")

# 6b. personil forbidden
r = requests.post(f"{BASE}/shifts/cell", headers=p_hdr, json={"user_id": personil_id, "year": year, "month": month, "day": 2, "shift": "pagi"})
log("shift_cell_personil_403", r.status_code == 403, f"{r.status_code}")

# 7. Auto-generate 3-2
r = requests.post(f"{BASE}/shifts/auto-generate", headers=admin_hdr, json={"year": year, "month": month, "pattern": "3-2"})
log("auto_generate_3_2", r.status_code == 200, f"{r.status_code} {r.text[:300]}")

# 8. GET shifts
r = requests.get(f"{BASE}/shifts", headers=admin_hdr, params={"year": year, "month": month})
j = r.json() if r.status_code == 200 else {}
log("get_shifts", r.status_code == 200 and "shifts" in j and "days" in j, f"{r.status_code} keys={list(j.keys())[:5]} shifts_count={len(j.get('shifts',[]))}")

# 9. Personil create request + admin notifications
r = requests.post(f"{BASE}/requests", headers=p_hdr, json={"type": "cuti_tahunan", "start_date": f"{year}-{month:02d}-05", "end_date": f"{year}-{month:02d}-05", "reason": "test"})
log("personil_create_request", r.status_code in (200,201), f"{r.status_code} {r.text[:300]}")
req_id = r.json().get("id") if r.status_code in (200,201) else None

r = requests.get(f"{BASE}/notifications", headers=admin_hdr)
log("admin_notifications", r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0, f"{r.status_code} count={len(r.json()) if r.status_code==200 else 0}")

# 10. Admin approve request
if req_id:
    r = requests.post(f"{BASE}/requests/{req_id}/action", headers=admin_hdr, json={"action": "approve"})
    log("admin_approve_request", r.status_code == 200, f"{r.status_code} {r.text[:300]}")

# 11. Leave conflict rule - hard to isolate with only 1 personil; test the endpoint returns properly
# create second request that likely also gets approved or conflict flagged
r = requests.post(f"{BASE}/requests", headers=p_hdr, json={"type": "cuti_tahunan", "start_date": f"{year}-{month:02d}-06", "end_date": f"{year}-{month:02d}-06", "reason": "test2"})
req2_id = r.json().get("id") if r.status_code in (200,201) else None
if req2_id:
    r = requests.post(f"{BASE}/requests/{req2_id}/action", headers=admin_hdr, json={"action": "approve"})
    log("conflict_endpoint_reachable", r.status_code == 200, f"{r.status_code} {r.text[:300]}")

# 12. Summary
r = requests.get(f"{BASE}/summary", headers=admin_hdr, params={"year": year, "month": month})
j = r.json() if r.status_code == 200 else {}
sample = j[0] if isinstance(j, list) and j else j
log("summary", r.status_code == 200 and (("total_hours" in sample) if isinstance(sample, dict) else True), f"{r.status_code} sample={str(sample)[:250]}")

# 13. change-logs admin
r = requests.get(f"{BASE}/change-logs", headers=admin_hdr)
log("change_logs_admin", r.status_code == 200 and isinstance(r.json(), list), f"{r.status_code} count={len(r.json()) if r.status_code==200 else 0}")

# 13b. change-logs personil forbidden
r = requests.get(f"{BASE}/change-logs", headers=p_hdr)
log("change_logs_personil_403", r.status_code == 403, f"{r.status_code}")

# 14. Settings GET public, PUT admin
r = requests.get(f"{BASE}/settings")
log("settings_get_public", r.status_code == 200, f"{r.status_code}")

r = requests.put(f"{BASE}/settings", json={"primary_color": "#123456", "title": "TestT", "subtitle": "TestS"})
log("settings_put_no_token_401", r.status_code in (401,403), f"{r.status_code}")

r = requests.put(f"{BASE}/settings", headers=admin_hdr, json={"primary_color": "#123456", "title": "TestT", "subtitle": "TestS", "logo_base64": "data:image/png;base64,AAAA"})
log("settings_put_admin", r.status_code == 200, f"{r.status_code} {r.text[:200]}")

r = requests.get(f"{BASE}/settings")
j = r.json() if r.status_code == 200 else {}
log("settings_persisted", j.get("primary_color") == "#123456" and j.get("title") == "TestT", f"got={j}")

# 15. PDF export
r = requests.get(f"{BASE}/exports/pdf", headers=admin_hdr, params={"year": year, "month": month})
log("export_pdf", r.status_code == 200 and "pdf" in r.headers.get("content-type","").lower(), f"{r.status_code} ct={r.headers.get('content-type')}")

# 16. XLSX export
r = requests.get(f"{BASE}/exports/xlsx", headers=admin_hdr, params={"year": year, "month": month})
ct = r.headers.get("content-type","").lower()
log("export_xlsx_admin", r.status_code == 200 and ("spreadsheet" in ct or "excel" in ct or "xlsx" in ct or "octet-stream" in ct), f"{r.status_code} ct={ct}")

# 17. Reorder users
r = requests.get(f"{BASE}/users", headers=admin_hdr)
ids = [u["id"] for u in r.json()][:3]
r = requests.post(f"{BASE}/users/reorder", headers=admin_hdr, json=ids)
log("users_reorder", r.status_code == 200, f"{r.status_code} {r.text[:200]}")

# 18. Delete personil
if personil_id:
    r = requests.delete(f"{BASE}/users/{personil_id}", headers=admin_hdr)
    log("delete_personil_cascade", r.status_code == 200, f"{r.status_code} {r.text[:200]}")

# summary
passed = sum(1 for x in results if x["ok"])
total = len(results)
print(f"\n=== {passed}/{total} passed ===")
with open("/tmp/backend_results.json","w") as f:
    json.dump(results, f, indent=2)
