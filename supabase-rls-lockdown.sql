-- Remove the old wide-open policies
drop policy if exists "Enable all access for all users on quizzes" on quizzes;
drop policy if exists "Enable all access for all users on questions" on questions;
drop policy if exists "Enable all access for all users on options" on options;
drop policy if exists "Enable all access for all users on participants" on participants;
drop policy if exists "Enable all access for all users on admins" on admins;

-- quizzes, questions, options, admins: NO anon access at all.
-- All access goes through service-role server endpoints, which bypass RLS.
-- (With RLS enabled and zero policies, the anon role is denied by default.)

-- participants: anon may READ only (leaderboard + realtime + own-record lookup).
-- Inserts happen via the service-role finish endpoint, so no anon insert policy.
create policy "anon read participants" on participants
  for select using (true);
