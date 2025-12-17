#!/usr/bin/env python
"""
Script to create an admin user for ByteForge AI
Usage: python create_admin.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'byteforge.settings')
django.setup()

from authentication.models import User


def create_admin():
    email = input("Enter admin email (default: admin@byteforge.com): ").strip() or "admin@byteforge.com"
    password = input("Enter admin password (default: Admin123!): ").strip() or "Admin123!"
    display_name = input("Enter display name (default: Admin): ").strip() or "Admin"
    
    # Check if user exists
    if User.objects.filter(email=email).exists():
        print(f"User with email {email} already exists!")
        update = input("Do you want to update this user to admin? (y/n): ").strip().lower()
        if update == 'y':
            user = User.objects.get(email=email)
            user.is_admin = True
            user.is_staff = True
            user.is_superuser = True
            user.save()
            print(f"User {email} updated to admin successfully!")
        return
    
    # Create admin user
    user = User.objects.create_user(
        email=email,
        password=password,
        display_name=display_name,
        provider='local'
    )
    user.is_admin = True
    user.is_staff = True
    user.is_superuser = True
    user.save()
    
    print(f"\nAdmin user created successfully!")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"\nYou can now login at http://localhost:3000/login")


if __name__ == '__main__':
    create_admin()
