#!/usr/bin/env python3
"""
Latestname — Database initialization script
Creates the default admin account on first run.
Run this ONCE after installing dependencies.
"""
import sys
import os

# Ensure we can import the app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def init_db():
    from app.auth import (
        engine, Base, SessionLocal, User, pwd_context, AUTH_ENABLED
    )
    
    print("Creating database tables...")
    Base.metadata.create_all(engine)
    print("✅ Tables created")
    
    db = SessionLocal()
    try:
        admin_email = "admin@latestname.com"
        admin_password = "changeme123"
        
        existing = db.query(User).filter(User.email == admin_email).first()
        if existing:
            print(f"ℹ️  Admin account already exists: {admin_email}")
            print(f"   To reset password, run: python3 scripts/init_db.py --reset")
            return
        
        admin = User(
            email=admin_email,
            name="Administrator",
            hashed_password=pwd_context.hash(admin_password),
            is_active=True,
            is_superuser=True,
            is_verified=True,
            tier="admin",
        )
        db.add(admin)
        db.commit()
        
        print()
        print("=" * 50)
        print("  ✅ Default admin account created!")
        print("=" * 50)
        print(f"  Email:    {admin_email}")
        print(f"  Password: {admin_password}")
        print("=" * 50)
        print()
        print("  ⚠️  CHANGE THE PASSWORD IMMEDIATELY!")
        print(f"  Login at: http://localhost:5173/login")
        print()
        
    finally:
        db.close()


def reset_admin_password():
    from app.auth import engine, Base, SessionLocal, User, pwd_context
    
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@latestname.com").first()
        if not admin:
            print("❌ Admin account not found. Run init first.")
            return
        
        admin.hashed_password = pwd_context.hash("changeme123")
        admin.is_superuser = True
        admin.tier = "admin"
        db.commit()
        print("✅ Admin password reset to: changeme123")
        print("⚠️  Change it immediately after login!")
    finally:
        db.close()


if __name__ == "__main__":
    if "--reset" in sys.argv:
        reset_admin_password()
    else:
        init_db()
