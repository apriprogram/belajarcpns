CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'peserta' CHECK (role IN ('admin','peserta')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked')),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  parent_id INT REFERENCES categories(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL CHECK (code IN ('TWK','TIU','TKP')),
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_parent ON categories(parent_id);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtest VARCHAR(10) NOT NULL CHECK (subtest IN ('TWK','TIU','TKP')),
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  difficulty VARCHAR(10) NOT NULL DEFAULT 'sedang' CHECK (difficulty IN ('mudah','sedang','sulit')),
  explanation TEXT NOT NULL DEFAULT '',
  status VARCHAR(10) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','terbit')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_questions_subtest ON questions(subtest, status);
CREATE INDEX idx_questions_category ON questions(category_id);

CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label CHAR(1) NOT NULL CHECK (label IN ('A','B','C','D','E')),
  body TEXT NOT NULL,
  weight INT NOT NULL DEFAULT 0 CHECK (weight BETWEEN 0 AND 5),
  UNIQUE (question_id, label)
);

CREATE TABLE exam_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_minutes INT NOT NULL DEFAULT 100 CHECK (duration_minutes > 0),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  shuffle_options BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(10) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','terbit','arsip')),
  pass_twk INT NOT NULL DEFAULT 65,
  pass_tiu INT NOT NULL DEFAULT 80,
  pass_tkp INT NOT NULL DEFAULT 166,
  pass_total INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE package_questions (
  package_id UUID NOT NULL REFERENCES exam_packages(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  position INT NOT NULL,
  PRIMARY KEY (package_id, question_id)
);
CREATE INDEX idx_pq_package ON package_questions(package_id, position);

CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES exam_packages(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'berlangsung' CHECK (status IN ('berlangsung','selesai')),
  tab_switches INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_attempts_user ON attempts(user_id, status);
CREATE INDEX idx_attempts_package ON attempts(package_id);
-- satu sesi aktif per peserta per paket
CREATE UNIQUE INDEX uq_attempt_active ON attempts(user_id, package_id) WHERE status = 'berlangsung';

CREATE TABLE attempt_questions (
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  position INT NOT NULL,
  option_order TEXT NOT NULL DEFAULT 'ABCDE',
  PRIMARY KEY (attempt_id, question_id)
);

CREATE TABLE attempt_answers (
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (attempt_id, question_id)
);

CREATE TABLE results (
  attempt_id UUID PRIMARY KEY REFERENCES attempts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES exam_packages(id) ON DELETE CASCADE,
  score_twk INT NOT NULL DEFAULT 0,
  score_tiu INT NOT NULL DEFAULT 0,
  score_tkp INT NOT NULL DEFAULT 0,
  score_total INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  wrong_count INT NOT NULL DEFAULT 0,
  empty_count INT NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  duration_seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_results_package ON results(package_id, score_total DESC);
CREATE INDEX idx_results_user ON results(user_id, created_at DESC);

CREATE TABLE attempt_events (
  id BIGSERIAL PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE practice_answers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
  score INT NOT NULL DEFAULT 0,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_practice_user ON practice_answers(user_id, created_at DESC);

CREATE TABLE study_logs (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  seconds INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

CREATE TABLE daily_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  subtest VARCHAR(10) NOT NULL DEFAULT 'TWK',
  due_time VARCHAR(5) NOT NULL DEFAULT '09:00',
  priority VARCHAR(10) NOT NULL DEFAULT 'sedang' CHECK (priority IN ('rendah','sedang','tinggi')),
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_targets_user_day ON daily_targets(user_id, day);

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE settings (
  key VARCHAR(60) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(60) NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);
