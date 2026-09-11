# 🎯 ITPTIT — Web Phỏng Vấn Thành Viên

Ứng dụng web nội bộ phục vụ việc phỏng vấn tuyển thành viên CLB IT PTIT. Tra cứu CV thí sinh, ghi nhận xét, chấm điểm và quản lý lịch sử phỏng vấn — tất cả lưu ngay trên trình duyệt, không cần internet hay server.

---

## ✨ Tính Năng

| Tính năng | Mô tả |
|-----------|-------|
| 🔍 **Tra cứu thí sinh** | Tìm theo tên hoặc Mã Sinh Viên (MSV) theo thời gian thực |
| 📄 **Xem CV** | Hiển thị toàn bộ thông tin CV dạng đẹp, dễ đọc, theo từng mục |
| ✍️ **Ghi nhận xét** | Panel bên phải để nhập nhận xét và chấm điểm 1–10 |
| 📋 **Lịch sử phỏng vấn** | Xem danh sách tất cả lượt đã phỏng vấn |
| 🔧 **Sửa / Xóa** | Chỉnh sửa nhận xét, điểm số hoặc xóa lượt phỏng vấn |
| 🔎 **Lọc & Sắp xếp** | Lọc theo khoảng điểm, sắp xếp theo thứ tự phỏng vấn hoặc điểm |
| 📥 **Xuất CSV** | Xuất toàn bộ lịch sử thành file `.csv` (mở được bằng Excel) |
| 💾 **Lưu local** | Dữ liệu lưu trong `localStorage` của trình duyệt, không cần mạng |

---

## 🚀 Hướng Dẫn Sử Dụng

### Mở ứng dụng

> **Yêu cầu**: Trình duyệt hiện đại (Chrome, Edge, Firefox). Do dùng ES Modules, **không thể mở file `index.html` trực tiếp** — cần chạy qua local server.

**Cách 1 — Dùng VS Code (khuyến nghị):**
1. Cài extension **Live Server** trong VS Code
2. Mở thư mục `WEBpvan` bằng VS Code
3. Click chuột phải vào `index.html` → **"Open with Live Server"**

**Cách 2 — Dùng Python:**
```bash
cd WEBpvan
python -m http.server 8080
```
Sau đó mở `http://localhost:8080` trong trình duyệt.

**Cách 3 — Dùng Node.js:**
```bash
cd WEBpvan
npx serve .
```

---

### Luồng Phỏng Vấn

```
1. Tra cứu thí sinh (tên / MSV)
       ↓
2. Chọn thí sinh → xem CV đầy đủ
       ↓
3. Ghi nhận xét + chấm điểm (1–10) ở panel bên phải
       ↓
4. Bấm "Lưu kết quả" → tự động quay về trang tra cứu
       ↓
5. Xem lại tại trang "Lịch Sử"
```

---

### Trang Tra Cứu

- Gõ **tên** hoặc **MSV** vào ô tìm kiếm → kết quả hiện ngay lập tức
- Thí sinh đã phỏng vấn sẽ có badge **"✓ Đã PV"** màu xanh
- Bấm vào card thí sinh để xem CV

---

### Trang CV + Nhận Xét

- **Cột trái**: Toàn bộ thông tin CV theo từng mục (điểm mạnh/yếu, thành tích, IT, Design...)
- **Panel phải**: 
  - Thanh trượt chấm điểm 1–10 (màu đổi theo điểm: đỏ → cam → vàng → xanh)
  - Ô nhập nhận xét
  - Nút **"Lưu kết quả"** / **"Cập nhật"** (nếu đã lưu trước đó)
  - Bấm nút `❮` để thu/mở panel
- Nút **"Quay lại"** ở góc trên trái để quay về trang trước

---

### Trang Lịch Sử

- **Tìm kiếm**: Gõ tên hoặc MSV để lọc
- **Sắp xếp**: Theo thứ tự phỏng vấn (mặc định), điểm cao → thấp, v.v.
- **Lọc điểm**: 9–10, 7–8, 4–6, 1–3
- **Bấm vào card**: Xem CV + sửa nhận xét / điểm
- **Nút ✏️**: Mở trang CV để chỉnh sửa
- **Nút 🗑️**: Xóa lượt phỏng vấn (có hộp xác nhận)
- **Nút "Xuất CSV"**: Tải file `ITPTIT_PV_YYYY-MM-DD.csv` về máy

---

### File CSV Xuất Ra

File CSV có các cột sau (mở bằng Excel đọc được tiếng Việt):

| Thứ tự | Họ và Tên | Mã Sinh Viên | Lớp | Ca Phỏng Vấn | Nhận Xét | Điểm |
|--------|-----------|--------------|-----|--------------|----------|------|
| 1 | Nguyễn Văn A | B26DCCN... | D26CQCN... | Thứ 7 - Ca 08:00 | ... | 8 |

---

## 📁 Cấu Trúc Thư Mục

```
WEBpvan/
├── index.html          # Trang chính (entry point)
├── css/
│   └── style.css       # Toàn bộ giao diện (Dracula dark theme)
├── js/
│   ├── data.js         # Dữ liệu 162 thí sinh từ CSV
│   ├── app.js          # Điều hướng trang & modal xác nhận
│   ├── search.js       # Logic trang tra cứu
│   ├── profile.js      # Logic trang CV & panel nhận xét
│   ├── history.js      # Logic trang lịch sử (filter, CRUD, export)
│   └── utils.js        # Hàm tiện ích (search, localStorage, toast...)
└── README.md           # Tài liệu này
```

---

## 💾 Dữ Liệu Lưu Ở Đâu?

Toàn bộ lịch sử phỏng vấn lưu trong **`localStorage`** của trình duyệt với key `itptit_interview_history`. Dữ liệu **chỉ tồn tại trên máy đang dùng** và **không bị mất** khi đóng tab (trừ khi xóa cache trình duyệt).

> ⚠️ **Lưu ý**: Nếu dùng trình duyệt ẩn danh (Incognito), dữ liệu sẽ mất khi đóng cửa sổ trình duyệt.

---

## 🛠️ Yêu Cầu Kỹ Thuật

- **Trình duyệt**: Chrome 80+, Firefox 75+, Edge 80+, Safari 14+
- **Không cần cài đặt** gì thêm
- **Không cần internet** sau khi tải trang lần đầu (font Google Fonts cần mạng)
- **Không cần backend / server** (ngoại trừ local HTTP server để chạy ES Modules)

---

## 📝 Ghi Chú Kỹ Thuật

- Dữ liệu thí sinh được nhúng trực tiếp vào `js/data.js` dưới dạng JS array, parse từ file CSV gốc
- Ứng dụng dùng **ES Modules** (native browser), không cần build/bundler
- Routing dùng `location.hash` đơn giản
- Mỗi thí sinh (theo MSV) chỉ có **1 lượt phỏng vấn** — submit lại sẽ ghi đè lượt cũ
