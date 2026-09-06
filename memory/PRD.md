# ACO Shift Scheduler — Product Requirements

## Original Problem Statement
Aplikasi penjadwalan shift & manajemen pengajuan untuk **16 personil**, dengan menu login yang dibedakan **Admin** dan **Personil** (login NIK + password). Admin punya kontrol penuh: CRUD personil, approve/reject pendaftaran, edit jadwal manual + auto-generate + import Excel, edit tampilan (judul, sub-judul, logo, warna aksen, tanda tangan), review pengajuan (cuti tahunan/penting/besar, sakit, dinas luar, diklat, penugasan). Personil hanya bisa melihat jadwal + ajukan permohonan. Fitur khusus: notifikasi lonceng, riwayat perubahan, ringkasan bulanan (jumlah shift + total jam), auto-reject konflik cuti bila coverage minimum tidak terpenuhi (min 2 pagi + 2 siang + 1 malam per hari), ekspor PDF lanskap + XLSX, dark mode auto moon-blue, kalender pribadi personil.

## Tech Stack
- Backend: FastAPI + MongoDB (motor)
- Frontend: React 19 + Tailwind + shadcn/ui + dnd-kit
- Auth: JWT (bcrypt), NIK+password
- Font: Outfit (display) + Plus Jakarta Sans (body) + JetBrains Mono
- Warna aksen: Electric moon-blue #008BFF (dapat diubah admin via color picker)

## User Personas
1. **Administrator** — Kontrol operasional penuh, mengelola personil & jadwal, menyetujui pengajuan.
2. **Personil** — 16 anggota tim, hanya lihat jadwal & ajukan permohonan.

## What's been implemented (Feb 2026)
- [x] JWT auth + admin seed (NIK=ADMIN001, password=Admin@123, email=acorosteringschedule@gmail.com)
- [x] Register → Admin approve/reject flow
- [x] Personnel CRUD + drag-reorder di tabel shift
- [x] Shift schedule table (manual edit + auto-generate 3-2/3-3/2-2 + Excel import)
- [x] Coverage validator (min 2 pagi + 2 siang + 1 malam/hari) dengan alert di grid
- [x] Pengajuan (cuti_tahunan/penting/besar, sakit, dinas_luar, diklat, penugasan) → auto-update jadwal saat approve
- [x] Konflik cuti otomatis: approve akan auto-reject jika coverage kurang
- [x] Notifikasi in-app (lonceng) untuk admin & personil
- [x] Ringkasan bulanan (P/S/M/L/C + total jam: pagi 6h, siang 6h, malam 12h)
- [x] Change log (siapa mengubah apa & kapan)
- [x] Export PDF lanskap + XLSX
- [x] Kalender pribadi personil
- [x] Site settings (title, subtitle, main_text, logo base64, tanda tangan, primary_color picker live)
- [x] Dark mode auto (system pref + manual toggle) dengan palet moon-blue

## Backlog / P1
- [ ] Email notifications via Resend (di-skip user; bisa diaktifkan nanti)
- [ ] Push browser notifications (native Notification API) untuk realtime tanpa refresh
- [ ] Personnel avatar upload
- [ ] Bulk shift editor (select multiple cells)
- [ ] Login attempt rate limiting

## API Endpoints
See `/app/backend/server.py`. All under `/api`:
- `/auth/register`, `/auth/login`, `/auth/me`
- `/users` (list/create/update/delete/reorder), `/users/pending`, `/users/{id}/approve`
- `/shifts` (get), `/shifts/cell` (upsert), `/shifts/auto-generate`, `/shifts/import-excel`
- `/requests` (list/create), `/requests/{id}/action`
- `/notifications`, `/notifications/read-all`
- `/summary`, `/change-logs`
- `/settings` (get public, put admin)
- `/exports/pdf`, `/exports/xlsx`
