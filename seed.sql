-- Create Faculties Table
CREATE TABLE IF NOT EXISTS faculties (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Then run the previous seed script for inserts
-- 1. Insert Faculties
INSERT INTO faculties (name, code) VALUES
('Agriculture', 'AGR'),
('Arts', 'ART'),
('Basic Medical Sciences', 'BMS'),
('Clinical Sciences', 'CLS'),
('Communication and Information Sciences', 'CIS'),
('Education', 'EDU'),
('Engineering and Technology', 'ENG'),
('Environmental Sciences', 'ENV'),
('Law', 'LAW'),
('Life Sciences', 'LIF'),
('Management Sciences', 'MGT'),
('Pharmaceutical Sciences', 'PHA'),
('Physical Sciences', 'PHY'),
('Social Sciences', 'SOC'),
('Veterinary Medicine', 'VET')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Departments
-- Ensure faculty names match exactly
INSERT INTO departments (name, code, faculty) VALUES
('Computer Science', 'CSC', 'Communication and Information Sciences'),
('Mathematics', 'MTS', 'Physical Sciences'),
('Physics', 'PHY', 'Physical Sciences'),
('Chemistry', 'CHM', 'Physical Sciences'),
('Microbiology', 'MCB', 'Life Sciences'),
('Plant Biology', 'PLB', 'Life Sciences'),
('Zoology', 'ZLY', 'Life Sciences'),
('Biochemistry', 'BCH', 'Life Sciences'),
('Anatomy', 'ANA', 'Basic Medical Sciences'),
('Physiology', 'PHS', 'Basic Medical Sciences'),
('Medicine', 'MED', 'Clinical Sciences'),
('Surgery', 'SUR', 'Clinical Sciences'),
('Pharmacy', 'PHA', 'Pharmaceutical Sciences'),
('Civil Engineering', 'CVE', 'Engineering and Technology'),
('Electrical Engineering', 'EEE', 'Engineering and Technology'),
('Mechanical Engineering', 'MEE', 'Engineering and Technology'),
('Accounting', 'ACC', 'Management Sciences'),
('Finance', 'FIN', 'Management Sciences'),
('Economics', 'ECO', 'Social Sciences'),
('Political Science', 'POL', 'Social Sciences'),
('English', 'ENG', 'Arts'),
('History', 'HIS', 'Arts'),
('Education', 'EDU', 'Education')
ON CONFLICT (name) DO NOTHING;
