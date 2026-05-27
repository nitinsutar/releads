-- Run after creating matching Supabase Auth users, then replace each auth_id below
-- with the UUID generated in Authentication > Users.

insert into public.companies (id, name, city, email, phone, active, plan, payment_status) values
('11111111-1111-4111-8111-111111111111', 'Arihant Realty', 'Mumbai', 'hello@arihantrealty.in', '+91 22 4500 8800', true, 'Growth', 'Active');

insert into public.projects (id, company_id, name, city, location, status, brochure_url, units, available_units) values
('21111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Arihant Skyline', 'Mumbai', 'Powai', 'Active', '#', 180, 62),
('21111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 'Harbor Residences', 'Navi Mumbai', 'Seawoods', 'Active', '#', 120, 28);
