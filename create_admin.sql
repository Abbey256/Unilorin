-- Create Admin User Script
-- Run this in your Supabase SQL Editor

INSERT INTO users (
  staff_id, 
  password, 
  role, 
  name,
  email
) VALUES (
  'admin', 
  '$2b$10$ZsfeK.W2nsowJU26Ka1aNuFPWiKJxfX0rCKCDYhrUWsym0E3M4iAS', -- Hash for 'admin123'
  'admin', 
  'System Administrator',
  'admin@unilorin.edu.ng'
) ON CONFLICT (staff_id) DO NOTHING;

-- If you need to reset the password for an existing admin:
-- UPDATE users SET password = '$2b$10$ZsfeK.W2nsowJU26Ka1aNuFPWiKJxfX0rCKCDYhrUWsym0E3M4iAS' WHERE staff_id = 'admin';
