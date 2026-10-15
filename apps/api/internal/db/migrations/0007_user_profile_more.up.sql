-- Profil pengguna: alamat, tempat & tanggal lahir.
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN birth_place VARCHAR(100);
ALTER TABLE users ADD COLUMN birth_date DATE;
