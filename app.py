from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from datetime import datetime, date
import os
from config import Config
from models import db, User, Conversion, CreditTransaction, GuestConversion
from utils.pdf_converter import convert_pdf_to_excel, count_pdf_pages
from utils.auth import login_required_with_message, check_daily_bonus

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Create upload and converted folders
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['CONVERTED_FOLDER'], exist_ok=True)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Helper function to check allowed files
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def get_client_ip():
    """Get client IP address"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0]
    return request.remote_addr

def check_guest_limit(ip_address):
    """Check if guest has remaining conversions this month"""
    month_year = datetime.now().strftime('%Y-%m')
    guest = GuestConversion.query.filter_by(ip_address=ip_address, month_year=month_year).first()
    
    if not guest:
        guest = GuestConversion(ip_address=ip_address, month_year=month_year, conversions_this_month=0)
        db.session.add(guest)
        db.session.commit()
    
    return guest.conversions_this_month < app.config['GUEST_CREDITS_PER_MONTH']

def increment_guest_conversion(ip_address):
    """Increment guest conversion count"""
    month_year = datetime.now().strftime('%Y-%m')
    guest = GuestConversion.query.filter_by(ip_address=ip_address, month_year=month_year).first()
    
    if guest:
        guest.conversions_this_month += 1
        guest.last_conversion = datetime.utcnow()
        db.session.commit()

# Routes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Validation
        if not all([name, email, password, confirm_password]):
            flash('Please fill in all fields', 'danger')
            return render_template('signup.html')
        
        if password != confirm_password:
            flash('Passwords do not match', 'danger')
            return render_template('signup.html')
        
        if len(password) < 6:
            flash('Password must be at least 6 characters', 'danger')
            return render_template('signup.html')
        
        # Check if user exists
        if User.query.filter_by(email=email).first():
            flash('Email already registered. Please login.', 'danger')
            return redirect(url_for('login'))
        
        # Create new user
        user = User(name=name, email=email, credits=25)
        user.set_password(password)
        user.generate_referral_code()
        
        db.session.add(user)
        
        # Add welcome bonus transaction
        transaction = CreditTransaction(
            user=user,
            amount=25,
            description='Welcome Bonus',
            transaction_type='earned'
        )
        db.session.add(transaction)
        
        db.session.commit()
        
        login_user(user)
        flash('Account created successfully! You received 25 free credits!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        if not email or not password:
            flash('Please fill in all fields', 'danger')
            return render_template('login.html')
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            flash('User not found. Please sign up first.', 'danger')
            return render_template('login.html')
        
        if not user.check_password(password):
            flash('Incorrect password', 'danger')
            return render_template('login.html')
        
        login_user(user)
        
        # Check and apply daily bonus
        if check_daily_bonus(user):
            flash(f'Welcome back, {user.name}! You received 5 daily bonus credits!', 'success')
        else:
            flash(f'Welcome back, {user.name}!', 'success')
        
        return redirect(url_for('dashboard'))
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required_with_message
def dashboard():
    check_daily_bonus(current_user)
    conversions = Conversion.query.filter_by(user_id=current_user.id).order_by(Conversion.created_at.desc()).limit(5).all()
    return render_template('dashboard.html', user=current_user, recent_conversions=conversions)

@app.route('/convert', methods=['POST'])
@login_required_with_message
def convert():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'success': False, 'message': 'Invalid file type. Only PDF, PNG, JPG allowed'}), 400
    
    # Save uploaded file
    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_filename = f"{timestamp}_{filename}"
    upload_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(upload_path)
    
    # Count pages
    pages = count_pdf_pages(upload_path)
    
    if pages == 0:
        os.remove(upload_path)
        return jsonify({'success': False, 'message': 'Could not read PDF file'}), 400
    
    # Check if user has enough credits
    if current_user.credits < pages:
        os.remove(upload_path)
        return jsonify({'success': False, 'message': f'Not enough credits. You need {pages} credits but have {current_user.credits}'}), 400
    
    # Convert PDF to Excel
    output_filename = f"{timestamp}_{filename.rsplit('.', 1)[0]}.xlsx"
    output_path = os.path.join(app.config['CONVERTED_FOLDER'], output_filename)
    
    success, pages_converted, message = convert_pdf_to_excel(upload_path, output_path)
    
    if success:
        # Deduct credits
        current_user.deduct_credits(pages, f"Conversion: {filename}")
        
        # Save conversion record
        conversion = Conversion(
            user_id=current_user.id,
            original_filename=filename,
            converted_filename=output_filename,
            pages=pages,
            credits_used=pages,
            status='completed'
        )
        db.session.add(conversion)
        db.session.commit()
        
        # Clean up uploaded file
        os.remove(upload_path)
        
        return jsonify({
            'success': True,
            'message': message,
            'pages': pages,
            'credits_used': pages,
            'remaining_credits': current_user.credits,
            'download_url': url_for('download', filename=output_filename)
        })
    else:
        # Clean up files
        os.remove(upload_path)
        if os.path.exists(output_path):
            os.remove(output_path)
        
        return jsonify({'success': False, 'message': message}), 500

@app.route('/guest-convert', methods=['GET', 'POST'])
def guest_convert():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'GET':
        ip_address = get_client_ip()
        can_convert = check_guest_limit(ip_address)
        return render_template('guest_convert.html', can_convert=can_convert)
    
    # POST request - handle conversion
    ip_address = get_client_ip()
    
    if not check_guest_limit(ip_address):
        return jsonify({'success': False, 'message': 'Monthly guest limit reached. Please sign up for more conversions.'}), 403
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'success': False, 'message': 'Invalid file type. Only PDF, PNG, JPG allowed'}), 400
    
    # Save uploaded file
    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_filename = f"guest_{timestamp}_{filename}"
    upload_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(upload_path)
    
    # Count pages (guest limit: 1 page only)
    pages = count_pdf_pages(upload_path)
    
    if pages == 0:
        os.remove(upload_path)
        return jsonify({'success': False, 'message': 'Could not read PDF file'}), 400
    
    if pages > 1:
        os.remove(upload_path)
        return jsonify({'success': False, 'message': 'Guest users can only convert 1-page PDFs. Please sign up for more.'}), 400
    
    # Convert PDF to Excel
    output_filename = f"guest_{timestamp}_{filename.rsplit('.', 1)[0]}.xlsx"
    output_path = os.path.join(app.config['CONVERTED_FOLDER'], output_filename)
    
    success, pages_converted, message = convert_pdf_to_excel(upload_path, output_path)
    
    if success:
        # Increment guest conversion count
        increment_guest_conversion(ip_address)
        
        # Save conversion record
        conversion = Conversion(
            original_filename=filename,
            converted_filename=output_filename,
            pages=pages,
            credits_used=0,
            status='completed',
            guest_ip=ip_address
        )
        db.session.add(conversion)
        db.session.commit()
        
        # Clean up uploaded file
        os.remove(upload_path)
        
        return jsonify({
            'success': True,
            'message': message,
            'download_url': url_for('download', filename=output_filename)
        })
    else:
        # Clean up files
        os.remove(upload_path)
        if os.path.exists(output_path):
            os.remove(output_path)
        
        return jsonify({'success': False, 'message': message}), 500

@app.route('/download/<filename>')
def download(filename):
    file_path = os.path.join(app.config['CONVERTED_FOLDER'], filename)
    
    if not os.path.exists(file_path):
        flash('File not found', 'danger')
        return redirect(url_for('dashboard' if current_user.is_authenticated else 'index'))
    
    return send_file(file_path, as_attachment=True)

@app.route('/pricing')
def pricing():
    return render_template('pricing.html')

@app.route('/credits')
@login_required_with_message
def credits():
    transactions = CreditTransaction.query.filter_by(user_id=current_user.id).order_by(CreditTransaction.created_at.desc()).all()
    return render_template('credits.html', user=current_user, transactions=transactions)

@app.route('/history')
@login_required_with_message
def history():
    conversions = Conversion.query.filter_by(user_id=current_user.id).order_by(Conversion.created_at.desc()).all()
    return render_template('history.html', conversions=conversions)

@app.route('/profile')
@login_required_with_message
def profile():
    return render_template('profile.html', user=current_user)

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

@app.route('/terms')
def terms():
    return render_template('terms.html')

# Initialize database
@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
