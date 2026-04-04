-- Blocked domains table for URL-level moderation
CREATE TABLE IF NOT EXISTS blocked_domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE COLLATE NOCASE,
  category TEXT NOT NULL DEFAULT 'other',
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  added_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_blocked_domains_domain ON blocked_domains(domain);

-- Reported content table
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  find_id TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolved_by TEXT,
  FOREIGN KEY (find_id) REFERENCES finds(id),
  FOREIGN KEY (reported_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_reports_find ON reports(find_id);

-- Seed with known blocked domains
-- Adult/pornographic
INSERT OR IGNORE INTO blocked_domains (domain, category) VALUES
('pornhub.com', 'adult'), ('xvideos.com', 'adult'), ('xhamster.com', 'adult'),
('xnxx.com', 'adult'), ('redtube.com', 'adult'), ('youporn.com', 'adult'),
('tube8.com', 'adult'), ('spankbang.com', 'adult'), ('beeg.com', 'adult'),
('brazzers.com', 'adult'), ('bangbros.com', 'adult'), ('naughtyamerica.com', 'adult'),
('chaturbate.com', 'adult'), ('stripchat.com', 'adult'), ('livejasmin.com', 'adult'),
('myfreecams.com', 'adult'), ('cam4.com', 'adult'), ('bongacams.com', 'adult'),
('onlyfans.com', 'adult'), ('fansly.com', 'adult'), ('manyvids.com', 'adult'),
('clips4sale.com', 'adult'), ('erome.com', 'adult'), ('rule34.xxx', 'adult'),
('e-hentai.org', 'adult'), ('nhentai.net', 'adult'), ('hanime.tv', 'adult'),
('hentaihaven.xxx', 'adult'), ('motherless.com', 'adult'), ('efukt.com', 'adult');

-- Dark web / .onion proxies
INSERT OR IGNORE INTO blocked_domains (domain, category) VALUES
('onion.ws', 'darkweb'), ('onion.ly', 'darkweb'), ('onion.pet', 'darkweb'),
('onion.sh', 'darkweb'), ('tor2web.org', 'darkweb'), ('onion.link', 'darkweb'),
('onion.cab', 'darkweb'), ('darkfail.com', 'darkweb'), ('dark.fail', 'darkweb');

-- Known scam / phishing / malware
INSERT OR IGNORE INTO blocked_domains (domain, category) VALUES
('grabify.link', 'scam'), ('iplogger.org', 'scam'), ('iplogger.com', 'scam'),
('blasze.tk', 'scam'), ('2no.co', 'scam'), ('yip.su', 'scam'),
('ipgrabber.ru', 'scam'), ('ps3cfw.com', 'scam'), ('urlz.fr', 'scam');

-- Piracy
INSERT OR IGNORE INTO blocked_domains (domain, category) VALUES
('thepiratebay.org', 'piracy'), ('1337x.to', 'piracy'), ('rarbg.to', 'piracy'),
('yts.mx', 'piracy'), ('nyaa.si', 'piracy'), ('fitgirl-repacks.site', 'piracy'),
('libgen.is', 'piracy'), ('libgen.rs', 'piracy'), ('sci-hub.se', 'piracy'),
('z-lib.org', 'piracy'), ('annas-archive.org', 'piracy');

-- Gore / shock
INSERT OR IGNORE INTO blocked_domains (domain, category) VALUES
('bestgore.com', 'gore'), ('theync.com', 'gore'), ('kaotic.com', 'gore'),
('liveleak.com', 'gore'), ('crazyshit.com', 'gore');

-- Gambling / casino spam
INSERT OR IGNORE INTO blocked_domains (domain, category) VALUES
('stake.com', 'gambling'), ('888casino.com', 'gambling'),
('bet365.com', 'gambling'), ('bovada.lv', 'gambling');
