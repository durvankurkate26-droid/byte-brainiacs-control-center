-- ============================================================
-- Byte Brainiacs — 20 Sample Teams (for testing)
-- Run AFTER schema.sql, in Supabase SQL Editor
-- ============================================================

insert into public.teams
  (team_id, team_name, participant_1, participant_2, participant_3, attendance, checkin_time)
values
  ('BB001', 'Stack Overflowers', 'Krishna', 'Vihaan', 'Sai', false, NULL),
  ('BB002', 'Null Pointers', 'Arjun', 'Myra', 'Aryan', false, NULL),
  ('BB003', 'Segfault Squad', 'Riya', 'Diya', 'Ananya', false, NULL),
  ('BB004', 'Byte Me', 'Aryan', 'Reyansh', NULL, false, NULL),
  ('BB005', 'Kernel Panic', 'Naina', 'Mira', 'Myra', false, NULL),
  ('BB006', 'Recursive Raccoons', 'Aarav', 'Ishaan', 'Vivaan', false, NULL),
  ('BB007', 'Hash Brownies', 'Advait', 'Om', 'Priya', false, NULL),
  ('BB008', '404 Founders', 'Kabir', 'Rohan', NULL, false, NULL),
  ('BB009', 'Quantum Coders', 'Kiara', 'Rhea', 'Naina', false, NULL),
  ('BB010', 'The Loop Holes', 'Aryaman', 'Neha', 'Zoya', false, NULL),
  ('BB011', 'Async Avengers', 'Tara', 'Anika', 'Advait', false, NULL),
  ('BB012', 'Git Pushers', 'Karan', 'Anaya', NULL, false, NULL),
  ('BB013', 'Binary Bandits', 'Shaurya', 'Pari', 'Om', false, NULL),
  ('BB014', 'Code Red', 'Vivaan', 'Ira', 'Ishaan', false, NULL),
  ('BB015', 'Lazy Loaders', 'Sara', 'Priya', 'Reyansh', false, NULL),
  ('BB016', 'Merge Conflict', 'Veer', 'Aditya', NULL, false, NULL),
  ('BB017', 'Pixel Pirates', 'Aadhya', 'Zoya', 'Krishna', false, NULL),
  ('BB018', 'Syntax Error', 'Dev', 'Yash', 'Riya', false, NULL),
  ('BB019', 'Cache Me If You Can', 'Navya', 'Saanvi', 'Arjun', false, NULL),
  ('BB020', 'Infinite Loopers', 'Sai', 'Ananya', NULL, false, NULL)
on conflict (team_id) do nothing;
