import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///database.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # File upload settings
    UPLOAD_FOLDER = 'uploads'
    CONVERTED_FOLDER = 'converted'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
    
    # Credit system
    GUEST_CREDITS_PER_MONTH = 1
    SIGNED_UP_CREDITS_PER_MONTH = 5
    SIGNUP_BONUS = 5
    REFERRAL_BONUS = 15
