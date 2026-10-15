-- Statistik pengunjung website (page view anonim). Tidak menyimpan IP; visitor = hash ID acak dari browser.
CREATE TABLE site_visits (
  id BIGSERIAL PRIMARY KEY,
  visitor VARCHAR(32) NOT NULL,          -- sha256(visitor_id acak dari localStorage)[:32]
  path VARCHAR(300) NOT NULL,
  referrer VARCHAR(300) NOT NULL DEFAULT '',
  country CHAR(2) NOT NULL DEFAULT 'ZZ', -- ISO 3166-1 alpha-2, ZZ = tidak diketahui
  device VARCHAR(10) NOT NULL DEFAULT 'desktop' CHECK (device IN ('desktop','mobile','tablet')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_site_visits_created ON site_visits(created_at DESC);
CREATE INDEX idx_site_visits_visitor ON site_visits(visitor, created_at);
CREATE INDEX idx_site_visits_country ON site_visits(country);
