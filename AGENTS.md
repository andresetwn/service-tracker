# AGENTS.md

# Vehicle Repair History Tracker

## 1. Project Overview

### Project Name

Vehicle Repair History Tracker

### Purpose

Aplikasi untuk mencatat dan melihat riwayat perawatan serta perbaikan kendaraan.

Aplikasi berfungsi sebagai catatan digital untuk mengetahui:

* Kapan kendaraan diperbaiki.
* Kilometer kendaraan saat diperbaiki.
* Keluhan atau masalah kendaraan.
* Pekerjaan yang dilakukan.
* Part atau komponen yang diganti.
* Biaya perbaikan.
* Catatan tambahan mengenai perbaikan.

Project ini **hanya berfokus pada pencatatan riwayat perbaikan/perawatan yang sudah dilakukan**.

Aplikasi bukan sistem manajemen bengkel dan tidak memiliki fitur penjadwalan servis berikutnya.

---

# 2. Main Concept

Struktur utama aplikasi:

```text
Kendaraan
    │
    └── Riwayat Perbaikan
            │
            ├── Tanggal
            ├── Kilometer
            ├── Keluhan
            ├── Pekerjaan
            ├── Part yang Diganti
            ├── Biaya
            └── Catatan
```

Satu kendaraan dapat memiliki banyak riwayat perbaikan.

Contoh:

```text
Honda Vario 160
B 1234 XYZ

20 Januari 2026
KM 5.000
Ganti oli
Rp75.000

15 April 2026
KM 8.200
Ganti oli + filter udara
Rp180.000

20 September 2026
KM 12.100
Ganti oli + kampas rem
Rp350.000
```

---

# 3. Technology Stack

Gunakan teknologi berikut kecuali project sudah menggunakan teknologi berbeda:

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

## Database

Project ini menggunakan Supabase sebagai database utama.

### Database Provider

- Provider: Supabase
- Database engine: PostgreSQL
- Database harus menggunakan Supabase.
- Jangan membuat database alternatif tanpa instruksi.

### Tables

Database menggunakan struktur:

vehicles
    ↓
repair_records
    ↓
repair_parts
repair_work

### Vehicle

- id: UUID, PRIMARY KEY
- name: TEXT
- brand: TEXT
- model: TEXT
- year: INTEGER
- license_plate: TEXT, UNIQUE
- current_km: INTEGER
- notes: TEXT

### Repair Records

- id: UUID, PRIMARY KEY
- vehicle_id: UUID, FOREIGN KEY → vehicles.id
- repair_date: DATE
- mileage: INTEGER
- repair_type: TEXT
- complaint: TEXT
- notes: TEXT
- parts_cost: NUMERIC
- labor_cost: NUMERIC
- additional_cost: NUMERIC
- total_cost: NUMERIC

### Repair Parts

- id: UUID, PRIMARY KEY
- repair_id: UUID, FOREIGN KEY → repair_records.id
- name: TEXT
- brand: TEXT
- quantity: INTEGER
- unit_price: NUMERIC
- subtotal: NUMERIC

### Repair Work

- id: UUID, PRIMARY KEY
- repair_id: UUID, FOREIGN KEY → repair_records.id
- description: TEXT
- notes: TEXT

### Database Rules

- `vehicles.id` adalah identitas utama kendaraan.
- `vehicles.license_plate` harus UNIQUE.
- `repair_records.vehicle_id` harus mengarah ke kendaraan yang valid.
- `repair_records.mileage` harus berupa angka dan tidak boleh negatif.
- Nilai biaya harus berupa angka dan tidak boleh negatif.
- Jangan membuat fitur servis berikutnya.
- Jangan membuat reminder servis.
- Jangan membuat booking servis.

* Supabase
## Supabase Safety Rules

- Always identify the correct Supabase project before making changes.
- Always inspect existing tables before modifying the database.
- Prefer migrations for schema changes.
- Never delete tables without explicit user confirmation.
- Never delete existing data without explicit user confirmation.
- Never reset a database or branch without explicit user confirmation.
- Never pause or delete a Supabase project without explicit user confirmation.
- Never create a new Supabase project unless explicitly requested.
- Never modify production data unnecessarily.
- For destructive SQL operations, ask for confirmation first.
- Do not modify unrelated tables.
* PostgreSQL

## Deployment

* Vercel

---

# 4. Vehicle Data

Aplikasi harus dapat menyimpan data kendaraan.

Data minimal:

* ID kendaraan
* Nama kendaraan
* Merek
* Model
* Tahun
* Nomor polisi (UNIK)
* Kilometer saat ini
* Catatan

Contoh:

```text
Nama        : Motor Harian
Merek       : Honda
Model       : Vario 160
Tahun       : 2024
No. Polisi  : B 1234 XYZ
KM Saat Ini : 12.500 km
```

Jika pengguna memiliki beberapa kendaraan, setiap kendaraan harus memiliki riwayat yang terpisah.

---

# 5. Repair History

Setiap kendaraan dapat memiliki banyak catatan perbaikan.

Setiap record minimal memiliki:

* ID
* Vehicle ID
* Tanggal perbaikan
* Kilometer
* Jenis perbaikan
* Keluhan
* Pekerjaan yang dilakukan
* Part yang diganti
* Biaya
* Catatan

---

# 6. Repair Date

Tanggal perbaikan wajib dicatat.

Contoh:

```text
Tanggal:
20 September 2026
```

Gunakan tipe data `date` pada database jika memungkinkan.

Jangan menyimpan tanggal sebagai teks bebas jika database menyediakan tipe tanggal.

---

# 7. Kilometer

Kilometer merupakan informasi utama pada setiap riwayat perbaikan.

Contoh:

```text
Kilometer saat perbaikan:
12.500 km
```

Rules:

* Harus berupa angka.
* Tidak boleh negatif.
* Wajib diisi.
* Ditampilkan dengan format yang mudah dibaca.

Database:

```text
12500
```

UI:

```text
12.500 km
```

---

# 8. Kilometer Validation

Sistem dapat memberikan peringatan jika kilometer pada record baru lebih kecil daripada record sebelumnya.

Contoh:

```text
20 Januari
5.000 km

15 April
8.000 km

20 September
12.000 km
```

Jika pengguna memasukkan:

```text
Record sebelumnya:
12.000 km

Record baru:
8.000 km
```

berikan peringatan karena nilai kilometer menurun.

Namun jangan mengubah atau menghapus data secara otomatis.

---

# 9. Repair Type

Jenis perbaikan dapat berupa:

* Servis rutin
* Ganti oli
* Ganti filter
* Perbaikan rem
* Perbaikan mesin
* Perbaikan kelistrikan
* Perbaikan ban
* Perawatan CVT
* Perawatan transmisi
* Penggantian part
* Lainnya

Pengguna dapat memasukkan deskripsi tambahan jika diperlukan.

---

# 10. Complaint / Problem

Pengguna dapat mencatat masalah atau keluhan kendaraan sebelum diperbaiki.

Contoh:

```text
Keluhan:

Motor terasa bergetar ketika melakukan pengereman.
```

Field ini bersifat opsional jika perbaikan tidak berasal dari keluhan tertentu.

---

# 11. Repair Work

Pengguna dapat mencatat pekerjaan yang dilakukan.

Contoh:

```text
Pekerjaan:

- Pemeriksaan sistem pengereman
- Penggantian kampas rem
- Pembersihan komponen rem
```

Pekerjaan dan part yang diganti merupakan data yang berbeda.

Contoh:

```text
Pekerjaan:
Mengganti kampas rem depan.

Part:
Kampas rem depan.
```

---

# 12. Parts Replaced

Satu riwayat perbaikan dapat memiliki beberapa part.

Contoh:

```text
Riwayat Perbaikan
20 September 2026
KM 12.000

Part yang diganti:

- Oli mesin
- Filter oli
- Kampas rem depan
- Busi
```

Informasi part dapat mencakup:

* Nama part
* Merek
* Jumlah
* Harga satuan
* Subtotal
* Catatan

---

# 13. Part Cost

Perhitungan part:

```text
Subtotal = Harga Satuan × Jumlah
```

Contoh:

```text
Kampas rem
Jumlah     : 1
Harga      : Rp120.000
Subtotal   : Rp120.000
```

Jika terdapat beberapa part:

```text
Oli          Rp75.000
Filter       Rp30.000
Kampas rem   Rp120.000
----------------------
Total Part   Rp225.000
```

---

# 14. Repair Cost

Biaya perbaikan dapat terdiri dari:

```text
Biaya Part
+
Biaya Jasa
+
Biaya Tambahan
=
Total Biaya
```

Contoh:

```text
Biaya Part       Rp225.000
Biaya Jasa       Rp100.000
Biaya Tambahan    Rp25.000
--------------------------
Total            Rp350.000
```

Total sebaiknya dihitung otomatis.

---

# 15. Currency Rules

Gunakan Rupiah.

Database:

```text
350000
```

UI:

```text
Rp350.000
```

Jangan menyimpan:

```text
"Rp350.000"
```

sebagai nilai numerik di database.

Rules:

* Nilai tidak boleh negatif.
* Gunakan tipe numerik.
* Format Rupiah hanya pada UI.
* Perhitungan dilakukan menggunakan angka.

---

# 16. Notes

Setiap riwayat dapat memiliki catatan tambahan.

Contoh:

```text
Catatan:

Kondisi kendaraan setelah perbaikan normal.
Pemilik meminta pemeriksaan tambahan pada bagian CVT.
```

Catatan bersifat opsional.

---

# 17. Vehicle Detail

Halaman kendaraan menampilkan:

```text
Informasi Kendaraan
        │
        ├── Merek
        ├── Model
        ├── Tahun
        ├── Nomor Polisi
        └── Kilometer
        │
        ↓
Riwayat Perbaikan
```

Informasi tambahan:

* Total riwayat perbaikan.
* Total pengeluaran perawatan.
* Kilometer terakhir yang tercatat.
* Riwayat perbaikan terbaru.

---

# 18. Repair History Timeline

Riwayat dapat ditampilkan secara kronologis.

Contoh:

```text
20 September 2026
12.000 km
────────────────────
Ganti oli
Ganti kampas rem

Biaya:
Rp350.000


15 Juni 2026
9.000 km
────────────────────
Servis rutin
Ganti oli

Biaya:
Rp150.000
```

Default:

```text
Terbaru → Terlama
```

---

# 19. Repair History Table

Riwayat juga dapat ditampilkan dalam bentuk tabel.

Kolom:

```text
Tanggal
KM
Jenis Perbaikan
Pekerjaan
Part
Total Biaya
```

User dapat membuka detail setiap record.

---

# 20. Search

Pencarian dapat berdasarkan:

* Nama kendaraan
* Nomor polisi
* Jenis perbaikan
* Nama part
* Keluhan
* Catatan

---

# 21. Filter

Riwayat dapat difilter berdasarkan:

* Kendaraan
* Jenis perbaikan
* Rentang tanggal
* Rentang kilometer
* Part yang diganti

---

# 22. Sorting

Default:

```text
Tanggal:
Terbaru → Terlama
```

Pilihan sorting:

```text
Terbaru
Terlama
KM terkecil
KM terbesar
Biaya terendah
Biaya tertinggi
```

---

# 23. CRUD

Riwayat perbaikan harus mendukung:

### Create

Menambahkan riwayat perbaikan.

### Read

Melihat riwayat perbaikan.

### Update

Mengubah riwayat perbaikan.

### Delete

Menghapus riwayat perbaikan.

Sebelum delete:

```text
Apakah Anda yakin ingin menghapus riwayat perbaikan ini?
```

Jangan menghapus data penting tanpa konfirmasi.

---

# 24. Repair Form

Form minimal:

```text
Tanggal Perbaikan *
Kilometer *
Jenis Perbaikan *
Keluhan
Pekerjaan
Part yang Diganti
Biaya Part
Biaya Jasa
Biaya Tambahan
Catatan
```

Tidak terdapat field:

```text
Servis Berikutnya
Tanggal Servis Berikutnya
KM Servis Berikutnya
Reminder Servis
```

---

# 25. Form Validation

## Tanggal

* Wajib diisi.
* Harus merupakan tanggal valid.

## Kilometer

* Wajib diisi.
* Harus berupa angka.
* Tidak boleh negatif.

## Jenis Perbaikan

* Wajib diisi.

## Biaya

* Harus berupa angka.
* Tidak boleh negatif.

## Part

Jika part ditambahkan:

* Nama part wajib diisi.
* Jumlah harus lebih besar dari 0.
* Harga tidak boleh negatif.

---

# 26. Data Model

Struktur konseptual:

```text
vehicles
    │
    └── repair_records
            │
            ├── repair_parts
            │
            └── repair_work
```

Contoh:

```text
Vehicle
  │
  ├── Repair Record #1
  │      ├── Parts
  │      └── Work
  │
  ├── Repair Record #2
  │      ├── Parts
  │      └── Work
  │
  └── Repair Record #3
         ├── Parts
         └── Work
```

---

# 27. Database Rules

Relasi utama:

```text
repair_records.vehicle_id
        ↓
vehicles.id
```

```text
repair_parts.repair_id
        ↓
repair_records.id
```

```text
repair_work.repair_id
        ↓
repair_records.id
```

Gunakan foreign key jika sesuai dengan desain database.

Jangan menyimpan informasi kendaraan berulang kali pada setiap repair record.

---

# 28. Data Integrity

Pastikan:

* Setiap repair record memiliki kendaraan.
* Setiap repair record memiliki tanggal.
* Setiap repair record memiliki kilometer.
* Part terhubung dengan repair record.
* Work terhubung dengan repair record.
* Biaya berupa angka.
* Kilometer berupa angka.
* Tanggal valid.

---

# 29. UI / UX

Aplikasi harus terasa seperti:

**Personal Vehicle Maintenance / Repair History Tracker**

Bukan:

* Sistem administrasi bengkel.
* Sistem kasir bengkel.
* Sistem booking bengkel.
* Sistem reminder servis.

Prioritas UI:

1. Kendaraan
2. Riwayat perbaikan
3. Kilometer
4. Part
5. Pekerjaan
6. Biaya
7. Catatan

Gunakan desain yang:

* Sederhana
* Bersih
* Profesional
* Mudah dipahami
* Responsive

---

# 30. Dashboard

Dashboard dapat menampilkan:

```text
Total Kendaraan
Total Riwayat Perbaikan
Total Pengeluaran
Perbaikan Terakhir
KM Terakhir
```

Contoh:

```text
Honda Vario 160

Perbaikan Terakhir
20 September 2026

KM Terakhir
12.000 km

Total Riwayat
8 Perbaikan

Total Pengeluaran
Rp2.450.000
```

Tidak perlu menampilkan:

```text
Servis Berikutnya
Reminder
Countdown Servis
Rekomendasi Servis
```

---

# 31. Loading State

Tampilkan loading ketika:

* Mengambil kendaraan.
* Mengambil riwayat.
* Menyimpan data.
* Mengubah data.
* Menghapus data.

---

# 32. Empty State

Jika belum ada kendaraan:

```text
Belum ada kendaraan.

Tambahkan kendaraan untuk mulai mencatat riwayat perbaikan.
```

Jika kendaraan belum memiliki riwayat:

```text
Belum ada riwayat perbaikan.

Tambahkan riwayat perbaikan pertama untuk kendaraan ini.
```

---

# 33. Error Handling

Gunakan pesan sederhana.

Contoh:

```text
Gagal menyimpan riwayat perbaikan.
Silakan coba lagi.
```

Jangan menampilkan error teknis database secara langsung kepada user.

---

# 34. Security

Jangan:

* Hardcode API key.
* Mengekspos database credentials.
* Mengekspos Supabase service role key.
* Menyimpan password plaintext.
* Mempercayai input tanpa validation.

Gunakan environment variables.

---

# 35. Coding Rules

* Gunakan TypeScript.
* Gunakan reusable components.
* Ikuti struktur project yang sudah ada.
* Hindari `any` jika tidak diperlukan.
* Hindari duplikasi logic.
* Gunakan nama variable yang jelas.
* Jangan membuat component terlalu besar.
* Jangan menambahkan dependency tanpa alasan.
* Jangan mengubah bagian yang tidak berhubungan dengan task.

---

# 36. Change Scope

Jika user meminta:

> Tambahkan fitur pencatatan part yang diganti.

Fokus pada:

* Form part.
* Database part.
* Relasi part dengan riwayat perbaikan.
* Tampilan part.
* Perhitungan biaya part.

Jangan otomatis menambahkan:

* Reminder.
* Jadwal servis berikutnya.
* Notifikasi servis.
* Sistem booking.
* Sistem customer.
* Sistem pembayaran.

---

# 37. Important Business Rules

### Rule 1

Satu kendaraan dapat memiliki banyak riwayat perbaikan.

### Rule 2

Setiap riwayat memiliki tanggal.

### Rule 3

Setiap riwayat memiliki kilometer.

### Rule 4

Satu riwayat dapat memiliki banyak part.

### Rule 5

Satu riwayat dapat memiliki banyak pekerjaan.

### Rule 6

Total biaya dapat dihitung dari komponen biaya.

### Rule 7

Kilometer tidak seharusnya menurun secara normal.

### Rule 8

Riwayat perbaikan merupakan catatan historis dan harus dipertahankan.

### Rule 9

Tidak ada fitur servis berikutnya atau reminder dalam project ini.

---

# 38. What the Agent Should NOT Assume

Jangan mengasumsikan:

* Kendaraan selalu motor.
* Kendaraan selalu mobil.
* Semua perbaikan memiliki part.
* Semua perbaikan memiliki biaya jasa.
* Semua perbaikan memiliki biaya tambahan.
* Semua kendaraan memiliki nomor polisi.
* Semua perbaikan berasal dari keluhan.
* Semua riwayat memiliki catatan tambahan.

Aplikasi harus fleksibel terhadap kondisi tersebut.

---

# 39. Testing Checklist

## Vehicle

* [ ] Tambah kendaraan
* [ ] Edit kendaraan
* [ ] Lihat kendaraan
* [ ] Hapus kendaraan jika diperbolehkan

## Repair History

* [ ] Tambah riwayat
* [ ] Edit riwayat
* [ ] Lihat detail
* [ ] Hapus riwayat
* [ ] History tampil dengan benar

## Kilometer

* [ ] Angka valid
* [ ] Tidak negatif
* [ ] Warning jika kilometer menurun

## Parts

* [ ] Tambah part
* [ ] Edit part
* [ ] Hapus part
* [ ] Harga benar
* [ ] Quantity benar
* [ ] Subtotal benar

## Cost

* [ ] Biaya part benar
* [ ] Biaya jasa benar
* [ ] Biaya tambahan benar
* [ ] Total benar
* [ ] Format Rupiah benar

## UI

* [ ] Desktop
* [ ] Tablet
* [ ] Mobile

---

# 40. Verification

Gunakan command yang tersedia di project.

Contoh:

```bash
npm run lint
npm run build
```

Jika tersedia:

```bash
npm test
```

Jangan menyatakan build atau test berhasil jika belum benar-benar dijalankan.

---

# 41. Completion Checklist

Sebelum menyelesaikan task:

* [ ] Requirement dipahami.
* [ ] Fitur berhasil dibuat.
* [ ] Data tersimpan dengan benar.
* [ ] Data ditampilkan dengan benar.
* [ ] Validation bekerja.
* [ ] Error handling tersedia.
* [ ] Loading state diperiksa.
* [ ] Empty state diperiksa.
* [ ] Responsive layout diperiksa.
* [ ] Perhitungan biaya benar.
* [ ] Kilometer benar.
* [ ] Riwayat perbaikan tetap terjaga.
* [ ] Tidak ada credential yang terekspos.
* [ ] Tidak ada perubahan di luar scope.
* [ ] Tidak ada fitur reminder/servis berikutnya yang ditambahkan.
* [ ] Lint diperiksa.
* [ ] Build diperiksa.
* [ ] Test diperiksa jika tersedia.

---

# 42. Final Response

Setelah menyelesaikan task, berikan:

## Changes Made

Jelaskan perubahan yang dibuat.

## Files Changed

Sebutkan file yang dibuat atau diubah.

## Database Changes

Jika ada perubahan database, jelaskan.

## Verification

Sebutkan lint, build, atau test yang telah dijalankan.

## Notes

Sebutkan asumsi atau masalah yang masih tersisa.

Jangan menyatakan task selesai jika belum diverifikasi.

## Vehicle Identification

Nomor polisi merupakan identifier utama yang digunakan user
untuk mencari dan mengakses kendaraan dalam aplikasi.

Setiap kendaraan tetap memiliki `id` internal sebagai primary key
database.

### License Plate

- `license_plate` wajib diisi.
- `license_plate` digunakan sebagai identifier/search key pada UI.
- `license_plate` harus unik untuk setiap user.
- Gunakan database constraint:

  UNIQUE (user_id, license_plate)

- Nomor polisi tidak digunakan sebagai primary key.
- Nomor polisi harus dinormalisasi untuk mencegah duplikasi akibat
  perbedaan huruf besar/kecil atau spasi.

Contoh:

B 1234 XYZ
b1234xyz
B1234 XYZ

harus diperlakukan sebagai nomor polisi yang sama setelah normalisasi.

# WARNA 
Use a professional automotive dashboard color palette for the Vehicle Repair History Tracker.

Primary: #2563EB
Primary hover: #1D4ED8
Background: #F8FAFC
Cards: #FFFFFF
Main text: #0F172A
Secondary text: #64748B
Border: #E2E8F0
Success: #16A34A
Warning: #F59E0B
Danger: #DC2626

Keep the UI clean, modern, professional, and minimal.
Do not use too many accent colors.
Use blue as the main brand color.
Ensure good contrast and readability.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
