-- Update @curator: realistic dates, avatar, follow @amrith, join date

-- Fix join date and add avatar
UPDATE users SET
  created_at = '2026-03-01 09:00:00',
  avatar_url = 'https://assets.stem.md/curator.png'
WHERE id = 'usr_curator001';

-- Make @curator follow @amrith
INSERT OR IGNORE INTO user_follows (follower_id, following_id)
SELECT 'usr_curator001', id FROM users WHERE username = 'amrith';

-- Stagger stem creation dates (1-3 per day from March 1-14)
UPDATE stems SET created_at = '2026-03-01 10:15:00', updated_at = '2026-03-01 14:30:00' WHERE id = 'stm_cur_0001';
UPDATE stems SET created_at = '2026-03-01 16:45:00', updated_at = '2026-03-01 20:10:00' WHERE id = 'stm_cur_0002';
UPDATE stems SET created_at = '2026-03-02 09:30:00', updated_at = '2026-03-02 11:45:00' WHERE id = 'stm_cur_0003';
UPDATE stems SET created_at = '2026-03-02 14:20:00', updated_at = '2026-03-03 09:15:00' WHERE id = 'stm_cur_0004';
UPDATE stems SET created_at = '2026-03-03 11:00:00', updated_at = '2026-03-03 15:30:00' WHERE id = 'stm_cur_0005';
UPDATE stems SET created_at = '2026-03-04 08:45:00', updated_at = '2026-03-04 12:20:00' WHERE id = 'stm_cur_0006';
UPDATE stems SET created_at = '2026-03-04 19:10:00', updated_at = '2026-03-05 10:00:00' WHERE id = 'stm_cur_0007';
UPDATE stems SET created_at = '2026-03-05 13:30:00', updated_at = '2026-03-06 08:45:00' WHERE id = 'stm_cur_0008';
UPDATE stems SET created_at = '2026-03-06 10:00:00', updated_at = '2026-03-06 16:30:00' WHERE id = 'stm_cur_0009';
UPDATE stems SET created_at = '2026-03-07 09:15:00', updated_at = '2026-03-07 14:00:00' WHERE id = 'stm_cur_0010';
UPDATE stems SET created_at = '2026-03-07 20:30:00', updated_at = '2026-03-08 11:15:00' WHERE id = 'stm_cur_0011';
UPDATE stems SET created_at = '2026-03-08 15:00:00', updated_at = '2026-03-09 09:30:00' WHERE id = 'stm_cur_0012';
UPDATE stems SET created_at = '2026-03-09 12:45:00', updated_at = '2026-03-10 10:20:00' WHERE id = 'stm_cur_0013';
UPDATE stems SET created_at = '2026-03-10 14:30:00', updated_at = '2026-03-10 19:00:00' WHERE id = 'stm_cur_0014';
UPDATE stems SET created_at = '2026-03-11 09:00:00', updated_at = '2026-03-11 13:45:00' WHERE id = 'stm_cur_0015';
UPDATE stems SET created_at = '2026-03-12 10:30:00', updated_at = '2026-03-12 16:15:00' WHERE id = 'stm_cur_0016';
UPDATE stems SET created_at = '2026-03-12 21:00:00', updated_at = '2026-03-13 11:30:00' WHERE id = 'stm_cur_0017';
UPDATE stems SET created_at = '2026-03-13 14:15:00', updated_at = '2026-03-14 09:00:00' WHERE id = 'stm_cur_0018';
UPDATE stems SET created_at = '2026-03-14 11:30:00', updated_at = '2026-03-14 17:45:00' WHERE id = 'stm_cur_0019';
UPDATE stems SET created_at = '2026-03-14 20:00:00', updated_at = '2026-03-15 10:30:00' WHERE id = 'stm_cur_0020';

-- Stagger find dates within each stem (spread across the stem's active period)
-- Physics of everyday things (Mar 1)
UPDATE finds SET created_at = '2026-03-01 10:30:00' WHERE id = 'fnd_cur_n001';
UPDATE finds SET created_at = '2026-03-01 11:15:00' WHERE id = 'fnd_cur_n002';
UPDATE finds SET created_at = '2026-03-01 13:00:00' WHERE id = 'fnd_cur_n003';
UPDATE finds SET created_at = '2026-03-01 14:30:00' WHERE id = 'fnd_cur_n004';

-- Jazz harmony (Mar 1-2)
UPDATE finds SET created_at = '2026-03-01 17:00:00' WHERE id = 'fnd_cur_n005';
UPDATE finds SET created_at = '2026-03-01 17:30:00' WHERE id = 'fnd_cur_n006';
UPDATE finds SET created_at = '2026-03-01 19:00:00' WHERE id = 'fnd_cur_n007';
UPDATE finds SET created_at = '2026-03-01 20:10:00' WHERE id = 'fnd_cur_n008';

-- History of the internet (Mar 2)
UPDATE finds SET created_at = '2026-03-02 09:45:00' WHERE id = 'fnd_cur_n009';
UPDATE finds SET created_at = '2026-03-02 10:10:00' WHERE id = 'fnd_cur_n010';
UPDATE finds SET created_at = '2026-03-02 10:50:00' WHERE id = 'fnd_cur_n011';
UPDATE finds SET created_at = '2026-03-02 11:45:00' WHERE id = 'fnd_cur_n012';

-- Deep sea biology (Mar 2-3)
UPDATE finds SET created_at = '2026-03-02 14:45:00' WHERE id = 'fnd_cur_n013';
UPDATE finds SET created_at = '2026-03-02 15:30:00' WHERE id = 'fnd_cur_n014';
UPDATE finds SET created_at = '2026-03-02 22:00:00' WHERE id = 'fnd_cur_n015';
UPDATE finds SET created_at = '2026-03-03 09:15:00' WHERE id = 'fnd_cur_n016';

-- Japanese aesthetics (Mar 3)
UPDATE finds SET created_at = '2026-03-03 11:20:00' WHERE id = 'fnd_cur_n017';
UPDATE finds SET created_at = '2026-03-03 12:00:00' WHERE id = 'fnd_cur_n018';
UPDATE finds SET created_at = '2026-03-03 13:45:00' WHERE id = 'fnd_cur_n019';
UPDATE finds SET created_at = '2026-03-03 15:30:00' WHERE id = 'fnd_cur_n020';

-- Mathematics of origami (Mar 4)
UPDATE finds SET created_at = '2026-03-04 09:00:00' WHERE id = 'fnd_cur_n021';
UPDATE finds SET created_at = '2026-03-04 10:30:00' WHERE id = 'fnd_cur_n022';
UPDATE finds SET created_at = '2026-03-04 12:20:00' WHERE id = 'fnd_cur_n023';

-- Modern urbanism (Mar 4-5)
UPDATE finds SET created_at = '2026-03-04 19:30:00' WHERE id = 'fnd_cur_n024';
UPDATE finds SET created_at = '2026-03-04 20:15:00' WHERE id = 'fnd_cur_n025';
UPDATE finds SET created_at = '2026-03-04 21:00:00' WHERE id = 'fnd_cur_n026';
UPDATE finds SET created_at = '2026-03-05 10:00:00' WHERE id = 'fnd_cur_n027';

-- Language and the mind (Mar 5-6)
UPDATE finds SET created_at = '2026-03-05 14:00:00' WHERE id = 'fnd_cur_n028';
UPDATE finds SET created_at = '2026-03-05 15:30:00' WHERE id = 'fnd_cur_n029';
UPDATE finds SET created_at = '2026-03-05 21:00:00' WHERE id = 'fnd_cur_n030';
UPDATE finds SET created_at = '2026-03-06 08:45:00' WHERE id = 'fnd_cur_n031';

-- Byzantine Empire (Mar 6)
UPDATE finds SET created_at = '2026-03-06 10:30:00' WHERE id = 'fnd_cur_n032';
UPDATE finds SET created_at = '2026-03-06 11:45:00' WHERE id = 'fnd_cur_n033';
UPDATE finds SET created_at = '2026-03-06 14:00:00' WHERE id = 'fnd_cur_n034';
UPDATE finds SET created_at = '2026-03-06 16:30:00' WHERE id = 'fnd_cur_n035';

-- Fermentation science (Mar 7)
UPDATE finds SET created_at = '2026-03-07 09:30:00' WHERE id = 'fnd_cur_n036';
UPDATE finds SET created_at = '2026-03-07 10:15:00' WHERE id = 'fnd_cur_n037';
UPDATE finds SET created_at = '2026-03-07 12:00:00' WHERE id = 'fnd_cur_n038';
UPDATE finds SET created_at = '2026-03-07 14:00:00' WHERE id = 'fnd_cur_n039';

-- Neuroscience of creativity (Mar 7-8)
UPDATE finds SET created_at = '2026-03-07 20:45:00' WHERE id = 'fnd_cur_n040';
UPDATE finds SET created_at = '2026-03-07 21:30:00' WHERE id = 'fnd_cur_n041';
UPDATE finds SET created_at = '2026-03-08 09:00:00' WHERE id = 'fnd_cur_n042';
UPDATE finds SET created_at = '2026-03-08 11:15:00' WHERE id = 'fnd_cur_n043';

-- History of typography (Mar 8-9)
UPDATE finds SET created_at = '2026-03-08 15:30:00' WHERE id = 'fnd_cur_n044';
UPDATE finds SET created_at = '2026-03-08 16:45:00' WHERE id = 'fnd_cur_n045';
UPDATE finds SET created_at = '2026-03-08 20:00:00' WHERE id = 'fnd_cur_n046';
UPDATE finds SET created_at = '2026-03-09 09:30:00' WHERE id = 'fnd_cur_n047';

-- Climate science (Mar 9-10)
UPDATE finds SET created_at = '2026-03-09 13:00:00' WHERE id = 'fnd_cur_n048';
UPDATE finds SET created_at = '2026-03-09 14:30:00' WHERE id = 'fnd_cur_n049';
UPDATE finds SET created_at = '2026-03-09 21:00:00' WHERE id = 'fnd_cur_n050';
UPDATE finds SET created_at = '2026-03-10 10:20:00' WHERE id = 'fnd_cur_n051';

-- Acoustic architecture (Mar 10)
UPDATE finds SET created_at = '2026-03-10 15:00:00' WHERE id = 'fnd_cur_n052';
UPDATE finds SET created_at = '2026-03-10 16:30:00' WHERE id = 'fnd_cur_n053';
UPDATE finds SET created_at = '2026-03-10 19:00:00' WHERE id = 'fnd_cur_n054';

-- Psychoacoustics (Mar 11)
UPDATE finds SET created_at = '2026-03-11 09:15:00' WHERE id = 'fnd_cur_n055';
UPDATE finds SET created_at = '2026-03-11 10:00:00' WHERE id = 'fnd_cur_n056';
UPDATE finds SET created_at = '2026-03-11 11:30:00' WHERE id = 'fnd_cur_n057';
UPDATE finds SET created_at = '2026-03-11 13:45:00' WHERE id = 'fnd_cur_n058';

-- The Silk Road (Mar 12)
UPDATE finds SET created_at = '2026-03-12 10:45:00' WHERE id = 'fnd_cur_n059';
UPDATE finds SET created_at = '2026-03-12 11:30:00' WHERE id = 'fnd_cur_n060';
UPDATE finds SET created_at = '2026-03-12 14:00:00' WHERE id = 'fnd_cur_n061';
UPDATE finds SET created_at = '2026-03-12 16:15:00' WHERE id = 'fnd_cur_n062';

-- Emergence (Mar 12-13)
UPDATE finds SET created_at = '2026-03-12 21:15:00' WHERE id = 'fnd_cur_n063';
UPDATE finds SET created_at = '2026-03-12 22:00:00' WHERE id = 'fnd_cur_n064';
UPDATE finds SET created_at = '2026-03-13 09:45:00' WHERE id = 'fnd_cur_n065';
UPDATE finds SET created_at = '2026-03-13 11:30:00' WHERE id = 'fnd_cur_n066';

-- Photography and seeing (Mar 13-14)
UPDATE finds SET created_at = '2026-03-13 14:30:00' WHERE id = 'fnd_cur_n067';
UPDATE finds SET created_at = '2026-03-13 15:45:00' WHERE id = 'fnd_cur_n068';
UPDATE finds SET created_at = '2026-03-13 20:00:00' WHERE id = 'fnd_cur_n069';
UPDATE finds SET created_at = '2026-03-14 09:00:00' WHERE id = 'fnd_cur_n070';

-- Roman infrastructure (Mar 14)
UPDATE finds SET created_at = '2026-03-14 11:45:00' WHERE id = 'fnd_cur_n071';
UPDATE finds SET created_at = '2026-03-14 13:00:00' WHERE id = 'fnd_cur_n072';
UPDATE finds SET created_at = '2026-03-14 15:30:00' WHERE id = 'fnd_cur_n073';
UPDATE finds SET created_at = '2026-03-14 17:45:00' WHERE id = 'fnd_cur_n074';

-- Science of color (Mar 14-15)
UPDATE finds SET created_at = '2026-03-14 20:15:00' WHERE id = 'fnd_cur_n075';
UPDATE finds SET created_at = '2026-03-14 21:00:00' WHERE id = 'fnd_cur_n076';
UPDATE finds SET created_at = '2026-03-14 22:30:00' WHERE id = 'fnd_cur_n077';
UPDATE finds SET created_at = '2026-03-15 10:30:00' WHERE id = 'fnd_cur_n078';
