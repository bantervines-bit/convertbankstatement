from functools import wraps
from flask import redirect, url_for, flash
from flask_login import current_user

def login_required_with_message(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def check_daily_bonus(user):
    """Check and apply daily bonus credits"""
    from datetime import date
    from models import db
    
    today = date.today()
    
    if user.last_daily_bonus != today:
        user.add_credits(5, 'Daily login bonus')
        user.last_daily_bonus = today
        db.session.commit()
        return True
    return False
