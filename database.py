"""
database.py — SQLite database layer for Smart E-Waste Management System
Uses Python's built-in sqlite3 module. No external DB server needed.
"""

import sqlite3
import os
import random
from datetime import datetime, timedelta

# Path to the SQLite database file (created automatically on first run)
DB_PATH = os.path.join(os.path.dirname(__file__), 'ewaste.db')


def get_db():
    """
    Get a database connection.
    sqlite3.Row lets us access columns by name (like a dict): row['email']
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def classify_item(category):
    """
    Auto-classify an e-waste item based on its category.
    Returns: 'reusable', 'recyclable', or 'hazardous'
    """
    classification_map = {
        'Laptop': 'reusable',
        'Smartphone': 'reusable',
        'Tablet': 'reusable',
        'Desktop': 'reusable',
        'Monitor': 'recyclable',
        'Printer': 'recyclable',
        'TV': 'recyclable',
        'Air Conditioner': 'recyclable',
        'Refrigerator': 'recyclable',
        'Washing Machine': 'recyclable',
        'Microwave': 'recyclable',
        'Router/Modem': 'recyclable',
        'Keyboard/Mouse': 'recyclable',
        'Projector': 'recyclable',
        'Camera': 'reusable',
        'Battery': 'hazardous',
        'CFL/LED Bulb': 'hazardous',
        'Toner Cartridge': 'hazardous',
        'UPS': 'hazardous',
        'Other': 'recyclable',
    }
    return classification_map.get(category, 'recyclable')


def init_db():
    """
    Create all tables and seed default data.
    Called once when the app starts.
    """
    conn = get_db()
    c = conn.cursor()

    # Create tables using executescript (runs multiple SQL statements at once)
    c.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            email       TEXT    UNIQUE NOT NULL,
            password_hash TEXT  NOT NULL,
            role        TEXT    DEFAULT 'user',
            department  TEXT    DEFAULT 'General',
            points      INTEGER DEFAULT 0,
            created_at  TEXT    DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS items (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            category        TEXT    NOT NULL,
            brand           TEXT    DEFAULT 'Unknown',
            model_name      TEXT    DEFAULT '',
            condition       INTEGER DEFAULT 3,
            age_years       REAL    DEFAULT 1.0,
            original_price  REAL    DEFAULT 0.0,
            classification  TEXT    DEFAULT 'recyclable',
            status          TEXT    DEFAULT 'reported',
            department      TEXT    DEFAULT 'General',
            description     TEXT    DEFAULT '',
            qr_code_path    TEXT    DEFAULT '',
            predicted_price REAL    DEFAULT 0.0,
            vendor_id       INTEGER,
            pickup_date     TEXT,
            created_at      TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS campaigns (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            title        TEXT NOT NULL,
            description  TEXT DEFAULT '',
            date         TEXT NOT NULL,
            location     TEXT DEFAULT '',
            target_items INTEGER DEFAULT 50,
            created_by   INTEGER,
            created_at   TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS vendors (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT NOT NULL,
            email           TEXT UNIQUE NOT NULL,
            phone           TEXT DEFAULT '',
            specialization  TEXT DEFAULT 'All',
            rating          REAL DEFAULT 4.0,
            items_handled   INTEGER DEFAULT 0,
            created_at      TEXT DEFAULT (datetime('now'))
        );
    ''')

    conn.commit()

    # --- Seed default users ---
    # We import here to avoid circular imports at module level
    from werkzeug.security import generate_password_hash

    default_users = [
        ('Admin User',   'admin@ewaste.com',  generate_password_hash('admin123'),  'admin',  'IT Department'),
        ('Vendor Corp',  'vendor@ewaste.com', generate_password_hash('vendor123'), 'vendor', 'Recycling Corp'),
        ('Rahul Sharma', 'user@ewaste.com',   generate_password_hash('user123'),   'user',   'Computer Science'),
        ('Priya Singh',  'priya@ewaste.com',  generate_password_hash('user123'),   'user',   'Electronics Dept'),
    ]
    for user in default_users:
        try:
            c.execute(
                'INSERT INTO users (name, email, password_hash, role, department) VALUES (?,?,?,?,?)',
                user
            )
        except sqlite3.IntegrityError:
            pass  # User already exists — skip

    # --- Seed vendors ---
    default_vendors = [
        ('GreenTech Recyclers', 'greentech@vendor.com', '+91-9876543210', 'Electronics', 4.5),
        ('EcoDispose India',    'ecodispose@vendor.com', '+91-9876543211', 'Hazardous',   4.2),
        ('CircularE Solutions', 'circulare@vendor.com',  '+91-9876543212', 'All',          4.8),
        ('ReNew Circuits',      'renew@vendor.com',      '+91-9876543213', 'Electronics',  4.3),
    ]
    for v in default_vendors:
        try:
            c.execute('INSERT INTO vendors (name,email,phone,specialization,rating) VALUES (?,?,?,?,?)', v)
        except sqlite3.IntegrityError:
            pass

    # --- Seed campaigns ---
    today = datetime.now()
    default_campaigns = [
        ('Campus E-Waste Drive 2024',
         'Collect and responsibly recycle all electronic waste from campus departments. '
         'Earn points for every item you drop off!',
         (today + timedelta(days=5)).strftime('%Y-%m-%d'),
         'Main Campus Ground, Block A', 100),
        ('Green Lab Initiative',
         'Lab equipment disposal drive for science and engineering departments. '
         'Hazardous items collected separately.',
         (today + timedelta(days=12)).strftime('%Y-%m-%d'),
         'Science Block, Lab 3', 50),
        ('Faculty E-Cleanup Day',
         'Awareness campaign and collection event for faculty e-waste. '
         'Certified recycling partners present.',
         (today + timedelta(days=20)).strftime('%Y-%m-%d'),
         'Staff Room, Block B', 75),
        ('Battery & Bulb Collection',
         'Special drive for hazardous items: batteries, CFLs, and toner cartridges.',
         (today + timedelta(days=30)).strftime('%Y-%m-%d'),
         'Central Library Foyer', 200),
    ]
    for camp in default_campaigns:
        try:
            c.execute(
                'INSERT INTO campaigns (title,description,date,location,target_items,created_by) VALUES (?,?,?,?,?,1)',
                camp
            )
        except Exception:
            pass

    # --- Seed sample items (only if table is empty) ---
    c.execute('SELECT COUNT(*) FROM items')
    if c.fetchone()[0] == 0:
        categories  = ['Laptop', 'Smartphone', 'Desktop', 'Monitor', 'Printer',
                        'Tablet', 'Keyboard/Mouse', 'UPS', 'TV', 'Battery',
                        'Air Conditioner', 'Projector']
        brands      = ['Dell', 'HP', 'Apple', 'Samsung', 'Lenovo',
                        'Canon', 'LG', 'Sony', 'Asus', 'Acer']
        departments = ['Computer Science', 'Electrical Engineering', 'Physics Lab',
                        'Admin Office', 'Library', 'Chemistry Lab', 'Maths Dept']
        statuses    = ['reported', 'reported', 'approved', 'scheduled', 'collected', 'disposed']

        for i in range(25):
            cat    = categories[i % len(categories)]
            status = statuses[i % len(statuses)]
            user_id = 3 if i < 15 else 4   # split between Rahul and Priya
            c.execute('''
                INSERT INTO items
                  (user_id, category, brand, condition, age_years, original_price,
                   classification, status, department, description, predicted_price,
                   created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,datetime('now',?))
            ''', (
                user_id,
                cat,
                brands[i % len(brands)],
                random.randint(1, 5),
                round(random.uniform(1, 8), 1),
                round(random.uniform(5000, 80000), 0),
                classify_item(cat),
                status,
                departments[i % len(departments)],
                f'Old {cat} scheduled for disposal.',
                round(random.uniform(1000, 20000), 0),
                f'-{i * 15} days',
            ))

    conn.commit()
    conn.close()
    print('[OK] Database initialized successfully.')


# =====================================================================
#  USER functions
# =====================================================================

def create_user(name, email, password_hash, role='user', department='General'):
    """Insert a new user. Returns new user_id or None if email already exists."""
    conn = get_db()
    try:
        c = conn.execute(
            'INSERT INTO users (name,email,password_hash,role,department) VALUES (?,?,?,?,?)',
            (name, email, password_hash, role, department)
        )
        conn.commit()
        return c.lastrowid
    except sqlite3.IntegrityError:
        return None      # Email already taken
    finally:
        conn.close()


def get_user_by_email(email):
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    return user


def get_user_by_id(user_id):
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return user


def add_points(user_id, points):
    """Award gamification points to a user."""
    conn = get_db()
    conn.execute('UPDATE users SET points = points + ? WHERE id = ?', (points, user_id))
    conn.commit()
    conn.close()


def get_leaderboard():
    """Top 10 users ranked by points."""
    conn = get_db()
    rows = conn.execute(
        "SELECT name, department, points FROM users WHERE role='user' ORDER BY points DESC LIMIT 10"
    ).fetchall()
    conn.close()
    return rows


# =====================================================================
#  ITEM functions
# =====================================================================

def create_item(user_id, category, brand, model_name, condition,
                age_years, original_price, department, description):
    """Insert a new e-waste item. Returns new item_id."""
    classification = classify_item(category)
    conn = get_db()
    c = conn.execute('''
        INSERT INTO items
          (user_id,category,brand,model_name,condition,age_years,
           original_price,classification,department,description)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    ''', (user_id, category, brand, model_name, condition, age_years,
          original_price, classification, department, description))
    conn.commit()
    item_id = c.lastrowid
    conn.close()
    return item_id


def get_item_by_id(item_id):
    conn = get_db()
    item = conn.execute('SELECT * FROM items WHERE id = ?', (item_id,)).fetchone()
    conn.close()
    return item


def get_items_by_user(user_id):
    conn = get_db()
    items = conn.execute(
        'SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC', (user_id,)
    ).fetchall()
    conn.close()
    return items


def get_all_items(status=None, category=None, department=None):
    """Fetch all items with reporter name/email joined in."""
    conn = get_db()
    query = '''
        SELECT items.*, users.name AS reporter_name, users.email AS reporter_email
        FROM items
        JOIN users ON items.user_id = users.id
    '''
    conditions, params = [], []
    if status:
        conditions.append('items.status = ?');   params.append(status)
    if category:
        conditions.append('items.category = ?'); params.append(category)
    if department:
        conditions.append('items.department = ?'); params.append(department)
    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
    query += ' ORDER BY items.created_at DESC'

    items = conn.execute(query, params).fetchall()
    conn.close()
    return items


def update_item_status(item_id, status, vendor_id=None, pickup_date=None):
    conn = get_db()
    if vendor_id and pickup_date:
        conn.execute(
            'UPDATE items SET status=?,vendor_id=?,pickup_date=? WHERE id=?',
            (status, vendor_id, pickup_date, item_id)
        )
    elif vendor_id:
        conn.execute('UPDATE items SET status=?,vendor_id=? WHERE id=?', (status, vendor_id, item_id))
    else:
        conn.execute('UPDATE items SET status=? WHERE id=?', (status, item_id))
    conn.commit()
    conn.close()


def update_item_qr(item_id, qr_path, predicted_price=None):
    conn = get_db()
    if predicted_price is not None:
        conn.execute('UPDATE items SET qr_code_path=?,predicted_price=? WHERE id=?',
                     (qr_path, predicted_price, item_id))
    else:
        conn.execute('UPDATE items SET qr_code_path=? WHERE id=?', (qr_path, item_id))
    conn.commit()
    conn.close()


# =====================================================================
#  CAMPAIGN functions
# =====================================================================

def create_campaign(title, description, date, location, target_items, created_by):
    conn = get_db()
    c = conn.execute(
        'INSERT INTO campaigns (title,description,date,location,target_items,created_by) VALUES (?,?,?,?,?,?)',
        (title, description, date, location, target_items, created_by)
    )
    conn.commit()
    campaign_id = c.lastrowid
    conn.close()
    return campaign_id


def get_all_campaigns():
    conn = get_db()
    rows = conn.execute('SELECT * FROM campaigns ORDER BY date ASC').fetchall()
    conn.close()
    return rows


def get_upcoming_campaigns(limit=6):
    conn = get_db()
    today = datetime.now().strftime('%Y-%m-%d')
    rows = conn.execute(
        'SELECT * FROM campaigns WHERE date >= ? ORDER BY date ASC LIMIT ?',
        (today, limit)
    ).fetchall()
    conn.close()
    return rows


# =====================================================================
#  VENDOR functions
# =====================================================================

def get_all_vendors():
    conn = get_db()
    rows = conn.execute('SELECT * FROM vendors ORDER BY name ASC').fetchall()
    conn.close()
    return rows


def create_vendor(name, email, phone, specialization):
    conn = get_db()
    try:
        c = conn.execute(
            'INSERT INTO vendors (name,email,phone,specialization) VALUES (?,?,?,?)',
            (name, email, phone, specialization)
        )
        conn.commit()
        return c.lastrowid
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


# =====================================================================
#  ANALYTICS function
# =====================================================================

def get_analytics_data():
    """Aggregate all stats needed for the analytics dashboard."""
    conn = get_db()

    by_category = conn.execute(
        'SELECT category, COUNT(*) AS count FROM items GROUP BY category ORDER BY count DESC'
    ).fetchall()

    by_status = conn.execute(
        'SELECT status, COUNT(*) AS count FROM items GROUP BY status'
    ).fetchall()

    by_classification = conn.execute(
        'SELECT classification, COUNT(*) AS count FROM items GROUP BY classification'
    ).fetchall()

    by_department = conn.execute(
        'SELECT department, COUNT(*) AS count FROM items GROUP BY department ORDER BY count DESC LIMIT 8'
    ).fetchall()

    # Monthly trend for last 6 months
    monthly = conn.execute('''
        SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
        FROM items
        WHERE created_at >= datetime('now', '-6 months')
        GROUP BY month
        ORDER BY month ASC
    ''').fetchall()

    # Totals
    total_items = conn.execute('SELECT COUNT(*) FROM items').fetchone()[0]
    disposed    = conn.execute("SELECT COUNT(*) FROM items WHERE status='disposed'").fetchone()[0]
    collected   = conn.execute("SELECT COUNT(*) FROM items WHERE status IN ('collected','disposed')").fetchone()[0]
    total_value = conn.execute('SELECT COALESCE(SUM(predicted_price),0) FROM items').fetchone()[0]

    conn.close()

    return {
        'by_category':       [dict(r) for r in by_category],
        'by_status':         [dict(r) for r in by_status],
        'by_classification': [dict(r) for r in by_classification],
        'by_department':     [dict(r) for r in by_department],
        'monthly':           [dict(r) for r in monthly],
        'total_items':       total_items,
        'disposed':          disposed,
        'collected':         collected,
        'total_value':       round(float(total_value), 2),
        'kg_diverted':       round(collected * 2.3, 1),   # avg 2.3 kg per device
        'co2_saved':         round(collected * 1.5, 1),   # avg 1.5 kg CO2 per device
    }
