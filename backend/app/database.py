import json
import os
import threading
import hashlib
import secrets
import re
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from .models import Bike, Hub, InspectionRecord, ContractRecord, DashboardStats, User

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_FILE = DATA_DIR / "db_store.json"

_lock = threading.RLock()

# Cryptographic password hashing using PBKDF2-HMAC-SHA256
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return f"{salt}:{key}"

def verify_password(plain_password: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False
    if ":" not in stored_hash:
        # Legacy fallback
        return secrets.compare_digest(plain_password, stored_hash)
    salt, key = stored_hash.split(":", 1)
    computed = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return secrets.compare_digest(key, computed)

# Standard Bangladesh Fleet
DEFAULT_BIKES: Dict[str, dict] = {
    "BD-GLF-101": {
        "bike_id": "BD-GLF-101",
        "model_name": "GLAFIT GFR-02 Smart Folding e-Bike",
        "brand": "GLAFIT Bangladesh",
        "category": "Urban Folding EV Commuter",
        "serial_number": "BD-GFR02-2026-8941",
        "battery_level": 94,
        "status": "available",
        "current_hub_id": "HUB-DHK-01",
        "last_inspection_date": None,
        "odometer_km": 158.4,
        "image_url": "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&auto=format&fit=crop&q=80"
    },
    "BD-GLF-102": {
        "bike_id": "BD-GLF-102",
        "model_name": "GLAFIT N-GFR High-Torque Commuter",
        "brand": "GLAFIT Bangladesh",
        "category": "Compact Urban e-Moped",
        "serial_number": "BD-NGFR-2026-4421",
        "battery_level": 88,
        "status": "available",
        "current_hub_id": "HUB-DHK-01",
        "last_inspection_date": None,
        "odometer_km": 312.0,
        "image_url": "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600&auto=format&fit=crop&q=80"
    },
    "BD-EV-201": {
        "bike_id": "BD-EV-201",
        "model_name": "GLAFIT City Cruiser Pro",
        "brand": "GLAFIT Bangladesh",
        "category": "All-Terrain City e-Bike",
        "serial_number": "BD-CCP-2026-9022",
        "battery_level": 100,
        "status": "available",
        "current_hub_id": "HUB-DHK-02",
        "last_inspection_date": None,
        "odometer_km": 94.2,
        "image_url": "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=600&auto=format&fit=crop&q=80"
    },
    "BD-EV-305": {
        "bike_id": "BD-EV-305",
        "model_name": "GLAFIT Eco Cargo Express",
        "brand": "GLAFIT Bangladesh",
        "category": "Commercial Delivery e-Bike",
        "serial_number": "BD-ECE-2026-3199",
        "battery_level": 82,
        "status": "available",
        "current_hub_id": "HUB-DHK-03",
        "last_inspection_date": None,
        "odometer_km": 420.8,
        "image_url": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80"
    }
}

DEFAULT_HUBS: Dict[str, dict] = {
    "HUB-DHK-01": {
        "hub_id": "HUB-DHK-01",
        "name": "Gulshan Flagship EV Hub",
        "address": "Plot 14, Road 103, Gulshan-2, Dhaka",
        "city": "Dhaka",
        "division": "Dhaka",
        "phone": "+880 1711-234567",
        "operating_hours": "07:00 AM - 11:00 PM (BST)",
        "contact_email": "gulshan-hub@glafit.bd"
    },
    "HUB-DHK-02": {
        "hub_id": "HUB-DHK-02",
        "name": "Dhanmondi Smart Station",
        "address": "House 28, Road 7, Dhanmondi, Dhaka",
        "city": "Dhaka",
        "division": "Dhaka",
        "phone": "+880 1722-345678",
        "operating_hours": "07:00 AM - 11:00 PM (BST)",
        "contact_email": "dhanmondi-hub@glafit.bd"
    },
    "HUB-DHK-03": {
        "hub_id": "HUB-DHK-03",
        "name": "Uttara Express Terminal",
        "address": "Sector 3, Jasimuddin Avenue, Uttara, Dhaka",
        "city": "Dhaka",
        "division": "Dhaka",
        "phone": "+880 1733-456789",
        "operating_hours": "06:30 AM - 11:30 PM (BST)",
        "contact_email": "uttara-hub@glafit.bd"
    },
    "HUB-CTG-01": {
        "hub_id": "HUB-CTG-01",
        "name": "Agrabad Commercial Hub",
        "address": "Agrabad C/A, Chattogram",
        "city": "Chattogram",
        "division": "Chattogram",
        "phone": "+880 1744-567890",
        "operating_hours": "08:00 AM - 10:00 PM (BST)",
        "contact_email": "chattogram-hub@glafit.bd"
    }
}

# Pre-seeded users with hashed passwords
DEFAULT_USERS: Dict[str, dict] = {
    "USR-001": {
        "user_id": "USR-001",
        "name": "Tanvir Ahmed",
        "email": "user@glafit.bd",
        "phone": "01711223344",
        "nid_number": "19942691234567890",
        "password_hash": hash_password("password123"),
        "role": "customer",
        "created_at": "2026-11-01 10:00:00"
    },
    "STAFF-001": {
        "user_id": "STAFF-001",
        "name": "Inspector Rakib Hasan",
        "email": "staff@glafit.bd",
        "phone": "01811998877",
        "nid_number": "19882699876543210",
        "password_hash": hash_password("password123"),
        "role": "staff",
        "created_at": "2026-10-15 09:30:00"
    }
}

class DatabaseStore:
    def __init__(self):
        self.bikes: Dict[str, dict] = dict(DEFAULT_BIKES)
        self.hubs: Dict[str, dict] = dict(DEFAULT_HUBS)
        self.users: Dict[str, dict] = dict(DEFAULT_USERS)
        self.inspections: Dict[str, dict] = {}
        self.contracts: Dict[str, dict] = {}
        self.active_sessions: Dict[str, dict] = {}  # token -> session data
        self.failed_attempts: Dict[str, dict] = {}  # identifier -> {count, locked_until}
        self._ensure_storage()
        self._load()

    def _ensure_storage(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)

    def _load(self):
        if DB_FILE.exists():
            try:
                with open(DB_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "bikes" in data:
                        self.bikes.update(data["bikes"])
                    if "hubs" in data:
                        self.hubs.update(data["hubs"])
                    if "users" in data:
                        self.users.update(data["users"])
                    if "inspections" in data:
                        self.inspections = data["inspections"]
                    if "contracts" in data:
                        self.contracts = data["contracts"]
                    if "sessions" in data:
                        self.active_sessions = data["sessions"]
            except Exception as e:
                print(f"[DB] Error loading database: {e}")

    def _save(self):
        try:
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump({
                    "bikes": self.bikes,
                    "hubs": self.hubs,
                    "users": self.users,
                    "inspections": self.inspections,
                    "contracts": self.contracts,
                    "sessions": self.active_sessions,
                    "saved_at": datetime.now().isoformat()
                }, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[DB] Error writing database store: {e}")

    # --- SECURE USER OPERATIONS ---

    def create_user(self, name: str, email: str, phone: str, nid: str, password: str, role: str = "customer") -> User:
        with _lock:
            # 1. Validation: Email
            clean_email = email.strip().lower()
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean_email):
                raise ValueError("Invalid email format.")

            # 2. Validation: Bangladesh Phone
            clean_phone = re.sub(r"[\s\-\+]", "", phone.strip())
            if clean_phone.startswith("880"):
                clean_phone = clean_phone[2:]
            if not re.match(r"^01[3-9]\d{8}$", clean_phone):
                raise ValueError("Invalid Bangladesh mobile number. Must be 11 digits starting with 01 (e.g. 01712345678).")

            # 3. Validation: National ID (10, 13, or 17 digits)
            clean_nid = re.sub(r"[\s\-]", "", nid.strip())
            if not re.match(r"^\d{10,17}$", clean_nid):
                raise ValueError("Invalid National ID number. Must be 10-digit Smart Card or 13/17-digit NID.")

            # 4. Validation: Password strength
            if len(password) < 6:
                raise ValueError("Password must be at least 6 characters long.")

            # 5. Check uniqueness
            for u in self.users.values():
                if u.get("email", "").lower() == clean_email:
                    raise ValueError("An account with this email address already exists.")
                if u.get("phone", "") == clean_phone:
                    raise ValueError("An account with this phone number already exists.")
                if u.get("nid_number", "") == clean_nid:
                    raise ValueError("An account with this National ID number already exists.")

            user_id = f"USR-{len(self.users) + 1:03d}"
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            hashed_pw = hash_password(password)

            user_data = {
                "user_id": user_id,
                "name": name.strip(),
                "email": clean_email,
                "phone": clean_phone,
                "nid_number": clean_nid,
                "password_hash": hashed_pw,
                "role": role,
                "created_at": now_str
            }
            self.users[user_id] = user_data
            self._save()
            return User(**{k: v for k, v in user_data.items() if not k.startswith("password")})

    def authenticate_user(self, identifier: str, password: str) -> Optional[User]:
        with _lock:
            clean_id = identifier.strip().lower()
            clean_phone = re.sub(r"[\s\-\+]", "", clean_id)
            if clean_phone.startswith("880"):
                clean_phone = clean_phone[2:]

            now = datetime.now()
            # 1. Check brute-force lockout
            key = clean_id
            attempt_info = self.failed_attempts.get(key)
            if attempt_info:
                locked_until = attempt_info.get("locked_until")
                if locked_until and now < locked_until:
                    wait_sec = int((locked_until - now).total_seconds())
                    raise ValueError(f"Too many failed login attempts. Account temporarily locked for {wait_sec} seconds to protect your security.")
                elif locked_until and now >= locked_until:
                    # Lock expired, reset
                    del self.failed_attempts[key]

            # 2. Look for matching user
            target_user = None
            for u in self.users.values():
                user_email = u.get("email", "").lower()
                user_phone = u.get("phone", "")
                if user_email == clean_id or user_phone == clean_phone or user_phone == clean_id:
                    target_user = u
                    break

            if not target_user:
                return None

            # 3. Check password
            stored_hash = target_user.get("password_hash") or target_user.get("password", "")
            if verify_password(password, stored_hash):
                # Successful login: reset failed attempts
                if key in self.failed_attempts:
                    del self.failed_attempts[key]

                # Upgrade plaintext password if legacy
                if "password_hash" not in target_user:
                    target_user["password_hash"] = hash_password(password)
                    if "password" in target_user:
                        del target_user["password"]
                    self._save()
                return User(**{k: v for k, v in target_user.items() if not k.startswith("password")})
            else:
                # Increment failed attempts
                info = self.failed_attempts.get(key, {"count": 0})
                info["count"] = info.get("count", 0) + 1
                info["last_attempt"] = now

                if info["count"] >= 5:
                    info["locked_until"] = now + timedelta(minutes=10)
                    self.failed_attempts[key] = info
                    raise ValueError("Too many failed login attempts. Account locked for 10 minutes to protect your account.")

                self.failed_attempts[key] = info
                return None

    def create_session(self, user_id: str) -> str:
        """Issues cryptographically secure random session token with expiry."""
        with _lock:
            token = f"bd-sec-{secrets.token_hex(24)}"
            now = datetime.now()
            expires_at = now + timedelta(days=7)
            self.active_sessions[token] = {
                "user_id": user_id,
                "created_at": now.isoformat(),
                "expires_at": expires_at.isoformat()
            }
            self._save()
            return token

    def verify_session(self, token: str) -> Optional[User]:
        """Validates token and returns user if session is active and unexpired."""
        with _lock:
            if not token:
                return None
            clean_token = token.replace("Bearer ", "").strip()
            session = self.active_sessions.get(clean_token)
            if not session:
                return None

            try:
                exp = datetime.fromisoformat(session["expires_at"])
                if datetime.now() > exp:
                    del self.active_sessions[clean_token]
                    self._save()
                    return None
            except Exception:
                pass

            user_id = session.get("user_id")
            return self.get_user(user_id) if user_id else None

    def revoke_session(self, token: str) -> bool:
        """Revokes/invalidates session token on logout."""
        with _lock:
            clean_token = token.replace("Bearer ", "").strip()
            if clean_token in self.active_sessions:
                del self.active_sessions[clean_token]
                self._save()
                return True
            return False

    def get_user(self, user_id: str) -> Optional[User]:
        with _lock:
            u = self.users.get(user_id)
            return User(**{k: v for k, v in u.items() if not k.startswith("password")}) if u else None

    # --- BIKE OPERATIONS ---

    def get_bike(self, bike_id: str) -> Optional[Bike]:
        with _lock:
            data = self.bikes.get(bike_id.strip().upper())
            return Bike(**data) if data else None

    def register_or_get_bike(self, bike_id: str, model_name: Optional[str] = None, hub_id: Optional[str] = None, user_id: Optional[str] = None) -> Bike:
        with _lock:
            bid = bike_id.strip().upper()
            if bid in self.bikes:
                return Bike(**self.bikes[bid])

            new_bike = {
                "bike_id": bid,
                "model_name": model_name or f"GLAFIT EV Smart Bike ({bid})",
                "brand": "GLAFIT Bangladesh",
                "category": "Smart Electric Urban Bike",
                "serial_number": f"BD-EV-{datetime.now().strftime('%Y')}-{bid}",
                "battery_level": 95,
                "status": "available",
                "current_hub_id": hub_id or "HUB-DHK-01",
                "last_inspection_date": None,
                "odometer_km": 10.0,
                "image_url": "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&auto=format&fit=crop&q=80",
                "registered_by_user": user_id
            }
            self.bikes[bid] = new_bike
            self._save()
            print(f"[DB] Auto-registered new Bike ID '{bid}' into database.")
            return Bike(**new_bike)

    def list_bikes(self) -> List[Bike]:
        with _lock:
            return [Bike(**b) for b in self.bikes.values()]

    def update_bike_status(self, bike_id: str, status: str, last_inspection: Optional[str] = None):
        with _lock:
            bid = bike_id.strip().upper()
            if bid in self.bikes:
                self.bikes[bid]["status"] = status
                if last_inspection:
                    self.bikes[bid]["last_inspection_date"] = last_inspection
                self._save()

    # --- HUB OPERATIONS ---

    def get_hub(self, hub_id: str) -> Optional[Hub]:
        with _lock:
            data = self.hubs.get(hub_id.strip().upper())
            return Hub(**data) if data else None

    def list_hubs(self) -> List[Hub]:
        with _lock:
            return [Hub(**h) for h in self.hubs.values()]

    # --- INSPECTION OPERATIONS ---

    def save_inspection(self, record: InspectionRecord):
        with _lock:
            self.inspections[record.inspection_id] = record.model_dump()
            bid = record.bike_id.strip().upper()
            if bid in self.bikes:
                self.bikes[bid]["last_inspection_date"] = record.created_at
            self._save()

    def get_inspection(self, inspection_id: str) -> Optional[InspectionRecord]:
        with _lock:
            data = self.inspections.get(inspection_id)
            return InspectionRecord(**data) if data else None

    def list_inspections(self, status_filter: Optional[str] = None, bike_id: Optional[str] = None) -> List[InspectionRecord]:
        with _lock:
            results = []
            for record_data in sorted(self.inspections.values(), key=lambda x: x.get("created_at", ""), reverse=True):
                rec = InspectionRecord(**record_data)
                if status_filter and status_filter.upper() != "ALL" and rec.status != status_filter.upper():
                    continue
                if bike_id and bike_id.upper() not in rec.bike_id.upper():
                    continue
                results.append(rec)
            return results

    def mark_contract_submitted(self, inspection_id: str, contract_id: str):
        with _lock:
            if inspection_id in self.inspections:
                self.inspections[inspection_id]["contract_submitted"] = True
                self.inspections[inspection_id]["contract_id"] = contract_id
                self._save()

    # --- CONTRACT OPERATIONS ---

    def save_contract(self, record: ContractRecord):
        with _lock:
            self.contracts[record.contract_id] = record.model_dump()
            self.mark_contract_submitted(record.inspection_id, record.contract_id)
            self.update_bike_status(record.bike_id, "rented")
            self._save()

    def get_contract(self, contract_id: str) -> Optional[ContractRecord]:
        with _lock:
            data = self.contracts.get(contract_id)
            return ContractRecord(**data) if data else None

    def get_contract_by_inspection(self, inspection_id: str) -> Optional[ContractRecord]:
        with _lock:
            for c in self.contracts.values():
                if c.get("inspection_id") == inspection_id:
                    return ContractRecord(**c)
            return None

    def list_contracts(self) -> List[ContractRecord]:
        with _lock:
            return [ContractRecord(**c) for c in sorted(self.contracts.values(), key=lambda x: x.get("submitted_at", ""), reverse=True)]

    # --- STATISTICS ---

    def get_stats(self, ai_model_name: str, ai_status: str) -> DashboardStats:
        with _lock:
            total = len(self.inspections)
            successful = sum(1 for i in self.inspections.values() if i.get("status") == "PASS")
            failed = sum(1 for i in self.inspections.values() if i.get("status") == "FAIL")
            manual = sum(1 for i in self.inspections.values() if i.get("status") == "MANUAL_REVIEW")
            pass_rate = round((successful / total * 100), 1) if total > 0 else 100.0

            return DashboardStats(
                total_inspections=total,
                successful_inspections=successful,
                failed_inspections=failed,
                manual_review_inspections=manual,
                pass_rate_percentage=pass_rate,
                registered_bikes_count=len(self.bikes),
                active_contracts_count=len(self.contracts),
                ai_model_name=ai_model_name,
                ai_status=ai_status
            )

db = DatabaseStore()
