-- Seed: @curator
-- Demo account with curated stems to populate explore and home page.
-- Safe to re-run: all inserts use INSERT OR IGNORE.

INSERT OR IGNORE INTO users (id, username, display_name, bio, email, email_verified, created_at)
VALUES (
  'usr_curator001',
  'curator',
  'Curator',
  'Exploring the edges of knowledge across science, culture, and craft.',
  'curator@stem.md',
  1,
  '2025-11-01 00:00:00'
);

-- ── Stems ─────────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO stems (id, user_id, slug, title, description, status, is_public, created_at, updated_at) VALUES
  ('stm_cur_0001', 'usr_curator001', 'physics-of-everyday-things',
    'The physics of everyday things',
    'From why ice is slippery to how planes stay aloft. Physics hiding in plain sight.',
    'active', 1, '2025-11-03', '2026-01-15'),

  ('stm_cur_0002', 'usr_curator001', 'jazz-harmony',
    'How jazz harmony works',
    'The theory behind jazz chords, substitutions, and the logic of improvisation.',
    'active', 1, '2025-11-10', '2026-02-20'),

  ('stm_cur_0003', 'usr_curator001', 'history-of-the-internet',
    'The history of the internet',
    'ARPANET to the modern web. How we got here, who built it, and what they intended.',
    'done', 1, '2025-11-15', '2025-12-30'),

  ('stm_cur_0004', 'usr_curator001', 'deep-sea-biology',
    'Deep sea biology',
    'Life without sunlight. Pressure-adapted creatures, hydrothermal vents, and the midnight zone.',
    'active', 1, '2025-11-20', '2026-03-01'),

  ('stm_cur_0005', 'usr_curator001', 'japanese-aesthetics',
    'Japanese aesthetics',
    'Wabi-sabi, ma, mono no aware. The philosophy of form, space, and impermanence.',
    'active', 1, '2025-11-25', '2026-02-10'),

  ('stm_cur_0006', 'usr_curator001', 'mathematics-of-origami',
    'The mathematics of origami',
    'How paper folding encodes geometry — and solved engineering problems NASA could not.',
    'done', 1, '2025-12-01', '2026-01-08'),

  ('stm_cur_0007', 'usr_curator001', 'modern-urbanism',
    'Modern urbanism',
    'How cities work, why some thrive, and the design principles that shape how we live together.',
    'active', 1, '2025-12-05', '2026-03-10'),

  ('stm_cur_0008', 'usr_curator001', 'language-and-the-mind',
    'Language and the mind',
    'Does language shape thought? Sapir-Whorf, universal grammar, and how babies acquire language.',
    'active', 1, '2025-12-10', '2026-02-28'),

  ('stm_cur_0009', 'usr_curator001', 'byzantine-empire',
    'The Byzantine Empire',
    'A thousand years the Eastern Roman Empire was written out of history. Time to fix that.',
    'done', 1, '2025-12-12', '2026-01-20'),

  ('stm_cur_0010', 'usr_curator001', 'fermentation-science',
    'Fermentation science',
    'The microbiology of bread, beer, cheese, and miso. Controlled decay as craft and culture.',
    'active', 1, '2025-12-15', '2026-03-05'),

  ('stm_cur_0011', 'usr_curator001', 'neuroscience-of-creativity',
    'The neuroscience of creativity',
    'What actually happens in the brain during an insight. Default mode network, flow states, incubation.',
    'active', 1, '2025-12-20', '2026-03-15'),

  ('stm_cur_0012', 'usr_curator001', 'history-of-typography',
    'History of typography',
    'From Gutenberg''s movable type to variable fonts. How letterforms evolved and why they carry meaning.',
    'done', 1, '2025-12-22', '2026-01-25'),

  ('stm_cur_0013', 'usr_curator001', 'climate-science',
    'Climate science fundamentals',
    'The greenhouse effect, feedback loops, tipping points. Starting from first principles.',
    'active', 1, '2026-01-02', '2026-03-20'),

  ('stm_cur_0014', 'usr_curator001', 'acoustic-architecture',
    'Acoustic architecture',
    'How buildings shape sound. Concert hall design, cathedral acoustics, and the science of reverberation.',
    'active', 1, '2026-01-05', '2026-03-12'),

  ('stm_cur_0015', 'usr_curator001', 'psychoacoustics',
    'Psychoacoustics',
    'Why music sounds the way it does. Pitch perception, the cocktail party effect, and auditory illusions.',
    'done', 1, '2026-01-08', '2026-02-01'),

  ('stm_cur_0016', 'usr_curator001', 'the-silk-road',
    'The Silk Road',
    'Not just trade routes — a centuries-long exchange of religion, disease, technology, and ideas.',
    'done', 1, '2026-01-10', '2026-02-15'),

  ('stm_cur_0017', 'usr_curator001', 'emergence',
    'Emergence in complex systems',
    'How simple rules produce unexpected complexity. From ant colonies to traffic jams to consciousness.',
    'active', 1, '2026-01-15', '2026-03-18'),

  ('stm_cur_0018', 'usr_curator001', 'photography-and-seeing',
    'Photography and seeing',
    'The history and philosophy of the photograph. How the camera changed what humans notice.',
    'active', 1, '2026-01-20', '2026-03-22'),

  ('stm_cur_0019', 'usr_curator001', 'roman-infrastructure',
    'Ancient Rome''s infrastructure',
    'Roads, aqueducts, sewers. How the Romans built systems that lasted two millennia.',
    'done', 1, '2026-01-25', '2026-02-20'),

  ('stm_cur_0020', 'usr_curator001', 'science-of-color',
    'The science of color',
    'Color as physics, biology, and culture. Why the sky is blue, why carrots are orange, why red means stop.',
    'active', 1, '2026-02-01', '2026-03-25');

-- ── Finds ─────────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO finds (id, stem_id, added_by, url, title, note, source_type, created_at) VALUES
  -- Physics of everyday things
  ('fnd_cur_0001', 'stm_cur_0001', 'usr_curator001',
    'https://www.feynmanlectures.caltech.edu/',
    'The Feynman Lectures on Physics',
    'The complete lectures online, free. Vol I is where everyday physics lives.',
    'article', '2025-11-04'),
  ('fnd_cur_0002', 'stm_cur_0001', 'usr_curator001',
    'https://www.exploratorium.edu/snacks/snacks-by-subject/physics',
    'Physics Science Snacks — Exploratorium',
    'Hands-on mini-experiments that make abstract physics tangible.',
    'article', '2025-11-20'),

  -- Jazz harmony
  ('fnd_cur_0003', 'stm_cur_0002', 'usr_curator001',
    'https://learnjazzstandards.com/blog/jazz-advice/jazz-theory/understanding-the-ii-v-i-progression/',
    'Understanding the ii-V-I Progression',
    'The cornerstone of jazz harmony. Everything branches from this.',
    'article', '2025-11-12'),
  ('fnd_cur_0004', 'stm_cur_0002', 'usr_curator001',
    'https://www.musictheory.net/',
    'musictheory.net',
    'Build your ear and theory foundation before diving into jazz-specific resources.',
    'article', '2025-11-18'),

  -- History of the internet
  ('fnd_cur_0005', 'stm_cur_0003', 'usr_curator001',
    'https://www.internetsociety.org/internet/history-internet/brief-history-internet/',
    'A Brief History of the Internet',
    'Written by the people who actually built it. Surprisingly readable.',
    'article', '2025-11-16'),
  ('fnd_cur_0006', 'stm_cur_0003', 'usr_curator001',
    'https://www.w3.org/History.html',
    'A Little History of the World Wide Web',
    'Tim Berners-Lee''s own timeline. Short and essential.',
    'article', '2025-11-25'),

  -- Deep sea biology
  ('fnd_cur_0007', 'stm_cur_0004', 'usr_curator001',
    'https://ocean.si.edu/ocean-life/fish/deep-sea',
    'Deep Sea — Smithsonian Ocean',
    'Best overview I''ve found. Covers zones, adaptations, and key species.',
    'article', '2025-11-22'),
  ('fnd_cur_0008', 'stm_cur_0004', 'usr_curator001',
    'https://www.mbari.org/',
    'MBARI — Monterey Bay Aquarium Research Institute',
    'Their expedition footage and papers are some of the most striking science content online.',
    'article', '2025-12-10'),

  -- Japanese aesthetics
  ('fnd_cur_0009', 'stm_cur_0005', 'usr_curator001',
    'https://plato.stanford.edu/entries/japanese-aesthetics/',
    'Japanese Aesthetics — Stanford Encyclopedia of Philosophy',
    'Dense but thorough. Best academic entry point into wabi-sabi and ma.',
    'article', '2025-11-27'),
  ('fnd_cur_0010', 'stm_cur_0005', 'usr_curator001',
    'https://www.architectural-review.com/essays/the-japanese-house',
    'The Japanese House — Architectural Review',
    'How Japanese spatial concepts translate into built form.',
    'article', '2025-12-05'),

  -- Mathematics of origami
  ('fnd_cur_0011', 'stm_cur_0006', 'usr_curator001',
    'https://www.langorigami.com/',
    'Robert J. Lang Origami',
    'The physicist who proved origami could solve engineering problems. His work is stunning.',
    'article', '2025-12-02'),
  ('fnd_cur_0012', 'stm_cur_0006', 'usr_curator001',
    'https://plus.maths.org/content/power-origami',
    'The Power of Origami — Plus Maths',
    'How paper folding encodes geometry. Huzita-Hatori axioms explained clearly.',
    'article', '2025-12-10'),

  -- Modern urbanism
  ('fnd_cur_0013', 'stm_cur_0007', 'usr_curator001',
    'https://www.strongtowns.org/',
    'Strong Towns',
    'The best ongoing publication on why American cities are financially broken — and how to fix them.',
    'article', '2025-12-07'),
  ('fnd_cur_0014', 'stm_cur_0007', 'usr_curator001',
    'https://www.cnu.org/resources/what-new-urbanism',
    'What is New Urbanism? — Congress for the New Urbanism',
    'A clear primer on the movement that reshaped how we think about walkable cities.',
    'article', '2025-12-20'),

  -- Language and the mind
  ('fnd_cur_0015', 'stm_cur_0008', 'usr_curator001',
    'https://plato.stanford.edu/entries/language-thought/',
    'Language of Thought Hypothesis — Stanford Encyclopedia of Philosophy',
    'The philosophical case that thinking is a form of language. Fodor''s mentalese.',
    'article', '2025-12-11'),
  ('fnd_cur_0016', 'stm_cur_0008', 'usr_curator001',
    'https://www.linguisticsociety.org/resource/language-and-thought',
    'Language and Thought — Linguistic Society of America',
    'Accessible overview of Sapir-Whorf and the research that followed.',
    'article', '2025-12-22'),

  -- Byzantine Empire
  ('fnd_cur_0017', 'stm_cur_0009', 'usr_curator001',
    'https://www.metmuseum.org/toah/ht/06/eust.html',
    'Byzantine Art — The Met',
    'The Met''s timeline is the best visual introduction to Byzantium. Start here.',
    'article', '2025-12-13'),
  ('fnd_cur_0018', 'stm_cur_0009', 'usr_curator001',
    'https://www.worldhistory.org/Byzantine_Empire/',
    'Byzantine Empire — World History Encyclopedia',
    'Comprehensive overview. The political and cultural arc in one place.',
    'article', '2025-12-28'),

  -- Fermentation science
  ('fnd_cur_0019', 'stm_cur_0010', 'usr_curator001',
    'https://www.wildfermentation.com/',
    'Wild Fermentation — Sandor Katz',
    'The best practical entry into the microbiology and culture of fermentation.',
    'article', '2025-12-17'),
  ('fnd_cur_0020', 'stm_cur_0010', 'usr_curator001',
    'https://www.seriouseats.com/guide-to-fermentation',
    'A Guide to Fermentation — Serious Eats',
    'Science-first approach to why fermentation works. Excellent on salt ratios and pH.',
    'article', '2026-01-10'),

  -- Neuroscience of creativity
  ('fnd_cur_0021', 'stm_cur_0011', 'usr_curator001',
    'https://www.scientificamerican.com/article/the-neuroscience-of-creativity/',
    'The Neuroscience of Creativity — Scientific American',
    'Default mode network, the role of the unconscious, and what ''aha'' moments look like in the brain.',
    'article', '2025-12-21'),
  ('fnd_cur_0022', 'stm_cur_0011', 'usr_curator001',
    'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4458442/',
    'Creativity and the Brain — NIH Review',
    'The research literature synthesized. Dense but rewarding.',
    'article', '2026-01-08'),

  -- History of typography
  ('fnd_cur_0023', 'stm_cur_0012', 'usr_curator001',
    'https://ilovetypography.com/',
    'I Love Typography',
    'The best writing on type on the web. Deep dives on typefaces and their histories.',
    'article', '2025-12-23'),
  ('fnd_cur_0024', 'stm_cur_0012', 'usr_curator001',
    'https://www.alphabettes.org/',
    'Alphabettes',
    'Scholarship on lettering and typography from a diverse range of practitioners.',
    'article', '2026-01-05'),

  -- Climate science
  ('fnd_cur_0025', 'stm_cur_0013', 'usr_curator001',
    'https://climate.nasa.gov/',
    'NASA Climate',
    'The primary source. Real data, clear explanations, regularly updated.',
    'article', '2026-01-03'),
  ('fnd_cur_0026', 'stm_cur_0013', 'usr_curator001',
    'https://www.carbonbrief.org/',
    'Carbon Brief',
    'The best journalism on climate science. Data-driven, not alarmist, not dismissive.',
    'article', '2026-01-20'),

  -- Acoustic architecture
  ('fnd_cur_0027', 'stm_cur_0014', 'usr_curator001',
    'https://www.acoustics.org/',
    'Acoustical Society of America',
    'The primary professional organization. Their lay summaries are excellent.',
    'article', '2026-01-07'),
  ('fnd_cur_0028', 'stm_cur_0014', 'usr_curator001',
    'https://www.sciencedirect.com/topics/engineering/room-acoustics',
    'Room Acoustics — ScienceDirect',
    'Technical grounding on how room geometry and materials shape sound.',
    'article', '2026-01-25'),

  -- Psychoacoustics
  ('fnd_cur_0029', 'stm_cur_0015', 'usr_curator001',
    'https://www.acs.psu.edu/drussell/demos.html',
    'Acoustics and Vibration Animations — Penn State',
    'Visual demonstrations of wave behavior. The physics foundation before psychoacoustics.',
    'article', '2026-01-09'),
  ('fnd_cur_0030', 'stm_cur_0015', 'usr_curator001',
    'https://www.musikwissenschaft.uni-muenchen.de/archiv_en/auditoryneuroscience/',
    'Auditory Neuroscience — Jonas Obleser Lab',
    'Research at the intersection of hearing and cognition. Start with the demos page.',
    'article', '2026-01-22'),

  -- The Silk Road
  ('fnd_cur_0031', 'stm_cur_0016', 'usr_curator001',
    'https://www.silkroadfoundation.org/',
    'Silk Road Foundation',
    'Deep archive of scholarship. The section on technology exchange is underrated.',
    'article', '2026-01-11'),
  ('fnd_cur_0032', 'stm_cur_0016', 'usr_curator001',
    'https://www.metmuseum.org/toah/hd/silkroad/hd_silkroad.htm',
    'The Silk Road — The Met',
    'The art tells the story better than the history books. Look at the Sasanian plates.',
    'article', '2026-01-30'),

  -- Emergence
  ('fnd_cur_0033', 'stm_cur_0017', 'usr_curator001',
    'https://www.santafe.edu/',
    'Santa Fe Institute',
    'The world''s leading complexity science research center. Their podcasts are a good entry point.',
    'article', '2026-01-17'),
  ('fnd_cur_0034', 'stm_cur_0017', 'usr_curator001',
    'https://plato.stanford.edu/entries/properties-emergent/',
    'Emergent Properties — Stanford Encyclopedia of Philosophy',
    'The philosophical framing. Useful for separating weak from strong emergence.',
    'article', '2026-02-05'),

  -- Photography and seeing
  ('fnd_cur_0035', 'stm_cur_0018', 'usr_curator001',
    'https://www.moma.org/explore/collection/photography',
    'Photography Collection — MoMA',
    'The curatorial framing here is as interesting as the images themselves.',
    'article', '2026-01-22'),
  ('fnd_cur_0036', 'stm_cur_0018', 'usr_curator001',
    'https://www.lensculture.com/',
    'LensCulture',
    'Contemporary photography curation. Useful for seeing what the medium is doing now.',
    'article', '2026-02-10'),

  -- Roman infrastructure
  ('fnd_cur_0037', 'stm_cur_0019', 'usr_curator001',
    'https://www.pbs.org/wgbh/nova/article/roman-engineering/',
    'Roman Engineering — NOVA/PBS',
    'Clear primer on concrete, arches, and aqueduct hydraulics.',
    'article', '2026-01-26'),
  ('fnd_cur_0038', 'stm_cur_0019', 'usr_curator001',
    'https://www.romanaqueducts.info/',
    'Roman Aqueducts',
    'Obsessively detailed. Every known aqueduct mapped and documented.',
    'article', '2026-02-08'),

  -- Science of color
  ('fnd_cur_0039', 'stm_cur_0020', 'usr_curator001',
    'https://www.colorsystem.com/',
    'Color System',
    'A survey of every major color order system from Newton to Munsell to NCS.',
    'article', '2026-02-03'),
  ('fnd_cur_0040', 'stm_cur_0020', 'usr_curator001',
    'https://www.handprint.com/HP/WCL/color1.html',
    'Color Vision — Handprint',
    'The most thorough treatment of color perception I''ve found. Long, but worth it.',
    'article', '2026-03-01');

-- ── Featured stems (home page, position 1–8) ──────────────────────────────────

INSERT OR IGNORE INTO featured_stems (id, stem_id, position, created_at) VALUES
  ('fs_cur_0001', 'stm_cur_0011', 1, '2026-01-01'),  -- neuroscience of creativity
  ('fs_cur_0002', 'stm_cur_0004', 2, '2026-01-01'),  -- deep sea biology
  ('fs_cur_0003', 'stm_cur_0018', 3, '2026-01-01'),  -- photography and seeing
  ('fs_cur_0004', 'stm_cur_0001', 4, '2026-01-01'),  -- physics of everyday things
  ('fs_cur_0005', 'stm_cur_0007', 5, '2026-01-01'),  -- modern urbanism
  ('fs_cur_0006', 'stm_cur_0017', 6, '2026-01-01'),  -- emergence
  ('fs_cur_0007', 'stm_cur_0005', 7, '2026-01-01'),  -- japanese aesthetics
  ('fs_cur_0008', 'stm_cur_0020', 8, '2026-01-01');  -- science of color
