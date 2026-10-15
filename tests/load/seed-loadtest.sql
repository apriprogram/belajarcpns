-- 500 akun uji beban: loadtest1..loadtest500@bisapns.id / Peserta123!
-- Hash bcrypt cost 12 (diverifikasi dengan golang.org/x/crypto/bcrypt).
INSERT INTO users (name, email, phone, password_hash, role, status)
SELECT 'Peserta Loadtest ' || g,
       'loadtest' || g || '@bisapns.id',
       '0800' || lpad(g::text, 8, '0'),
       '$2b$12$h6aMH4B9QGU6IrsAAq7LJuiCaBqbRcw0sYUnCJeB5IVafilKITPAK',
       'peserta', 'active'
FROM generate_series(1, 500) AS g
ON CONFLICT (email) DO NOTHING;

SELECT count(*) AS akun_loadtest FROM users WHERE email LIKE 'loadtest%@bisapns.id';
