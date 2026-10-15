-- Profil pengguna: jenis kelamin & foto profil.
ALTER TABLE users ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('laki-laki','perempuan'));
ALTER TABLE users ADD COLUMN avatar_url TEXT;
