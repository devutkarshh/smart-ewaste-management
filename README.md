# EcoByte — Smart E-Waste Management System ♻️

Electronic waste (e-waste) poses serious environmental and health risks when not managed properly.
This project provides a **centralized platform** for managing, tracking, and recycling e-waste in residential complexes, academic campuses, and similar institutions.

## 🚀 Features

- **Centralized E-Waste Management Portal** – Log, track, and manage disposal of e-waste items by department, category, and age.
- **QR Code-Based Tagging** – Assign unique QR codes to each e-waste item for seamless tracking from reporting to disposal/recycling.
- **Smart Categorization & Scheduling** – Automatically classify items (recyclable, reusable, hazardous) and schedule pickups or recycling drives with vendors.
- **Compliance & Reporting** – One-click CSV report generation aligned with CPCB and E-Waste (Management) Rules.
- **User Engagement & Awareness** – Campaign module with sustainability education, collection drives, leaderboards, and incentive points.
- **Data Analytics Dashboard** – Visualize e-waste trends, recovery rates, and environmental impact using Chart.js.
- **💡 Machine Learning Module** – Random Forest model predicts the resale price of e-waste items to encourage responsible disposal.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Plain HTML + CSS + Vanilla JavaScript |
| **Backend** | Python + Flask (micro web framework) |
| **Database** | SQLite (via Python's built-in `sqlite3`) |
| **Templating** | Jinja2 (Flask's default template engine) |
| **ML Model** | scikit-learn — Random Forest Regressor |
| **QR Codes** | Python `qrcode` library |
| **Charts** | Chart.js (CDN, no install) |
| **Auth** | Flask sessions + Werkzeug password hashing |

## 📁 Project Structure

```
smart-ewaste-management/
├── app.py            ← Flask server (all routes)
├── database.py       ← SQLite DB layer (all CRUD functions)
├── requirements.txt  ← Python dependencies
├── ewaste.db         ← SQLite database file (auto-created on first run)
├── ml/
│   ├── price_predictor.py   ← ML prediction service
│   ├── train_model.py       ← Model training script
│   ├── expiry_price_data.csv
│   └── models/              ← Saved .pkl model files (after training)
├── static/
│   ├── css/style.css        ← All styling (dark eco-green theme)
│   ├── js/app.js            ← Client-side JavaScript
│   └── qrcodes/             ← Generated QR code images
└── templates/               ← Jinja2 HTML templates
    ├── base.html
    ├── index.html
    ├── login.html
    ├── signup.html
    ├── dashboard.html
    ├── report.html
    ├── item_detail.html
    ├── admin.html
    ├── analytics.html
    ├── campaigns.html
    └── vendor_scan.html
```

## ⚡ Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. (Optional) Train the ML model
```bash
cd ml
python train_model.py
cd ..
```
> If skipped, the app falls back to a depreciation-formula price estimate.

### 3. Run the app
```bash
python app.py
```

### 4. Open in browser
```
http://localhost:5000
```

## 🔑 Default Login Credentials

| Role   | Email                 | Password   |
|--------|-----------------------|------------|
| Admin  | admin@ewaste.com      | admin123   |
| Vendor | vendor@ewaste.com     | vendor123  |
| User   | user@ewaste.com       | user123    |

## 👤 User Roles

| Role   | Permissions |
|--------|-------------|
| User   | Report items, view own items, see campaigns |
| Vendor | Scan QR codes, mark items collected/disposed |
| Admin  | Full access: approve items, assign vendors, create campaigns, download reports |

## 🌍 Impact

- Promotes sustainable e-waste management in institutions
- Reduces landfill dumping of hazardous electronic waste
- Encourages recycling and reuse through awareness campaigns
- Assists organizations with CPCB regulatory compliance

## 📊 Future Scope

- Mobile app for on-the-go QR scanning
- Integration with certified recycling vendor APIs
- AI-based predictive analytics for waste volume forecasting
- Email/SMS notifications for pickup schedules
