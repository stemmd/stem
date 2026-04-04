-- Spread curator stems and finds across the last 10 days so they
-- appear naturally in the feed digest (Today, Yesterday, weekdays, Earlier)

-- Stems: spread from 10 days ago to today
UPDATE stems SET created_at = datetime('now', '-10 days', '+2 hours'), updated_at = datetime('now', '-10 days', '+6 hours') WHERE id = 'stm_cur_0001';
UPDATE stems SET created_at = datetime('now', '-10 days', '+8 hours'), updated_at = datetime('now', '-9 days', '+3 hours') WHERE id = 'stm_cur_0002';
UPDATE stems SET created_at = datetime('now', '-9 days', '+4 hours'), updated_at = datetime('now', '-9 days', '+9 hours') WHERE id = 'stm_cur_0003';
UPDATE stems SET created_at = datetime('now', '-8 days', '+1 hours'), updated_at = datetime('now', '-8 days', '+5 hours') WHERE id = 'stm_cur_0004';
UPDATE stems SET created_at = datetime('now', '-8 days', '+10 hours'), updated_at = datetime('now', '-7 days', '+2 hours') WHERE id = 'stm_cur_0005';
UPDATE stems SET created_at = datetime('now', '-7 days', '+3 hours'), updated_at = datetime('now', '-7 days', '+8 hours') WHERE id = 'stm_cur_0006';
UPDATE stems SET created_at = datetime('now', '-6 days', '+1 hours'), updated_at = datetime('now', '-6 days', '+6 hours') WHERE id = 'stm_cur_0007';
UPDATE stems SET created_at = datetime('now', '-6 days', '+9 hours'), updated_at = datetime('now', '-5 days', '+2 hours') WHERE id = 'stm_cur_0008';
UPDATE stems SET created_at = datetime('now', '-5 days', '+4 hours'), updated_at = datetime('now', '-5 days', '+8 hours') WHERE id = 'stm_cur_0009';
UPDATE stems SET created_at = datetime('now', '-4 days', '+2 hours'), updated_at = datetime('now', '-4 days', '+7 hours') WHERE id = 'stm_cur_0010';
UPDATE stems SET created_at = datetime('now', '-4 days', '+10 hours'), updated_at = datetime('now', '-3 days', '+3 hours') WHERE id = 'stm_cur_0011';
UPDATE stems SET created_at = datetime('now', '-3 days', '+5 hours'), updated_at = datetime('now', '-3 days', '+9 hours') WHERE id = 'stm_cur_0012';
UPDATE stems SET created_at = datetime('now', '-2 days', '+1 hours'), updated_at = datetime('now', '-2 days', '+6 hours') WHERE id = 'stm_cur_0013';
UPDATE stems SET created_at = datetime('now', '-2 days', '+8 hours'), updated_at = datetime('now', '-1 days', '+2 hours') WHERE id = 'stm_cur_0014';
UPDATE stems SET created_at = datetime('now', '-1 days', '+3 hours'), updated_at = datetime('now', '-1 days', '+7 hours') WHERE id = 'stm_cur_0015';
UPDATE stems SET created_at = datetime('now', '-1 days', '+9 hours'), updated_at = datetime('now', '-1 days', '+11 hours') WHERE id = 'stm_cur_0016';
UPDATE stems SET created_at = datetime('now', '-0 days', '+1 hours'), updated_at = datetime('now', '-0 days', '+4 hours') WHERE id = 'stm_cur_0017';
UPDATE stems SET created_at = datetime('now', '-0 days', '+5 hours'), updated_at = datetime('now', '-0 days', '+8 hours') WHERE id = 'stm_cur_0018';
UPDATE stems SET created_at = datetime('now', '-0 days', '+2 hours'), updated_at = datetime('now', '-0 days', '+6 hours') WHERE id = 'stm_cur_0019';
UPDATE stems SET created_at = datetime('now', '-0 days', '+7 hours'), updated_at = datetime('now', '-0 days', '+9 hours') WHERE id = 'stm_cur_0020';

-- Finds: match their stem's date range
-- stm_cur_0001 (10 days ago)
UPDATE finds SET created_at = datetime('now', '-10 days', '+2 hours') WHERE id = 'fnd_cur_n001';
UPDATE finds SET created_at = datetime('now', '-10 days', '+3 hours') WHERE id = 'fnd_cur_n002';
UPDATE finds SET created_at = datetime('now', '-10 days', '+4 hours') WHERE id = 'fnd_cur_n003';
UPDATE finds SET created_at = datetime('now', '-10 days', '+6 hours') WHERE id = 'fnd_cur_n004';
-- stm_cur_0002 (10-9 days ago)
UPDATE finds SET created_at = datetime('now', '-10 days', '+9 hours') WHERE id = 'fnd_cur_n005';
UPDATE finds SET created_at = datetime('now', '-10 days', '+10 hours') WHERE id = 'fnd_cur_n006';
UPDATE finds SET created_at = datetime('now', '-9 days', '+1 hours') WHERE id = 'fnd_cur_n007';
UPDATE finds SET created_at = datetime('now', '-9 days', '+3 hours') WHERE id = 'fnd_cur_n008';
-- stm_cur_0003 (9 days ago)
UPDATE finds SET created_at = datetime('now', '-9 days', '+5 hours') WHERE id = 'fnd_cur_n009';
UPDATE finds SET created_at = datetime('now', '-9 days', '+6 hours') WHERE id = 'fnd_cur_n010';
UPDATE finds SET created_at = datetime('now', '-9 days', '+7 hours') WHERE id = 'fnd_cur_n011';
UPDATE finds SET created_at = datetime('now', '-9 days', '+9 hours') WHERE id = 'fnd_cur_n012';
-- stm_cur_0004 (8 days ago)
UPDATE finds SET created_at = datetime('now', '-8 days', '+2 hours') WHERE id = 'fnd_cur_n013';
UPDATE finds SET created_at = datetime('now', '-8 days', '+3 hours') WHERE id = 'fnd_cur_n014';
UPDATE finds SET created_at = datetime('now', '-8 days', '+4 hours') WHERE id = 'fnd_cur_n015';
UPDATE finds SET created_at = datetime('now', '-8 days', '+5 hours') WHERE id = 'fnd_cur_n016';
-- stm_cur_0005 (8-7 days ago)
UPDATE finds SET created_at = datetime('now', '-8 days', '+11 hours') WHERE id = 'fnd_cur_n017';
UPDATE finds SET created_at = datetime('now', '-7 days', '+1 hours') WHERE id = 'fnd_cur_n018';
UPDATE finds SET created_at = datetime('now', '-7 days', '+2 hours') WHERE id = 'fnd_cur_n019';
UPDATE finds SET created_at = datetime('now', '-7 days', '+2 hours', '+30 minutes') WHERE id = 'fnd_cur_n020';
-- stm_cur_0006 (7 days ago)
UPDATE finds SET created_at = datetime('now', '-7 days', '+4 hours') WHERE id = 'fnd_cur_n021';
UPDATE finds SET created_at = datetime('now', '-7 days', '+6 hours') WHERE id = 'fnd_cur_n022';
UPDATE finds SET created_at = datetime('now', '-7 days', '+8 hours') WHERE id = 'fnd_cur_n023';
-- stm_cur_0007 (6 days ago)
UPDATE finds SET created_at = datetime('now', '-6 days', '+2 hours') WHERE id = 'fnd_cur_n024';
UPDATE finds SET created_at = datetime('now', '-6 days', '+3 hours') WHERE id = 'fnd_cur_n025';
UPDATE finds SET created_at = datetime('now', '-6 days', '+5 hours') WHERE id = 'fnd_cur_n026';
UPDATE finds SET created_at = datetime('now', '-6 days', '+6 hours') WHERE id = 'fnd_cur_n027';
-- stm_cur_0008 (6-5 days ago)
UPDATE finds SET created_at = datetime('now', '-6 days', '+10 hours') WHERE id = 'fnd_cur_n028';
UPDATE finds SET created_at = datetime('now', '-5 days', '+1 hours') WHERE id = 'fnd_cur_n029';
UPDATE finds SET created_at = datetime('now', '-5 days', '+2 hours') WHERE id = 'fnd_cur_n030';
UPDATE finds SET created_at = datetime('now', '-5 days', '+2 hours', '+30 minutes') WHERE id = 'fnd_cur_n031';
-- stm_cur_0009 (5 days ago)
UPDATE finds SET created_at = datetime('now', '-5 days', '+5 hours') WHERE id = 'fnd_cur_n032';
UPDATE finds SET created_at = datetime('now', '-5 days', '+6 hours') WHERE id = 'fnd_cur_n033';
UPDATE finds SET created_at = datetime('now', '-5 days', '+7 hours') WHERE id = 'fnd_cur_n034';
UPDATE finds SET created_at = datetime('now', '-5 days', '+8 hours') WHERE id = 'fnd_cur_n035';
-- stm_cur_0010 (4 days ago)
UPDATE finds SET created_at = datetime('now', '-4 days', '+3 hours') WHERE id = 'fnd_cur_n036';
UPDATE finds SET created_at = datetime('now', '-4 days', '+4 hours') WHERE id = 'fnd_cur_n037';
UPDATE finds SET created_at = datetime('now', '-4 days', '+5 hours') WHERE id = 'fnd_cur_n038';
UPDATE finds SET created_at = datetime('now', '-4 days', '+7 hours') WHERE id = 'fnd_cur_n039';
-- stm_cur_0011 (4-3 days ago)
UPDATE finds SET created_at = datetime('now', '-4 days', '+11 hours') WHERE id = 'fnd_cur_n040';
UPDATE finds SET created_at = datetime('now', '-3 days', '+1 hours') WHERE id = 'fnd_cur_n041';
UPDATE finds SET created_at = datetime('now', '-3 days', '+2 hours') WHERE id = 'fnd_cur_n042';
UPDATE finds SET created_at = datetime('now', '-3 days', '+3 hours') WHERE id = 'fnd_cur_n043';
-- stm_cur_0012 (3 days ago)
UPDATE finds SET created_at = datetime('now', '-3 days', '+6 hours') WHERE id = 'fnd_cur_n044';
UPDATE finds SET created_at = datetime('now', '-3 days', '+7 hours') WHERE id = 'fnd_cur_n045';
UPDATE finds SET created_at = datetime('now', '-3 days', '+8 hours') WHERE id = 'fnd_cur_n046';
UPDATE finds SET created_at = datetime('now', '-3 days', '+9 hours') WHERE id = 'fnd_cur_n047';
-- stm_cur_0013 (2 days ago)
UPDATE finds SET created_at = datetime('now', '-2 days', '+2 hours') WHERE id = 'fnd_cur_n048';
UPDATE finds SET created_at = datetime('now', '-2 days', '+3 hours') WHERE id = 'fnd_cur_n049';
UPDATE finds SET created_at = datetime('now', '-2 days', '+5 hours') WHERE id = 'fnd_cur_n050';
UPDATE finds SET created_at = datetime('now', '-2 days', '+6 hours') WHERE id = 'fnd_cur_n051';
-- stm_cur_0014 (2-1 days ago)
UPDATE finds SET created_at = datetime('now', '-2 days', '+9 hours') WHERE id = 'fnd_cur_n052';
UPDATE finds SET created_at = datetime('now', '-2 days', '+10 hours') WHERE id = 'fnd_cur_n053';
UPDATE finds SET created_at = datetime('now', '-1 days', '+2 hours') WHERE id = 'fnd_cur_n054';
-- stm_cur_0015 (yesterday)
UPDATE finds SET created_at = datetime('now', '-1 days', '+4 hours') WHERE id = 'fnd_cur_n055';
UPDATE finds SET created_at = datetime('now', '-1 days', '+5 hours') WHERE id = 'fnd_cur_n056';
UPDATE finds SET created_at = datetime('now', '-1 days', '+6 hours') WHERE id = 'fnd_cur_n057';
UPDATE finds SET created_at = datetime('now', '-1 days', '+7 hours') WHERE id = 'fnd_cur_n058';
-- stm_cur_0016 (yesterday)
UPDATE finds SET created_at = datetime('now', '-1 days', '+9 hours') WHERE id = 'fnd_cur_n059';
UPDATE finds SET created_at = datetime('now', '-1 days', '+10 hours') WHERE id = 'fnd_cur_n060';
UPDATE finds SET created_at = datetime('now', '-1 days', '+11 hours') WHERE id = 'fnd_cur_n061';
UPDATE finds SET created_at = datetime('now', '-1 days', '+11 hours', '+30 minutes') WHERE id = 'fnd_cur_n062';
-- stm_cur_0017 (today)
UPDATE finds SET created_at = datetime('now', '-0 days', '+1 hours') WHERE id = 'fnd_cur_n063';
UPDATE finds SET created_at = datetime('now', '-0 days', '+2 hours') WHERE id = 'fnd_cur_n064';
UPDATE finds SET created_at = datetime('now', '-0 days', '+3 hours') WHERE id = 'fnd_cur_n065';
UPDATE finds SET created_at = datetime('now', '-0 days', '+4 hours') WHERE id = 'fnd_cur_n066';
-- stm_cur_0018 (today)
UPDATE finds SET created_at = datetime('now', '-0 days', '+5 hours') WHERE id = 'fnd_cur_n067';
UPDATE finds SET created_at = datetime('now', '-0 days', '+6 hours') WHERE id = 'fnd_cur_n068';
UPDATE finds SET created_at = datetime('now', '-0 days', '+7 hours') WHERE id = 'fnd_cur_n069';
UPDATE finds SET created_at = datetime('now', '-0 days', '+8 hours') WHERE id = 'fnd_cur_n070';
-- stm_cur_0019 (today)
UPDATE finds SET created_at = datetime('now', '-0 days', '+2 hours', '+30 minutes') WHERE id = 'fnd_cur_n071';
UPDATE finds SET created_at = datetime('now', '-0 days', '+4 hours') WHERE id = 'fnd_cur_n072';
UPDATE finds SET created_at = datetime('now', '-0 days', '+5 hours', '+30 minutes') WHERE id = 'fnd_cur_n073';
UPDATE finds SET created_at = datetime('now', '-0 days', '+6 hours', '+30 minutes') WHERE id = 'fnd_cur_n074';
-- stm_cur_0020 (today)
UPDATE finds SET created_at = datetime('now', '-0 days', '+7 hours', '+30 minutes') WHERE id = 'fnd_cur_n075';
UPDATE finds SET created_at = datetime('now', '-0 days', '+8 hours') WHERE id = 'fnd_cur_n076';
UPDATE finds SET created_at = datetime('now', '-0 days', '+8 hours', '+30 minutes') WHERE id = 'fnd_cur_n077';
UPDATE finds SET created_at = datetime('now', '-0 days', '+9 hours') WHERE id = 'fnd_cur_n078';
