-- Core tables
create table if not exists departments (
  department_id serial primary key,
  name text not null,
  location text
);

create table if not exists users (
  user_id uuid primary key,
  name text not null,
  email text unique,
  password_hash text,
  role text not null check (role in ('student','coordinator','admin','vendor')),
  department_id int references departments(department_id)
);

create table if not exists vendors (
  vendor_id uuid primary key,
  company_name text not null,
  contact_person text,
  email text,
  cpcb_registration_no text
);

create table if not exists ewaste_items (
  item_id uuid primary key,
  name text not null,
  description text,
  category text not null check (category in ('Tablet','Microwave','Air Conditioner','TV','Washing Machine','Laptop','Smartphone','Refrigerator')),
  status text not null check (status in ('Reported','Awaiting Pickup','Scheduled','Collected','Recycled','Refurbished','Safely Disposed')),
  reported_by_user_id text not null,
  department_id int references departments(department_id),
  reported_date timestamptz default now(),
  disposed_date timestamptz,
  qr_code_data text
);

create table if not exists pickups (
  pickup_id uuid primary key,
  vendor_id uuid references vendors(vendor_id),
  admin_id text not null,
  scheduled_date date not null,
  status text not null check (status in ('Scheduled','Completed')) default 'Scheduled'
);

create table if not exists pickup_items (
  id uuid primary key,
  pickup_id uuid references pickups(pickup_id) on delete cascade,
  item_id uuid references ewaste_items(item_id) on delete cascade
);

create table if not exists campaigns (
  campaign_id uuid primary key,
  title text not null,
  description text,
  start_date date,
  end_date date
);
