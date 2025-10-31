from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    credits = db.Column(db.Integer, default=25)
    referral_code = db.Column(db.String(20), unique=True)
    join_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_daily_bonus = db.Column(db.Date, nullable=True)
    
    # Relationships
    conversions = db.relationship('Conversion', backref='user', lazy=True)
    credit_transactions = db.relationship('CreditTransaction', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def generate_referral_code(self):
        self.referral_code = 'REF' + secrets.token_hex(4).upper()
    
    def add_credits(self, amount, description):
        self.credits += amount
        transaction = CreditTransaction(
            user_id=self.id,
            amount=amount,
            description=description,
            transaction_type='earned'
        )
        db.session.add(transaction)
    
    def deduct_credits(self, amount, description):
        if self.credits >= amount:
            self.credits -= amount
            transaction = CreditTransaction(
                user_id=self.id,
                amount=-amount,
                description=description,
                transaction_type='used'
            )
            db.session.add(transaction)
            return True
        return False

class Conversion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    original_filename = db.Column(db.String(255), nullable=False)
    converted_filename = db.Column(db.String(255), nullable=False)
    pages = db.Column(db.Integer, nullable=False)
    credits_used = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    guest_ip = db.Column(db.String(50), nullable=True)

class CreditTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class GuestConversion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(50), nullable=False)
    conversions_this_month = db.Column(db.Integer, default=0)
    last_conversion = db.Column(db.DateTime, default=datetime.utcnow)
    month_year = db.Column(db.String(7), nullable=False)  # Format: YYYY-MM
