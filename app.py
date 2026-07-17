"""
app.py — Flask backend for Smart E-Waste Management System
Run:  python app.py
Then: open http://localhost:5000 in your browser
"""

import os
import sys
import json
import csv
import io
from datetime import datetime
from functools import wraps

from flask import (Flask, render_template, request, redirect,
                   url_for, session, jsonify, flash, Response)
from werkzeug.security import generate_password_hash, check_password_hash
import qrcode

import database as db

# ── App setup ──────────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = 'ewaste-super-secret-key-2024'


# ── ML Model (optional) ────────────────────────────────────────────────────
ML_AVAILABLE    = False
price_predictor = None

_ml_dir = os.path.join(os.path.dirname(__file__), 'ml')
_model_path = os.path.join(_ml_dir, 'models', 'price_prediction_model.pkl')

if os.path.exists(_model_path):
    try:
        sys.path.insert(0, _ml_dir)
        from price_predictor import PricePredictionService   # noqa: E402
        price_predictor = PricePredictionService()
        if price_predictor.model_loaded:
            ML_AVAILABLE = True
            print('[OK] ML model loaded successfully.')
    except Exception as _e:
        print(f'[WARN] ML model could not be loaded: {_e}')
else:
    print('[INFO] ML model not found -- using formula-based price estimation.')


def simple_price_estimate(category, original_price, age_years, condition):
    """
    Simple depreciation formula when the ML model isn't available.
    Easily explainable: price = original × (1 - rate)^age × (condition/5)
    """
    depreciation_rates = {
        'Laptop': 0.22, 'Smartphone': 0.28, 'Tablet': 0.24,
        'Desktop': 0.18, 'Monitor': 0.15, 'Printer': 0.20,
        'TV': 0.15, 'Air Conditioner': 0.12, 'Refrigerator': 0.10,
        'Battery': 0.45, 'UPS': 0.25, 'Projector': 0.18,
        'Keyboard/Mouse': 0.30, 'Router/Modem': 0.25,
    }
    rate      = depreciation_rates.get(category, 0.20)
    estimated = float(original_price) * ((1 - rate) ** float(age_years)) * (int(condition) / 5)
    return max(100.0, round(estimated, 2))


# ── Decorators ─────────────────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to continue.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get('role') != 'admin':
            flash('Admin access required.', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated


def vendor_or_admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get('role') not in ('vendor', 'admin'):
            flash('Vendor access required.', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated


# ── QR Code generation ─────────────────────────────────────────────────────

def generate_qr_code(item_id):
    """
    Generate a QR code PNG for item_id.
    The QR encodes the item-detail URL so any scanner brings up the item page.
    Saved in static/qrcodes/ so Flask can serve it directly.
    """
    os.makedirs(os.path.join(os.path.dirname(__file__), 'static', 'qrcodes'), exist_ok=True)
    qr_data = f'http://localhost:5000/item/{item_id}'

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)

    img  = qr.make_image(fill_color='#0a1a0a', back_color='white')
    path = os.path.join('static', 'qrcodes', f'item_{item_id}.png')
    img.save(path)
    return path


# ══════════════════════════════════════════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════════════════════════════════════════

# ── Landing page ───────────────────────────────────────────────────────────

@app.route('/')
def index():
    campaigns   = db.get_upcoming_campaigns(6)
    leaderboard = db.get_leaderboard()
    return render_template('index.html', campaigns=campaigns, leaderboard=leaderboard)


# ── Authentication ─────────────────────────────────────────────────────────

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        email    = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        user = db.get_user_by_email(email)
        if user and check_password_hash(user['password_hash'], password):
            session['user_id']    = user['id']
            session['name']       = user['name']
            session['role']       = user['role']
            session['department'] = user['department']
            flash(f'Welcome back, {user["name"]}!', 'success')

            if user['role'] == 'admin':
                return redirect(url_for('admin'))
            elif user['role'] == 'vendor':
                return redirect(url_for('vendor_scan'))
            return redirect(url_for('dashboard'))

        flash('Incorrect email or password.', 'error')

    return render_template('login.html')


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        name       = request.form.get('name', '').strip()
        email      = request.form.get('email', '').strip().lower()
        password   = request.form.get('password', '')
        department = request.form.get('department', 'General')

        if not all([name, email, password]):
            flash('All fields are required.', 'error')
            return render_template('signup.html')
        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'error')
            return render_template('signup.html')

        user_id = db.create_user(name, email, generate_password_hash(password), 'user', department)
        if user_id:
            flash('Account created! Please log in.', 'success')
            return redirect(url_for('login'))
        flash('An account with that email already exists.', 'error')

    return render_template('signup.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully.', 'info')
    return redirect(url_for('index'))


# ── User dashboard ─────────────────────────────────────────────────────────

@app.route('/dashboard')
@login_required
def dashboard():
    items       = db.get_items_by_user(session['user_id'])
    user        = db.get_user_by_id(session['user_id'])
    leaderboard = db.get_leaderboard()
    return render_template('dashboard.html', items=items, user=user, leaderboard=leaderboard)


# ── Report a new e-waste item ───────────────────────────────────────────────

@app.route('/report', methods=['GET', 'POST'])
@login_required
def report():
    if request.method == 'POST':
        category       = request.form.get('category')
        brand          = request.form.get('brand', 'Unknown').strip()
        model_name     = request.form.get('model_name', '').strip()
        condition      = int(request.form.get('condition', 3))
        age_years      = float(request.form.get('age_years', 1))
        original_price = float(request.form.get('original_price', 0) or 0)
        department     = request.form.get('department', session.get('department', 'General'))
        description    = request.form.get('description', '').strip()

        # 1. Save item to DB
        item_id = db.create_item(
            session['user_id'], category, brand, model_name,
            condition, age_years, original_price, department, description
        )

        # 2. Predict price (ML or formula)
        if ML_AVAILABLE and price_predictor:
            try:
                predicted = price_predictor.predict_price({
                    'category': category, 'brand': brand, 'condition': condition,
                    'original_price': original_price, 'used_duration': age_years,
                    'user_lifespan': 5, 'build_quality': condition,
                    'usage_pattern': 'Moderate',
                })
                if predicted is None:
                    predicted = simple_price_estimate(category, original_price, age_years, condition)
            except Exception:
                predicted = simple_price_estimate(category, original_price, age_years, condition)
        else:
            predicted = simple_price_estimate(category, original_price, age_years, condition)

        # 3. Generate QR code
        qr_path = generate_qr_code(item_id)
        db.update_item_qr(item_id, qr_path, predicted)

        # 4. Award points (gamification)
        db.add_points(session['user_id'], 10)

        flash(
            f'Item reported! Estimated value: ₹{predicted:,.0f} | +10 points earned!',
            'success'
        )
        return redirect(url_for('item_detail', item_id=item_id))

    return render_template('report.html')


# ── Item detail page ────────────────────────────────────────────────────────

@app.route('/item/<int:item_id>')
@login_required
def item_detail(item_id):
    item = db.get_item_by_id(item_id)
    if not item:
        flash('Item not found.', 'error')
        return redirect(url_for('dashboard'))

    # Only the owner or an admin can view
    if item['user_id'] != session['user_id'] and session.get('role') != 'admin':
        flash('You do not have access to this item.', 'error')
        return redirect(url_for('dashboard'))

    vendors = db.get_all_vendors()
    return render_template('item_detail.html', item=item, vendors=vendors)


# ── Admin panel ─────────────────────────────────────────────────────────────

@app.route('/admin')
@login_required
@admin_required
def admin():
    status_filter   = request.args.get('status', '')
    category_filter = request.args.get('category', '')

    items     = db.get_all_items(
        status   = status_filter   or None,
        category = category_filter or None,
    )
    vendors   = db.get_all_vendors()
    campaigns = db.get_all_campaigns()
    leaderboard = db.get_leaderboard()

    # Quick stats (separate queries so filter doesn't affect them)
    all_items = db.get_all_items()
    stats = {
        'total':     len(all_items),
        'reported':  sum(1 for i in all_items if i['status'] == 'reported'),
        'approved':  sum(1 for i in all_items if i['status'] == 'approved'),
        'scheduled': sum(1 for i in all_items if i['status'] == 'scheduled'),
        'collected': sum(1 for i in all_items if i['status'] == 'collected'),
        'disposed':  sum(1 for i in all_items if i['status'] == 'disposed'),
    }

    return render_template(
        'admin.html',
        items           = items,
        vendors         = vendors,
        campaigns       = campaigns,
        stats           = stats,
        leaderboard     = leaderboard,
        status_filter   = status_filter,
        category_filter = category_filter,
    )


@app.route('/admin/item/<int:item_id>/update', methods=['POST'])
@login_required
@admin_required
def admin_update_item(item_id):
    new_status  = request.form.get('status')
    vendor_id   = request.form.get('vendor_id')
    pickup_date = request.form.get('pickup_date')

    db.update_item_status(
        item_id, new_status,
        int(vendor_id)  if vendor_id   else None,
        pickup_date     if pickup_date  else None,
    )
    flash(f'Item #{item_id} updated to "{new_status}".', 'success')
    return redirect(url_for('admin'))


@app.route('/admin/campaigns/create', methods=['POST'])
@login_required
@admin_required
def create_campaign():
    db.create_campaign(
        title        = request.form.get('title'),
        description  = request.form.get('description', ''),
        date         = request.form.get('date'),
        location     = request.form.get('location', ''),
        target_items = int(request.form.get('target_items', 50)),
        created_by   = session['user_id'],
    )
    flash('Campaign created!', 'success')
    return redirect(url_for('admin'))


@app.route('/admin/vendors/create', methods=['POST'])
@login_required
@admin_required
def create_vendor():
    db.create_vendor(
        name           = request.form.get('name'),
        email          = request.form.get('email'),
        phone          = request.form.get('phone', ''),
        specialization = request.form.get('specialization', 'All'),
    )
    flash('Vendor added!', 'success')
    return redirect(url_for('admin'))


@app.route('/admin/report/download')
@login_required
@admin_required
def download_report():
    """Generate and stream a CSV compliance report."""
    items  = db.get_all_items()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        'ID', 'Category', 'Brand', 'Model', 'Condition (1-5)',
        'Age (Years)', 'Department', 'Status', 'Classification',
        'Original Price (₹)', 'Predicted Price (₹)',
        'Reporter', 'Date Reported', 'Pickup Date',
    ])
    for item in items:
        writer.writerow([
            item['id'], item['category'], item['brand'], item['model_name'],
            item['condition'], item['age_years'], item['department'],
            item['status'], item['classification'],
            item['original_price'], item['predicted_price'],
            item['reporter_name'], item['created_at'], item['pickup_date'] or '',
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={
            'Content-Disposition':
                f'attachment; filename=ewaste_compliance_report_{datetime.now().strftime("%Y%m%d")}.csv'
        },
    )


# ── Vendor scan ─────────────────────────────────────────────────────────────

@app.route('/vendor/scan', methods=['GET', 'POST'])
@login_required
@vendor_or_admin_required
def vendor_scan():
    scanned_item = None

    if request.method == 'POST':
        item_id_str = request.form.get('item_id', '').strip()
        action      = request.form.get('action', '')

        try:
            item = db.get_item_by_id(int(item_id_str))
            if item:
                if action in ('collected', 'disposed'):
                    db.update_item_status(int(item_id_str), action)
                    flash(f'Item #{item_id_str} marked as {action}.', 'success')
                scanned_item = db.get_item_by_id(int(item_id_str))
            else:
                flash(f'No item found with ID #{item_id_str}. Check the QR code.', 'error')
        except (ValueError, TypeError):
            flash('Please enter a valid numeric item ID.', 'error')

    return render_template('vendor_scan.html', scanned_item=scanned_item)


# ── Campaigns (public) ──────────────────────────────────────────────────────

@app.route('/campaigns')
def campaigns():
    all_campaigns = db.get_all_campaigns()
    return render_template('campaigns.html', campaigns=all_campaigns)


# ── Analytics ───────────────────────────────────────────────────────────────

@app.route('/analytics')
def analytics():
    return render_template('analytics.html')


@app.route('/api/analytics')
def api_analytics():
    """Returns JSON data consumed by Chart.js on the analytics page."""
    return jsonify(db.get_analytics_data())


# ── ML price-prediction API ──────────────────────────────────────────────────

@app.route('/api/predict-price', methods=['POST'])
@login_required
def api_predict_price():
    """
    POST JSON: { category, brand, condition, age_years, original_price }
    Returns:   { predicted_price, formatted, ml_used }
    """
    data           = request.get_json(force=True)
    category       = data.get('category', 'Laptop')
    brand          = data.get('brand', 'HP')
    condition      = int(data.get('condition', 3))
    age_years      = float(data.get('age_years', 2))
    original_price = float(data.get('original_price', 50000))

    if ML_AVAILABLE and price_predictor:
        try:
            predicted = price_predictor.predict_price({
                'category': category, 'brand': brand, 'condition': condition,
                'original_price': original_price, 'used_duration': age_years,
                'user_lifespan': 5, 'build_quality': condition,
                'usage_pattern': 'Moderate',
            })
            if predicted is None:
                predicted = simple_price_estimate(category, original_price, age_years, condition)
        except Exception:
            predicted = simple_price_estimate(category, original_price, age_years, condition)
    else:
        predicted = simple_price_estimate(category, original_price, age_years, condition)

    return jsonify({
        'predicted_price': predicted,
        'formatted':       f'₹{predicted:,.0f}',
        'ml_used':         ML_AVAILABLE,
    })


# ══════════════════════════════════════════════════════════════════════════
#  Entry point
# ══════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    db.init_db()
    print('\n' + '='*55)
    print('  Smart E-Waste Management System')
    print('='*55)
    print('  http://localhost:5000')
    print()
    print('  Default login credentials:')
    print('    Admin  --> admin@ewaste.com  / admin123')
    print('    Vendor --> vendor@ewaste.com / vendor123')
    print('    User   --> user@ewaste.com   / user123')
    print('='*55 + '\n')
    app.run(debug=True, host='0.0.0.0', port=5000)
