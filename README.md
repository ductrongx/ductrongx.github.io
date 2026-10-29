# ductrongx.github.io

Portfolio cá nhân của Nguyen Trong Duc, sử dụng Astro, TypeScript strict và Tailwind CSS.
Website được build thành HTML/CSS tĩnh và triển khai lên GitHub Pages.

## Yêu cầu

- Node.js 24 LTS và npm đi kèm.
- Nếu dùng nvm, chọn phiên bản trong `.nvmrc`.

## Chạy ở máy local

```sh
npm ci
npm run dev
```

Mở địa chỉ được terminal hiển thị, mặc định là `http://localhost:4321`.

## Kiểm tra và build

```sh
npm run check
npm run build
npm run preview
```

- `check`: kiểm tra Astro và TypeScript.
- `build`: tạo website production trong `dist/`.
- `preview`: xem thử bản build ở local; chạy sau `build`.

Không chỉnh trực tiếp hoặc commit thư mục `dist/`.

## Cấu trúc

```text
.github/workflows/deploy.yml  Workflow build và triển khai GitHub Pages
src/
  layouts/BaseLayout.astro   Khung HTML, metadata và CSS chung
  pages/index.astro          Nội dung trang chủ, route /
  styles/global.css         Điểm vào Tailwind CSS
astro.config.mjs            Cấu hình Astro, Tailwind và URL website
tsconfig.json               TypeScript strict
AGENTS.md                   Quy tắc phát triển dành cho agent
```

Sửa nội dung trang chủ trong `src/pages/index.astro`. Các trang mới đặt trong
`src/pages/` và dùng lại `BaseLayout` khi phù hợp.

Chỉ thêm `src/components/`, `src/assets/`, `public/` hoặc Content Collections khi
có nhu cầu thực tế. Thiết kế và các phần nội dung portfolio chưa được chốt.

## Styling

Tailwind được tích hợp qua Vite và build thành CSS, không tải từ CDN.
Dùng utility class trong component. Khi cần design tokens riêng, khai báo theme
trong `src/styles/global.css` theo cơ chế của phiên bản Tailwind đã cài.

## Triển khai GitHub Pages

1. Đưa toàn bộ source và `package-lock.json` lên repository.
2. Trong **Settings → Pages → Build and deployment → Source**, chọn **GitHub Actions**.
3. Push lên nhánh `main` hoặc chạy thủ công workflow **Deploy to GitHub Pages**.

Workflow cài dependencies theo lockfile, chạy kiểm tra, build và triển khai output.
Nếu bước kiểm tra hoặc build thất bại, job deploy không chạy.

Địa chỉ website: https://ductrongx.github.io

Repository có dạng `<username>.github.io`, nên website nằm ở `/` và không cần
thêm tên repository vào cấu hình `base`. Khi đổi domain hoặc loại repository,
cần cập nhật `site` và xem lại `base` trong `astro.config.mjs`.

Sau khi chuyển đổi, GitHub Pages phải dùng workflow build thay cho việc phục vụ
file `index.html` ở thư mục gốc. File HTML xuất bản nằm trong `dist/` sau bước build.
