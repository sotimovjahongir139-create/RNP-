-- Default admin user, password: arkon10_rnp
INSERT INTO users (username, password_hash, role)
VALUES (
  'admin',
  '$2a$10$2rhubuJZwZ64qaFmrReIhO0VELoBSTDvHCudwBeGbMLI2So9/onvW',
  'admin'
)
ON CONFLICT (username) DO NOTHING;
