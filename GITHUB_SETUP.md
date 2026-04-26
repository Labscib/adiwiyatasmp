# Setup GitHub Auto-Save untuk Feedback

## Langkah-langkah:

### 1. Buat GitHub Personal Access Token (PAT)
- Buka https://github.com/settings/tokens
- Klik "Generate new token" → "Generate new token (classic)"
- Isi form dengan:
  - **Note**: `Adiwiyata Feedback`
  - **Expiration**: Pilih "No expiration" atau sesuai kebutuhan
  - **Scopes**: Pilih `repo` (untuk akses ke repository)
- Klik "Generate token"
- **Copy token** (hanya tampil sekali!)

### 2. Isi Konfigurasi di Halaman Feedback
Di halaman feedback.html, isi bagian "Pengaturan GitHub":
- **GitHub Personal Access Token**: Paste token yang sudah di-copy
- **Username GitHub**: Nama GitHub Anda (contoh: adiwiyata-org)
- **Nama Repository**: Nama repository tempat file tersimpan (contoh: adiwiyata)
- Klik tombol "Simpan Konfigurasi"

### 3. Verifikasi
Setelah tersimpan:
- Kirim feedback baru
- Cek file `feedback.txt` di repository GitHub
- File akan otomatis terupdate dengan commit message

## Catatan:
- Token disimpan di browser localStorage (jangan share URL)
- Setiap feedback baru akan membuat commit baru di GitHub
- Untuk environment production, gunakan environment variables atau backend
