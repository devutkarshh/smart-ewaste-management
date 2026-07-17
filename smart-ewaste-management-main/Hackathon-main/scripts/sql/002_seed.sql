insert into departments (name, location) values
  ('Computer Science', 'Block A'),
  ('Electrical', 'Block B'),
  ('Mechanical', 'Block C')
on conflict do nothing;

insert into vendors (vendor_id, company_name, contact_person, email, cpcb_registration_no) values
  ('00000000-0000-0000-0000-000000000001','GreenCycle Pvt Ltd','Asha','ops@greencycle.example','CPCB-12345'),
  ('00000000-0000-0000-0000-000000000002','EcoWaste Solutions','Ravi','contact@ecowaste.example','CPCB-67890')
on conflict do nothing;

-- Seed users for login demo
insert into users (user_id, name, email, password_hash, role, department_id) values
  ('55555555-5555-5555-5555-555555555555','Admin User','admin@example.com','240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9','admin',1),
  ('66666666-6666-6666-6666-666666666666','Student One','student1@example.com','703b0a3d6ad75b649a28adde7d83c6251da457549263bc7ff45ec709b0a8448b','student',1),
  ('77777777-7777-7777-7777-777777777777','Student Two','student2@example.com','703b0a3d6ad75b649a28adde7d83c6251da457549263bc7ff45ec709b0a8448b','student',2),
  ('88888888-8888-8888-8888-888888888888','Faculty One','faculty1@example.com','27041f5856c7387a997252694afb048d1aa939228ffcdbd6285b979b8da20e7a','coordinator',2),
  ('99999999-9999-9999-9999-999999999999','Vendor User','vendor1@example.com','00fc1e6c602824793c9840e781e5e20747507e26ddf0d60fab996567a0327cdf','vendor',null)
on conflict do nothing;

-- Seed a few ewaste items
insert into ewaste_items (item_id, name, description, category, status, reported_by_user_id, department_id, reported_date, disposed_date, qr_code_data) values
  ('11111111-1111-1111-1111-111111111111','Dell Latitude 5400','Old laptop from lab','Laptop','Reported','student1',1, now() - interval '10 days', null, 'http://localhost:3000/item/11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222','HP 24-inch Monitor','Cracked screen','Monitor','Awaiting Pickup','coordinator1',2, now() - interval '20 days', null, 'http://localhost:3000/item/22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333','Li-ion Battery','Swollen battery from old UPS','Battery','Recycled','coordinator2',2, now() - interval '40 days', now() - interval '5 days', 'http://localhost:3000/item/33333333-3333-3333-3333-333333333333'),
  ('44444444-4444-4444-4444-444444444444','Mixed Cables','Assorted HDMI/ethernet cables','Other','Safely Disposed','admin1',3, now() - interval '60 days', now() - interval '2 days', 'http://localhost:3000/item/44444444-4444-4444-4444-444444444444')
on conflict do nothing;
