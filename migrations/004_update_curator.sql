-- Update @curator profile and stems to showcase what Stem can be.
-- Adds emojis, categories, and rich finds with real URLs and curator notes.

-- ── Update curator bio ──────────────────────────────────────────────────────
UPDATE users SET
  bio = 'Going deep on things across science, culture, and craft. This is an example account showing what Stem can look like.',
  display_name = 'Curator'
WHERE id = 'usr_curator001';

-- ── Update all stems: add emojis, set active, set visibility ────────────────
UPDATE stems SET emoji = '⚛️', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0001';
UPDATE stems SET emoji = '🎵', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0002';
UPDATE stems SET emoji = '🌐', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0003';
UPDATE stems SET emoji = '🌊', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0004';
UPDATE stems SET emoji = '🎋', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0005';
UPDATE stems SET emoji = '📐', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0006';
UPDATE stems SET emoji = '🏙️', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0007';
UPDATE stems SET emoji = '🗣️', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0008';
UPDATE stems SET emoji = '🏛️', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0009';
UPDATE stems SET emoji = '🍞', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0010';
UPDATE stems SET emoji = '🧠', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0011';
UPDATE stems SET emoji = '✏️', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0012';
UPDATE stems SET emoji = '🌍', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0013';
UPDATE stems SET emoji = '🔊', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0014';
UPDATE stems SET emoji = '🎧', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0015';
UPDATE stems SET emoji = '🐫', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0016';
UPDATE stems SET emoji = '🦋', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0017';
UPDATE stems SET emoji = '📷', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0018';
UPDATE stems SET emoji = '🏗️', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0019';
UPDATE stems SET emoji = '🌈', status = 'active', visibility = 'public', contribution_mode = 'open' WHERE id = 'stm_cur_0020';

-- ── Add stem categories ─────────────────────────────────────────────────────
-- Physics of everyday things
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0001', 'cat_physics');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0001', 'cat_science');
-- Jazz harmony
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0002', 'cat_music');
-- History of the internet
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0003', 'cat_technology');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0003', 'cat_history');
-- Deep sea biology
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0004', 'cat_biology');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0004', 'cat_nature');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0004', 'cat_science');
-- Japanese aesthetics
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0005', 'cat_art');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0005', 'cat_philosophy');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0005', 'cat_design');
-- Mathematics of origami
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0006', 'cat_mathematics');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0006', 'cat_art');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0006', 'cat_craft');
-- Modern urbanism
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0007', 'cat_urbanism');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0007', 'cat_architecture');
-- Language and the mind
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0008', 'cat_linguistics');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0008', 'cat_psychology');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0008', 'cat_philosophy');
-- Byzantine Empire
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0009', 'cat_history');
-- Fermentation science
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0010', 'cat_food');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0010', 'cat_science');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0010', 'cat_biology');
-- Neuroscience of creativity
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0011', 'cat_psychology');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0011', 'cat_science');
-- History of typography
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0012', 'cat_design');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0012', 'cat_history');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0012', 'cat_art');
-- Climate science
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0013', 'cat_science');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0013', 'cat_nature');
-- Acoustic architecture
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0014', 'cat_architecture');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0014', 'cat_music');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0014', 'cat_physics');
-- Psychoacoustics
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0015', 'cat_music');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0015', 'cat_psychology');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0015', 'cat_science');
-- The Silk Road
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0016', 'cat_history');
-- Emergence
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0017', 'cat_science');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0017', 'cat_mathematics');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0017', 'cat_philosophy');
-- Photography and seeing
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0018', 'cat_photography');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0018', 'cat_art');
-- Roman infrastructure
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0019', 'cat_history');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0019', 'cat_architecture');
-- Science of color
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0020', 'cat_science');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0020', 'cat_art');
INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES ('stm_cur_0020', 'cat_physics');

-- ── Delete old finds (replacing with better URLs and richer notes) ──────────
DELETE FROM finds WHERE added_by = 'usr_curator001';

-- ── Insert new finds ────────────────────────────────────────────────────────

-- Physics of everyday things (stm_cur_0001)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n001', 'stm_cur_0001', 'usr_curator001', 'https://aeon.co/essays/to-understand-physics-we-need-to-tell-and-hear-stories', 'To understand physics, we need to tell and hear stories', 'A lovely essay arguing that physics is fundamentally a story problem. Changed how I think about teaching it.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=aeon.co&sz=32'),
('fnd_cur_n002', 'stm_cur_0001', 'usr_curator001', 'https://www.nature.com/articles/529016a', 'The physics of life', 'A Nature essay on how statistical mechanics gives rise to heat, pressure, and everything you feel when you touch a warm mug.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=nature.com&sz=32'),
('fnd_cur_n003', 'stm_cur_0001', 'usr_curator001', 'https://en.wikipedia.org/wiki/Helen_Czerski', 'Helen Czerski', 'The physicist behind Storm in a Teacup. The best single-author guide to why toast falls butter-side down.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n004', 'stm_cur_0001', 'usr_curator001', 'https://aeon.co/videos/why-arent-our-everyday-lives-as-spooky-as-the-quantum-world', 'Why aren''t our everyday lives as spooky as the quantum world?', 'Short and disorienting. Bridges the gap between kitchen-table physics and quantum weirdness.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=aeon.co&sz=32');

-- Jazz harmony (stm_cur_0002)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n005', 'stm_cur_0002', 'usr_curator001', 'https://en.wikipedia.org/wiki/Jazz_harmony', 'Jazz harmony', 'The most comprehensive free reference on ii-V-I progressions, tritone substitutions, and modal interchange.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n006', 'stm_cur_0002', 'usr_curator001', 'https://en.wikipedia.org/wiki/Chord-scale_system', 'Chord-scale system', 'The method behind most modern jazz improvisation teaching, from George Russell onward.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n007', 'stm_cur_0002', 'usr_curator001', 'https://en.wikipedia.org/wiki/Lydian_Chromatic_Concept_of_Tonal_Organization', 'Lydian Chromatic Concept of Tonal Organization', 'The theoretical foundation that influenced Miles Davis and Coltrane. Dense but essential.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n008', 'stm_cur_0002', 'usr_curator001', 'https://en.wikipedia.org/wiki/Jazz_chords', 'Jazz chords', 'A practical reference for the extended and altered chords that give jazz its distinctive color.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32');

-- History of the internet (stm_cur_0003)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n009', 'stm_cur_0003', 'usr_curator001', 'https://en.wikipedia.org/wiki/History_of_the_Internet', 'History of the Internet', 'The definitive free overview, from ARPANET to the modern web. Exhaustive and well-sourced.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n010', 'stm_cur_0003', 'usr_curator001', 'https://en.wikipedia.org/wiki/ARPANET', 'ARPANET', 'The origin story: packet switching, BBN, the first message between UCLA and SRI in 1969.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n011', 'stm_cur_0003', 'usr_curator001', 'https://www.computerhistory.org/internethistory/', 'Internet History Timeline', 'The Computer History Museum''s decade-by-decade interactive timeline. The best visual walkthrough available.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=computerhistory.org&sz=32'),
('fnd_cur_n012', 'stm_cur_0003', 'usr_curator001', 'https://en.wikipedia.org/wiki/Lo_and_Behold,_Reveries_of_the_Connected_World', 'Lo and Behold (Werner Herzog)', 'Herzog''s documentary on the internet. Strange, philosophical, and deeply Herzogian.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32');

-- Deep sea biology (stm_cur_0004)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n013', 'stm_cur_0004', 'usr_curator001', 'https://ocean.si.edu/ecosystems/deep-sea/deep-sea', 'The Deep Sea', 'The Smithsonian''s authoritative overview. Clear writing, stunning imagery, scientifically rigorous.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=ocean.si.edu&sz=32'),
('fnd_cur_n014', 'stm_cur_0004', 'usr_curator001', 'https://ocean.si.edu/ocean-life/fish/bioluminescence', 'Bioluminescence', 'The best single-page explainer on how and why 90% of deep-sea creatures make their own light.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=ocean.si.edu&sz=32'),
('fnd_cur_n015', 'stm_cur_0004', 'usr_curator001', 'https://en.wikipedia.org/wiki/Hydrothermal_vent', 'Hydrothermal vents', 'The discovery that life could thrive without sunlight, rewritten as an encyclopedia article.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n016', 'stm_cur_0004', 'usr_curator001', 'https://www.ted.com/talks/karen_lloyd_this_deep_sea_mystery_is_changing_our_understanding_of_life', 'This deep-sea mystery is changing our understanding of life', 'Microbes buried meters deep in ocean mud that predate animals. Genuinely mind-expanding.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=ted.com&sz=32');

-- Japanese aesthetics (stm_cur_0005)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n017', 'stm_cur_0005', 'usr_curator001', 'https://plato.stanford.edu/entries/japanese-aesthetics/', 'Japanese Aesthetics', 'The most intellectually serious introduction available in English. Covers mono no aware, wabi, sabi, yugen, iki, and kire.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=plato.stanford.edu&sz=32'),
('fnd_cur_n018', 'stm_cur_0005', 'usr_curator001', 'https://en.wikipedia.org/wiki/Wabi-sabi', 'Wabi-sabi', 'The aesthetic of imperfection and impermanence. Start here before the Stanford entry.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n019', 'stm_cur_0005', 'usr_curator001', 'https://en.wikipedia.org/wiki/Ma_(negative_space)', 'Ma (negative space)', '"An emptiness full of possibilities, like a promise yet to be fulfilled." The concept the West has no word for.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n020', 'stm_cur_0005', 'usr_curator001', 'https://en.wikipedia.org/wiki/Japanese_aesthetics', 'Japanese aesthetics (overview)', 'Broader context linking wabi-sabi and ma to the tea ceremony, garden design, and the full tradition.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32');

-- Mathematics of origami (stm_cur_0006)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n021', 'stm_cur_0006', 'usr_curator001', 'https://en.wikipedia.org/wiki/Mathematics_of_paper_folding', 'Mathematics of paper folding', 'Huzita-Hatori axioms, flat-foldability, and computational complexity. The best free overview.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n022', 'stm_cur_0006', 'usr_curator001', 'https://www.ted.com/talks/robert_lang_the_math_and_magic_of_origami', 'The math and magic of origami', 'Fifteen minutes that will permanently change how you look at a folded piece of paper.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=ted.com&sz=32'),
('fnd_cur_n023', 'stm_cur_0006', 'usr_curator001', 'https://www.ams.org/publicoutreach/feature-column/fcarc-art6', 'Origami and Geometric Constructions', 'The American Mathematical Society''s accessible column on origami math. Written for curious non-specialists.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=ams.org&sz=32');

-- Modern urbanism (stm_cur_0007)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n024', 'stm_cur_0007', 'usr_curator001', 'https://en.wikipedia.org/wiki/The_Death_and_Life_of_Great_American_Cities', 'The Death and Life of Great American Cities', 'The book that launched modern urbanism. Jane Jacobs'' 1961 argument is still the starting point.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n025', 'stm_cur_0007', 'usr_curator001', 'https://en.wikipedia.org/wiki/15-minute_city', '15-minute city', 'The most important recent idea in urbanism. Everything you need within a 15-minute walk.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n026', 'stm_cur_0007', 'usr_curator001', 'https://en.wikipedia.org/wiki/New_Urbanism', 'New Urbanism', 'The movement that translated Jacobs'' ideas into planning practice: walkable, mixed-use, human-scale.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n027', 'stm_cur_0007', 'usr_curator001', 'https://en.wikipedia.org/wiki/Walkability', 'Walkability', 'The five D''s of walkable design explained with research backing.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32');

-- Language and the mind (stm_cur_0008)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n028', 'stm_cur_0008', 'usr_curator001', 'https://en.wikipedia.org/wiki/Linguistic_relativity', 'Linguistic relativity', 'The most balanced overview of the Sapir-Whorf hypothesis, its strong and weak forms, and the current evidence.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n029', 'stm_cur_0008', 'usr_curator001', 'https://www.ted.com/talks/lera_boroditsky_how_language_shapes_the_way_we_think', 'How language shapes the way we think', 'The single best accessible introduction. Her examples from Aboriginal Australian languages are unforgettable.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=ted.com&sz=32'),
('fnd_cur_n030', 'stm_cur_0008', 'usr_curator001', 'https://plato.stanford.edu/entries/linguistics/whorfianism.html', 'Whorfianism', 'The philosophical deep dive. Rigorous, careful, and honest about what the evidence does and doesn''t show.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=plato.stanford.edu&sz=32'),
('fnd_cur_n031', 'stm_cur_0008', 'usr_curator001', 'https://en.wikipedia.org/wiki/Linguistic_determinism', 'Linguistic determinism', 'The strong (now rejected) version. Understanding why it fails teaches you what the weaker version actually claims.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32');

-- Byzantine Empire (stm_cur_0009)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n032', 'stm_cur_0009', 'usr_curator001', 'https://en.wikipedia.org/wiki/Byzantine_Empire', 'Byzantine Empire', 'The best free starting point for a thousand years of history most people skip.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n033', 'stm_cur_0009', 'usr_curator001', 'https://www.metmuseum.org/essays/byzantium-ca-330-1453', 'Byzantium (ca. 330-1453)', 'Beautifully written. History told through the Met''s own collection.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=metmuseum.org&sz=32'),
('fnd_cur_n034', 'stm_cur_0009', 'usr_curator001', 'https://www.worldhistory.org/Byzantine_Empire/', 'Byzantine Empire (World History Encyclopedia)', 'More narrative and accessible than Wikipedia, with strong coverage of culture and daily life.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=worldhistory.org&sz=32'),
('fnd_cur_n035', 'stm_cur_0009', 'usr_curator001', 'https://www.metmuseum.org/essays/hagia-sophia-532-37', 'Hagia Sophia, 532-37', 'The greatest building of the medieval world, explained through its architecture and art.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=metmuseum.org&sz=32');

-- Fermentation science (stm_cur_0010)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n036', 'stm_cur_0010', 'usr_curator001', 'https://en.wikipedia.org/wiki/Fermentation', 'Fermentation', 'The biochemistry from Pasteur''s 1856 discovery to enzymes and metabolic pathways.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n037', 'stm_cur_0010', 'usr_curator001', 'https://en.wikipedia.org/wiki/Fermentation_in_food_processing', 'Fermentation in food processing', 'The practical side: bread, beer, kimchi, cheese, and dozens more.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n038', 'stm_cur_0010', 'usr_curator001', 'https://en.wikipedia.org/wiki/Sandor_Katz', 'Sandor Katz', 'The self-described "fermentation fetishist" whose books launched a movement.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n039', 'stm_cur_0010', 'usr_curator001', 'https://aeon.co/videos/making-sauerkraut-is-a-spiritual-matter-for-the-fermentation-fetishist-sandor-katz', 'Making sauerkraut is a spiritual matter', 'A short, beautiful video with the world''s foremost fermentation evangelist.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=aeon.co&sz=32');

-- Neuroscience of creativity (stm_cur_0011)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n040', 'stm_cur_0011', 'usr_curator001', 'https://blogs.scientificamerican.com/beautiful-minds/the-real-neuroscience-of-creativity/', 'The real neuroscience of creativity', 'Debunks "left brain / right brain" and explains the three networks that actually drive creative thought.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=scientificamerican.com&sz=32'),
('fnd_cur_n041', 'stm_cur_0011', 'usr_curator001', 'https://www.scientificamerican.com/article/why-are-some-people-more-creative-than-others/', 'Why are some people more creative than others?', 'Synthesizes brain imaging research into a clear answer about individual differences.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=scientificamerican.com&sz=32'),
('fnd_cur_n042', 'stm_cur_0011', 'usr_curator001', 'https://www.nature.com/articles/s42003-024-07007-6', 'Neural, genetic, and cognitive signatures of creativity', 'A comprehensive 2024 study mapping creativity across neural, genetic, and cognitive dimensions.', 'paper', 'approved', 'https://www.google.com/s2/favicons?domain=nature.com&sz=32'),
('fnd_cur_n043', 'stm_cur_0011', 'usr_curator001', 'https://www.scientificamerican.com/blog/beautiful-minds/the-neuroscience-of-creativity-a-q-a-with-anna-abraham/', 'The neuroscience of creativity: Q&A with Anna Abraham', 'Gets into the subtleties: what counts as creativity, how it differs from intelligence.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=scientificamerican.com&sz=32');

-- History of typography (stm_cur_0012)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n044', 'stm_cur_0012', 'usr_curator001', 'https://en.wikipedia.org/wiki/History_of_Western_typography', 'History of Western typography', 'From Gutenberg''s blackletter to digital type. The most thorough free survey.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n045', 'stm_cur_0012', 'usr_curator001', 'https://en.wikipedia.org/wiki/Helvetica_(film)', 'Helvetica (film)', 'Gary Hustwit''s 2007 documentary is the single best gateway into caring about typefaces.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n046', 'stm_cur_0012', 'usr_curator001', 'https://www.smithsonianmag.com/arts-culture/postmodernisms-new-typography-77489071/', 'Postmodernism''s new typography', 'How typography broke its own rules: David Carson, Emigre, and the rebellion against Swiss rationalism.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=smithsonianmag.com&sz=32'),
('fnd_cur_n047', 'stm_cur_0012', 'usr_curator001', 'https://en.wikipedia.org/wiki/Typography', 'Typography', 'The principles and practice of type, not just the history. Good for understanding why it matters.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32');

-- Climate science (stm_cur_0013)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n048', 'stm_cur_0013', 'usr_curator001', 'https://science.nasa.gov/climate-change/evidence/', 'Evidence for climate change', 'The single most authoritative and accessible summary of climate change evidence. Start here.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=nasa.gov&sz=32'),
('fnd_cur_n049', 'stm_cur_0013', 'usr_curator001', 'https://science.nasa.gov/earth/earth-observatory/the-carbon-cycle/', 'The carbon cycle', 'A clear, visual explanation of how carbon moves through the planet.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=nasa.gov&sz=32'),
('fnd_cur_n050', 'stm_cur_0013', 'usr_curator001', 'https://en.wikipedia.org/wiki/Greenhouse_effect', 'Greenhouse effect', 'More technical depth, with the physics of radiation balance for those who want the equations.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n051', 'stm_cur_0013', 'usr_curator001', 'https://science.nasa.gov/climate-change/faq/what-is-the-greenhouse-effect/', 'What is the greenhouse effect?', 'Concise explainer on the mechanism that makes Earth habitable and what happens when we amplify it.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=nasa.gov&sz=32');

-- Acoustic architecture (stm_cur_0014)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n052', 'stm_cur_0014', 'usr_curator001', 'https://aeon.co/essays/on-the-art-and-science-of-making-buildings-sound-natural', 'On the art and science of making buildings sound natural', 'A brilliant essay by an architectural acoustician. The best piece I''ve found on engineering the sounds of spaces.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=aeon.co&sz=32'),
('fnd_cur_n053', 'stm_cur_0014', 'usr_curator001', 'https://en.wikipedia.org/wiki/Architectural_acoustics', 'Architectural acoustics', 'From Vitruvius in 20 BC to modern concert hall design. The full history and science.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n054', 'stm_cur_0014', 'usr_curator001', 'https://en.wikipedia.org/wiki/Vineyard_style', 'Vineyard style concert halls', 'The acoustic innovation behind the Berlin Philharmonie, where the audience surrounds the orchestra.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32');

-- Psychoacoustics (stm_cur_0015)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n055', 'stm_cur_0015', 'usr_curator001', 'https://en.wikipedia.org/wiki/Psychoacoustics', 'Psychoacoustics', 'How mechanical sound waves become perceived pitch, loudness, timbre, and spatial location in the brain.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n056', 'stm_cur_0015', 'usr_curator001', 'https://en.wikipedia.org/wiki/Missing_fundamental', 'Missing fundamental', 'Your brain hears a bass note that isn''t physically there. This is why telephones work for male voices.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n057', 'stm_cur_0015', 'usr_curator001', 'https://en.wikipedia.org/wiki/Auditory_illusion', 'Auditory illusions', 'Shepard tones, the octave illusion, phantom words. Once you know about these, you hear differently.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n058', 'stm_cur_0015', 'usr_curator001', 'https://www.scientificamerican.com/article/auditory-illusions-and-confusions/', 'Auditory illusions and confusions', 'How our ears and brains conspire to create sounds that don''t exist.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=scientificamerican.com&sz=32');

-- The Silk Road (stm_cur_0016)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n059', 'stm_cur_0016', 'usr_curator001', 'https://en.wikipedia.org/wiki/Silk_Road', 'Silk Road', '6,400 km of trade routes connecting China to Rome. Trade, religion, disease, and ideas all traveled these paths.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n060', 'stm_cur_0016', 'usr_curator001', 'https://www.metmuseum.org/essays/trade-routes-between-europe-and-asia-during-antiquity', 'Trade routes between Europe and Asia during antiquity', 'History told through artifacts. The Met at its best.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=metmuseum.org&sz=32'),
('fnd_cur_n061', 'stm_cur_0016', 'usr_curator001', 'https://www.worldhistory.org/Silk_Road/', 'Silk Road (World History Encyclopedia)', 'More narrative and accessible, with strong emphasis on cultural exchange beyond trade.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=worldhistory.org&sz=32'),
('fnd_cur_n062', 'stm_cur_0016', 'usr_curator001', 'https://www.metmuseum.org/toah/hd/inte/hd_inte.htm', 'Internationalism in the Tang Dynasty', 'The Silk Road at its peak: Tang China as the most cosmopolitan civilization on Earth.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=metmuseum.org&sz=32');

-- Emergence (stm_cur_0017)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n063', 'stm_cur_0017', 'usr_curator001', 'https://www.quantamagazine.org/emergence-how-complex-wholes-emerge-from-simple-parts-20181220/', 'How complex wholes emerge from simple parts', 'The best accessible introduction to emergence. Quanta at its finest.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=quantamagazine.org&sz=32'),
('fnd_cur_n064', 'stm_cur_0017', 'usr_curator001', 'https://en.wikipedia.org/wiki/Emergence', 'Emergence', 'Thorough reference covering weak and strong emergence, from physics to consciousness.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n065', 'stm_cur_0017', 'usr_curator001', 'https://www.quantamagazine.org/a-theory-of-reality-as-more-than-the-sum-of-its-parts-20170601/', 'A theory of reality as more than the sum of its parts', 'Erik Hoel''s argument that higher-level descriptions can be more causally powerful than lower-level ones.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=quantamagazine.org&sz=32'),
('fnd_cur_n066', 'stm_cur_0017', 'usr_curator001', 'https://www.quantamagazine.org/the-new-math-of-how-large-scale-order-emerges-20240610/', 'The new math of how large-scale order emerges', 'A 2024 article on Fernando Rosas'' framework for understanding emergence. The cutting edge.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=quantamagazine.org&sz=32');

-- Photography and seeing (stm_cur_0018)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n067', 'stm_cur_0018', 'usr_curator001', 'https://en.wikipedia.org/wiki/Ways_of_Seeing', 'Ways of Seeing', 'John Berger''s 1972 BBC series fundamentally changed how we think about looking at images. The starting point.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n068', 'stm_cur_0018', 'usr_curator001', 'https://en.wikipedia.org/wiki/On_Photography', 'On Photography', 'Susan Sontag''s 1977 landmark essays on how photography shapes our relationship to reality.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n069', 'stm_cur_0018', 'usr_curator001', 'https://aeon.co/essays/does-photography-make-us-act-or-inure-us-to-despair', 'Does photography make us act or inure us to despair?', 'Wrestles with Sontag''s question about images of suffering. Still urgently relevant.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=aeon.co&sz=32'),
('fnd_cur_n070', 'stm_cur_0018', 'usr_curator001', 'https://metmuseum.org/toah/hd/nvis/ho_1987.1100.69.htm', 'New Vision Photography', 'The 1920s movement that used extreme angles and close-ups to break old habits of perception.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=metmuseum.org&sz=32');

-- Roman infrastructure (stm_cur_0019)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n071', 'stm_cur_0019', 'usr_curator001', 'https://www.worldhistory.org/Roman_Engineering/', 'Roman Engineering', 'The best single overview: aqueducts, roads, bridges, and concrete in one well-written article.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=worldhistory.org&sz=32'),
('fnd_cur_n072', 'stm_cur_0019', 'usr_curator001', 'https://en.wikipedia.org/wiki/Roman_aqueduct', 'Roman aqueducts', 'Eleven aqueducts delivering a thousand cubic meters daily using only gravity. The engineering details are staggering.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n073', 'stm_cur_0019', 'usr_curator001', 'https://en.wikipedia.org/wiki/Roman_roads', 'Roman roads', '400,000 km of roads connecting 113 provinces. Some still in use. The five-layer construction method is described in satisfying detail.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n074', 'stm_cur_0019', 'usr_curator001', 'https://en.wikipedia.org/wiki/Cloaca_Maxima', 'Cloaca Maxima', 'Rome''s great sewer, built in the 6th century BC and still partially in use. The least glamorous and most impressive Roman infrastructure.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32');

-- Science of color (stm_cur_0020)
INSERT INTO finds (id, stem_id, added_by, url, title, note, source_type, status, favicon_url) VALUES
('fnd_cur_n075', 'stm_cur_0020', 'usr_curator001', 'https://en.wikipedia.org/wiki/Color', 'Color', 'Surprisingly deep: physics of wavelengths, biology of cone cells, and the philosophy of whether color is "real."', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n076', 'stm_cur_0020', 'usr_curator001', 'https://en.wikipedia.org/wiki/Color_vision', 'Color vision', 'Trichromacy, cone pigment absorption spectra, and how the brain constructs color from wavelengths.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'),
('fnd_cur_n077', 'stm_cur_0020', 'usr_curator001', 'https://nautil.us/the-reality-of-color-is-perception-235560/', 'The reality of color is perception', 'Newton showed color isn''t a property of objects, and we''re still reckoning with that.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=nautil.us&sz=32'),
('fnd_cur_n078', 'stm_cur_0020', 'usr_curator001', 'https://www.scientificamerican.com/article/evolution-of-primate-color-vision/', 'How our eyes reflect primate evolution', 'Why we see color the way we do: our ancestors needed to find ripe fruit.', 'article', 'approved', 'https://www.google.com/s2/favicons?domain=scientificamerican.com&sz=32');

-- ── Update stem timestamps ──────────────────────────────────────────────────
UPDATE stems SET updated_at = datetime('now') WHERE user_id = 'usr_curator001';
