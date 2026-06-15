# RNP — Ishlab Chiqarish Dashboard

## Ishga tushirish

### 1. Sozlash
cd backend
npm install
cp .env.example .env
# .env ichiga DATABASE_URL va JWT_SECRET yozing

### 2. Ishga tushirish
npm run dev
# SQL migrationlar avtomatik ishlaydi
# http://localhost:3000

### 3. Admin foydalanuvchi yaratish
node src/scripts/createUser.js admin sizning_parolingiz

### 4. Kirish
http://localhost:3000
Login: admin
Parol: sizning_parolingiz

## Deploy (Render.com)
1. GitHub ga push qiling
2. render.com da "New Blueprint" — bu reponi ulang
3. DATABASE_URL va JWT_SECRET ni qo'shing
4. Deploy — migrationlar avtomatik ishlaydi
