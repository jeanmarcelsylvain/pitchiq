-- PitchIQ Sample Seed Data
-- Run AFTER schema.sql

-- Demo user (Firebase UID is a placeholder — replace with real UID from your Firebase console)
INSERT INTO users (id, firebase_uid, email, display_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo-firebase-uid', 'alex@pitchiq.dev', 'Alex Rivera')
ON CONFLICT (firebase_uid) DO NOTHING;

-- Player profile
INSERT INTO player_profiles (user_id, name, age, height, weight, dominant_foot, primary_position, secondary_position, club, jersey_number, nationality, bio)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Alex Rivera', 18, 178, 72, 'right', 'CM', 'CAM',
  'FC United Academy', 8, 'USA',
  'Central midfielder with a focus on technical play and game intelligence.'
)
ON CONFLICT (user_id) DO NOTHING;

-- Matches (8 matches, current season)
INSERT INTO matches (user_id, date, opponent, competition, venue, result, team_score, opponent_score, position, minutes_played, goals, assists, shots, shots_on_target, pass_accuracy, tackles, interceptions, distance_covered, sprint_speed, rating, notes)
VALUES
  ('00000000-0000-0000-0000-000000000001','2024-01-06','Riverview FC','ECNL Regional','home','win',3,1,'CM',90,1,2,4,2,87,5,3,11.2,31.4,8.5,'Best game of the season. Controlled midfield all match.'),
  ('00000000-0000-0000-0000-000000000001','2023-12-30','Metro United','ECNL Regional','away','draw',1,1,'CM',85,0,1,2,1,82,7,4,10.8,30.9,7.0,'Tough away game. High press disrupted rhythm.'),
  ('00000000-0000-0000-0000-000000000001','2023-12-23','Eastside SC','State Cup','neutral','win',2,0,'CAM',90,1,1,5,3,84,3,2,11.5,32.1,8.0,'Played higher as a 10. Felt natural.'),
  ('00000000-0000-0000-0000-000000000001','2023-12-16','Highland FC','ECNL Regional','home','win',4,2,'CM',90,2,0,6,4,79,4,3,10.9,30.2,8.2,'Two goals from set pieces.'),
  ('00000000-0000-0000-0000-000000000001','2023-12-09','Bay City FC','ECNL Regional','away','loss',0,2,'CM',75,0,0,1,0,74,6,2,9.8,29.8,5.5,'Poor performance. Could not create chances.'),
  ('00000000-0000-0000-0000-000000000001','2023-12-02','Coastal United','Friendly','home','win',3,0,'CM',60,0,2,2,1,89,3,1,7.2,30.5,7.8,'Sharp in 60 mins. High pass accuracy.'),
  ('00000000-0000-0000-0000-000000000001','2023-11-25','Northside Academy','ECNL Regional','away','win',2,1,'CDM',90,0,1,1,0,86,9,5,12.1,29.5,7.5,'Played deeper as CDM. Key interceptions.'),
  ('00000000-0000-0000-0000-000000000001','2023-11-18','Parkview SC','ECNL Regional','home','win',5,1,'CAM',90,3,1,7,5,81,2,1,11.0,31.8,9.5,'Hat trick game! Unstoppable in the final third.');

-- Training sessions
INSERT INTO training_sessions (user_id, date, type, duration, intensity, focus, notes)
VALUES
  ('00000000-0000-0000-0000-000000000001','2024-01-07','technical',90,4,'{"Passing","First Touch"}',NULL),
  ('00000000-0000-0000-0000-000000000001','2024-01-05','fitness',60,5,'{"Sprint Training","Stamina"}',NULL),
  ('00000000-0000-0000-0000-000000000001','2024-01-04','team',90,3,'{"Tactical Shape","Set Pieces"}',NULL),
  ('00000000-0000-0000-0000-000000000001','2024-01-02','individual',45,3,'{"Shooting","Finishing"}',NULL),
  ('00000000-0000-0000-0000-000000000001','2023-12-28','technical',75,4,'{"Dribbling","Ball Control"}',NULL),
  ('00000000-0000-0000-0000-000000000001','2023-12-26','team',90,3,'{"Pressing","Counter Attack"}',NULL);

-- Season goals
INSERT INTO goals (user_id, title, description, category, target_value, current_value, unit, deadline)
VALUES
  ('00000000-0000-0000-0000-000000000001','Score 15 Goals This Season','Hit double digits and reach 15 total goals','scoring',15,7,'goals','2024-05-31'),
  ('00000000-0000-0000-0000-000000000001','Maintain 85% Pass Accuracy','Consistently hit above 85% pass accuracy across matches','passing',85,83,'%',NULL),
  ('00000000-0000-0000-0000-000000000001','Train 4x Per Week','Build discipline with consistent weekly training','training',4,3.5,'sessions/week',NULL),
  ('00000000-0000-0000-0000-000000000001','Play 1,000 Minutes','Accumulate 1,000 minutes of competitive match time','minutes',1000,670,'minutes','2024-05-31'),
  ('00000000-0000-0000-0000-000000000001','Reach 32 km/h Sprint Speed','Improve top speed through sprint training','fitness',32,31.4,'km/h',NULL),
  ('00000000-0000-0000-0000-000000000001','Record 10 Assists','Become the key creator with 10 assists','scoring',10,8,'assists','2024-05-31');

-- Pre-generated insights
INSERT INTO insights (user_id, type, title, body, metric, change_percent)
VALUES
  ('00000000-0000-0000-0000-000000000001','improvement','Sprint Speed Up 6.3%','Your average sprint speed has increased from 29.6 km/h to 31.4 km/h over the last 4 matches — a 6.3% improvement.','sprintSpeed',6.3),
  ('00000000-0000-0000-0000-000000000001','achievement','Hat Trick vs Parkview SC','Your 3-goal, 1-assist performance (rated 9.5/10) against Parkview SC is your best single-match output this season.','goals',NULL),
  ('00000000-0000-0000-0000-000000000001','trend','CAM Outperforms CM','When playing CAM, your average rating is 8.75 vs 7.3 at CM. You also average more goals (1.5 vs 0.5) in the #10 role.','rating',NULL),
  ('00000000-0000-0000-0000-000000000001','warning','Pass Accuracy Below Target','Your pass accuracy (83% avg) is 2 points below your 85% goal. Focus on shorter, higher-percentage passes under pressure.','passAccuracy',NULL);

-- Season statistics aggregate
INSERT INTO season_statistics (user_id, season_label, matches, minutes_played, goals, assists, avg_pass_accuracy, avg_rating, avg_sprint_speed, total_distance, training_sessions)
VALUES ('00000000-0000-0000-0000-000000000001','2023-24',8,670,7,8,83.0,7.75,30.8,84.5,18)
ON CONFLICT (user_id, season_label) DO UPDATE SET
  matches = EXCLUDED.matches,
  minutes_played = EXCLUDED.minutes_played,
  goals = EXCLUDED.goals,
  assists = EXCLUDED.assists,
  updated_at = NOW();
