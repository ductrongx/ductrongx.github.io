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

## Quản lý nội dung

- `src/data/profile.json`: tên, vai trò, intro, email, liên kết và kinh nghiệm. Schema kiểm tra tại `src/data/profile.ts`.
- `experience`: danh sách `{ "period": "...", "company": "...", "role": "...", "description": "..." }`.
- `src/data/education.ts`: danh sách trường trong footer, gồm tên tiếng Anh, tên viết tắt, URL và logo import từ `src/assets/education/`. Thêm một phần tử để mở rộng; không tự điền bằng cấp hoặc niên khóa chưa xác nhận.
- `links`: danh sách `{ "label": "...", "url": "https://..." }`. Contact nhận nhãn `LinkedIn`, `GitHub`, `Facebook`, `Kaggle` và dùng `email` cho Gmail. Mục chưa có URL sẽ hiện trạng thái chờ, không tạo liên kết giả. Kinh nghiệm trống sẽ hiển thị timeline có nhãn placeholder; thêm dữ liệu thật vào mảng theo thứ tự mới nhất trước.
- `src/content/projects/*.md`: dự án. Frontmatter: `title`, `description`, `date`, `category`, `role`, `order`; tùy chọn `draft`, `sample`, `video` (đường dẫn video).
- `src/content/blog/*.md`: bài viết. Frontmatter: `title`, `description`, `date`, `topic`; tùy chọn `draft`, `sample`.
- `draft: true` loại nội dung khỏi mọi trang công khai, kể cả route chi tiết. `sample: true` hiển thị nhãn nội dung mẫu, không tự ẩn.
- Tên file Markdown tạo slug. Nội dung dưới frontmatter là nội dung trang chi tiết.
- Route: `/`, `/work/`, `/work/[id]/`, `/blog/`, `/blog/[id]/`. Experience và Contact là section ở trang chủ.

**Hiện có sáu dự án concept và một bài viết mẫu**, không phải kinh nghiệm/thành tích thực tế. Thay hoặc xóa trước khi công bố hồ sơ chính thức. Chưa có video dự án; giao diện hỗ trợ trường `video` và phát bằng controls khi thêm tài nguyên thật.

## Giao diện và chuyển động

Bố cục được đối chiếu trực tiếp với Lusion: header cố định và dự án dạng lưới hai cột. Hero/About hiện gộp thành poster hai cột 43%/57%, với nội dung bên trái và một khung trắng tĩnh bên phải. `DESIGN.md` là định hướng ban đầu; cập nhật mới dùng điều hướng luôn hiển thị và các hiệu ứng React Bits được điều chỉnh cho Astro.

Các mục trên header đều dẫn đến section của trang chủ, gồm Blog → `#blog` và Contact → `#contact`. Trên trang chủ, thao tác chỉ cuộn và cập nhật hash, giữ nguyên âm thanh và trạng thái hiệu ứng. Từ trang bài viết/dự án, liên kết đưa về section tương ứng trên trang chủ. `All blog posts` và liên kết bài viết vẫn mở các route nội dung riêng.

- Theo cập nhật layout mới: khung rộng 90% màn hình desktop, tối đa 2.400px (1.728px trên màn hình 1.920px), thay giới hạn 1.400px trong bản định hướng ban đầu. Mobile giữ lề 16px. Header và typography co giãn cùng khung; hero dùng Grid hai cột trên desktop và xếp dọc trên mobile, vẫn nở theo nội dung.
- Font Manrope 400–500 được lưu cục bộ trong `public/fonts/`, gồm ký tự tiếng Việt và giấy phép OFL. Đây là font thay thế có giấy phép mở; không dùng font Aeonik của website tham khảo.
- `BrandLogo.astro` / `brand-logo.ts`: logo Navbar “DUC.ai” với tesseract CSS 3D 44×44px (mobile 40×40px; hai khung kính viền đậm hơn, tám node, lõi xanh và vệt điện SVG chạy trên hai mặt), không thêm canvas hay dependency. Idle xoay 16°/s và float nhẹ; tốc độ cuộn kích thích spring rồi giảm dần. Pointer toàn màn hình điều khiển tilt; hover/focus khóa góc isometric sau khoảng một phần tư vòng và scramble “ai” 400ms, giữ nguyên độ rộng và accessible name. Tab ẩn/window blur dừng vòng render; reduced motion giữ hình tĩnh. Link vẫn dùng cơ chế cuộn về `#top` sẵn có.
- `Header.astro` và `gooey-nav.ts`: Gooey Nav hiện năm mục: About me, Work, Experience, Blog, Contact, không có menu xổ xuống. Pill xanh di chuyển và các hạt kết dính khi hover/chọn mục. Bản DOM/particle của React Bits được chuyển sang SVG alpha filter và Web Animations API. Mục hiện tại cập nhật theo section hoặc route; các phím Tab, Enter, trái/phải, Home/End hoạt động với liên kết thật. Logo quay về đầu trang, không còn mục Home. Header có nền kính mờ khi cuộn. Mobile dùng hai hàng trong lưới ba cột; không giấu điều hướng. Không có JavaScript vẫn thấy và dùng được toàn bộ liên kết.
- Header desktop giữ logo bên trái, gom nút âm thanh và Gooey Nav về sát lề phải của khung, để phần giữa thoáng như concept Lusion. Tablet chuyển navigation xuống hàng riêng và căn phải; mobile dùng lưới ba cột để đủ vùng bấm.
- `SlideText.astro` giữ markup tiêu đề; `text-reveals.ts` dùng IntersectionObserver để hiện từng dòng bằng fade-up 22px và unblur 3px trong 950ms. Tiêu đề và đoạn văn trong main/footer hiện một lần, không đổi màu. Nhãn nhỏ/section-index/project-tags/nhãn WHITE BOX scramble 600ms; mỗi từ giữ kích thước ban đầu, trình đọc màn hình nhận nguyên văn, sau hiệu ứng trả lại text node gốc. Focus, tab ẩn hoặc reduced motion kết thúc hiệu ứng ngay.
- `portfolio-motion.ts`: Lenis làm mượt thao tác wheel trên desktop. Các nút có `data-magnet` hút nhẹ theo con trỏ, tối đa 8px, rồi trở lại bằng spring. Vòng render dùng chung với hiệu ứng card và dừng khi đứng yên hoặc tab ẩn. Mobile dùng cuộn native; reduced motion tắt smoothing và các chuyển động trang trí.
- `ProjectCard.astro` và `project-effects.ts`: trang chủ hiển thị tối đa bốn dự án, trang `/work/` hiển thị toàn bộ. Cả hai dùng hai card mỗi hàng từ 768px, một card mỗi hàng trên mobile; khoảng cách nằm ở tokens `--spacing-project-column` và `--spacing-project-row`. Khung hình tỷ lệ 1.54:1 dùng Tilted Card: nghiêng tối đa 6 độ theo chuột, nâng lên 2.5%, có bóng nhẹ và spring trở về vị trí cũ. Touch/reduced motion không nghiêng card. Liên kết, tên và mũi tên vẫn dùng được bằng bàn phím.
- `ScrollReveal.astro`: giữ bản văn bản liền mạch cho trình đọc màn hình và phần hiển thị riêng. Chuyển động chữ hiện do `text-reveals.ts` quản lý, không chạy đồng thời hiệu ứng scrub từng từ cũ. Không có JavaScript thì mọi nội dung hiện đầy đủ.
- `ScenePlaceholder.astro` dùng chung `TiltCard.astro` cho mọi WHITE BOX dự án; Hero hiện chỉ giữ một khung trắng tĩnh. `project-effects.ts` dùng spring xoay X/Y tối đa 6 độ, scale 1.025 rồi trở lại khi rời chuột; nội dung ở `translateZ(30px)`. Lớp mặt thẻ có preserve-3d và không overflow:hidden để không làm phẳng chiều sâu. Lớp cuộn của Work nằm ngoài và không ghi đè tilt. Touch/reduced motion tắt nghiêng; palette và màu chữ không thay đổi.
- `AmbientAudio.astro` và `ambient-audio.ts`: nút âm thanh trên header bật/tắt cả ambient tự tạo và âm bấm **Dew của React Bits Sound Lab**. Mặc định tắt; bật lên sẽ nghe Dew, sau đó nút/liên kết phản hồi khi click hoặc kích hoạt bằng bàn phím, không phát khi hover. `public/audio/dew.wav` là bản xuất trực tiếp từ recipe/engine chính thức, mặc định, stereo 48kHz PCM16, 376ms / 72KB; chỉ tải và giải mã khi bật âm thanh lần đầu. Không cần React hoặc sound engine ở trình duyệt. Nhạc có fade, tạm dừng khi tab ẩn; mute dừng âm bấm ngay và hủy lượt phát chờ tải. Nguồn và giấy phép nằm trong `public/licenses/react-bits.txt`.
- `GlassCursor.astro`: canvas WebGL toàn màn hình, alpha premultiplied, fixed/inset-0 và pointer-events:none. `fluid-cursor-shaders.ts` mô phỏng flowmap advection + trường sóng có giảm chấn bằng hai texture RGBA8 ping-pong; không cần float-texture extensions hoặc thư viện mới. Mặt kính gần trong suốt, viền trắng và tán sắc pastel cam/xanh/tím khoảng 1–2 CSS px. Đây là mô phỏng ánh sáng/viền trên canvas, không chụp hay làm biến dạng DOM bên dưới. Không thay bảng màu, màu chữ hay nền trang; hoạt động trên cả nền sáng #F4F6FB và palette hiện tại.
- `fluid-cursor-renderer.ts`: hai draw chính mỗi frame, chỉ shade vùng có vệt bằng scissor; flowmap cạnh dài tối đa 640px, DPR hiển thị tối đa 1.25 và ngân sách khoảng 1.8 triệu pixel. Khi frame trung bình vượt 18.5ms, tự hạ độ phân giải cả canvas và mô phỏng (tối thiểu 55%), resample dữ liệu cũ để giữ vệt. `glass-cursor.ts` nhắm lịch 60fps, khởi tạo context ở lần rê chuột đầu, tan hết và dừng vòng render sau tối đa 2.4 giây không di chuyển. Resize cập nhật viewport; xử lý context lost/restored, tab ẩn, blur, bàn phím, dialog chat, reduced motion và touch. Không có WebGL thì giữ con trỏ native.
- Đo trên Chromium headless / ANGLE SwiftShader: khoảng 48–50fps khi chạy vệt sau adaptive quality; baseline không chạy vệt khoảng 60fps. Chưa xác minh 60fps trên GPU phần cứng. Hướng tối ưu theo [WebGL best practices của MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices); không sao chép shader hoặc tài nguyên Lusion.
- `scroll-scenes.ts`: tham khảo nhịp Featured Work của [Lusion](https://lusion.co/), card mở khi vào viewport, từ xa và lệch hai phía với góc xoay nhỏ, rồi chậm dần trong 1.7 giây (mobile 1.15 giây). Cột phải lệch nhịp 100ms; chuyển động vẫn hoàn tất khi ngừng cuộn. Vận tốc cuộn tạo độ trễ nhẹ rồi trở về vị trí gốc. Chỉ phát lại khi ảnh đã hoàn toàn ra khỏi màn hình; transform tách khỏi Tilted Card, không đo layout mỗi frame. Đây là diễn giải CSS/TypeScript, không sao chép shader hoặc tài nguyên của Lusion. Focus hoặc reduced motion đưa card về trạng thái rõ hoàn toàn. Timeline giữ đường tiến trình và nút mốc theo vùng đọc.
- `ExperienceTimeline.astro`: timeline thời gian lấy từ `profile.experience`; hiện ba mốc placeholder (YYYY) khi chưa có dữ liệu. Đường #1D35FF bám cuộn từ tâm node đầu đến node cuối, thu lại khi cuộn ngược. Mỗi lần đi qua mốc có một sóng lan 1.1 giây; nội dung trượt ngang 24px/800ms ở lượt tới đầu tiên. Khối kính nền trôi parallax tối đa ±70px (mobile ±24px), không bắt chuột. Reduced motion tắt sóng, trượt và parallax.
- `ContactLinks.astro`: năm logo liên hệ có màu thương hiệu, nằm trong các ô Dock nhỏ, lấy cosine magnification và spring từ [React Bits Dock](https://www.reactbits.dev/components/dock), chuyển sang Astro/TypeScript trong `contact-dock.ts`. Icon chính và các icon lân cận phóng theo khoảng cách chuột; tooltip hiện khi hover/focus, hỗ trợ Tab, trái/phải, Home/End và Escape. Touch giữ vùng bấm ít nhất 48px; reduced motion tắt phóng đại. Vòng render dừng khi spring ổn định. LinkedIn/GitHub/Kaggle/Gmail thêm magnetic spring trên lớp link, tối đa 8px, độc lập với lớp phóng đại Dock; Facebook giữ Dock. Liên kết mạng xã hội mở tab mới, Gmail dùng mailto. Logo Gmail nhiều màu từ [Google](https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png), giữ nguyên nhận diện. Icon LinkedIn/GitHub/Facebook từ [Simple Icons v11](https://github.com/simple-icons/simple-icons/tree/11.0.0) (CC0, `public/licenses/simple-icons.txt`); icon Kaggle từ [Font Awesome 6.7.2](https://github.com/FortAwesome/Font-Awesome/blob/6.7.2/svgs/brands/kaggle.svg) (CC BY 4.0, `public/licenses/font-awesome.txt`). Không tải thư viện icon ở runtime.
- `Footer.astro`: khối tên/vai trò ở đầu footer dùng chung `TiltCard.astro`, không tạo thêm bản sao ở Contact; thông tin cá nhân gọn, danh sách Education và bản quyền/back-to-top; không lặp liên hệ hay CTA chat. UTH dùng tên tiếng Anh xác minh từ [trang thông tin tạp chí chính thức](https://jtst.uth.edu.vn/about/journal_profile_legal_status), logo gốc từ [cổng xác minh UTH](https://verify.uth.edu.vn/images/logouth.png). Logo thuộc UTH, chỉ dùng nhận diện trường đã học; Astro tối ưu thành WebP cục bộ.
- `PortfolioAssistant.astro`: UI chat dùng native dialog, mở/đóng bằng nút, backdrop hoặc Escape, giữ focus trong panel và trả focus khi đóng. Gợi ý chỉ điền ô nhập; Send bị vô hiệu hóa, không gọi API, không lưu hay gửi tin nhắn.
- `strands-shader.ts` giữ shader Strands chính thức của [React Bits](https://www.reactbits.dev/animations/strands); `strands-orb.ts` thay React host bằng WebGL2 native, canvas nhỏ với DPR tối đa 1.5 và tốc độ tối đa 30fps. Dừng khi tab ẩn hoặc chat mở, reduced motion dựng một frame tĩnh; không hỗ trợ WebGL thì dùng quả cầu CSS. Shader tải động sau UI.
- Các dòng Blog trượt sang phải 8px khi hover/focus; underline dưới tiêu đề chạy từ trái sang phải bằng currentColor. Không đổi màu chữ, không thêm gradient; reduced motion hiển thị underline tức thì và không dịch chuyển dòng.
- `global.css` chứa font và tokens; `portfolio.css` chứa controls, mặt nạ chữ và chuyển trang bằng View Transitions của trình duyệt, có fallback tĩnh.

Các file lab/Three.js và máy SVG cũ được giữ lại để tham khảo; giao diện hiện tại không import hay tải chúng. Lenis quản lý cuộn. Kinh nghiệm và liên hệ lấy từ hồ sơ; nội dung mẫu vẫn có nhãn.

Các chuyển động được điều chỉnh từ [React Bits](https://www.reactbits.dev/get-started/introduction): [Tilted Card](https://www.reactbits.dev/components/tilted-card), [Scroll Reveal](https://www.reactbits.dev/text-animations/scroll-reveal), [Gooey Nav](https://www.reactbits.dev/components/gooey-nav), [Magnet](https://www.reactbits.dev/animations/magnet) và [Split Text](https://www.reactbits.dev/text-animations/split-text). Các hiệu ứng React Bits này được chuyển sang HTML/Astro + TypeScript, không dùng React/GSAP runtime. Gooey Nav dùng bản DOM/particle upstream tại commit `c83b5e7` để giữ hiệu ứng nhẹ. Các bản điều chỉnh chỉ dùng trong portfolio này; thông báo bản quyền David Haz và giấy phép MIT + Commons Clause được giữ tại `public/licenses/react-bits.txt`.


## Hero

`src/components/Hero.astro` gộp Hero/About theo bố cục hai cột. Bên phải là một white frame trang trí, không có cảnh 3D, ảnh mẫu, nút điều khiển hay logic Workbench. Phần giới thiệu, social links và CTA cuộn vẫn giữ nguyên. Đã gỡ React/R3F/drei/postprocessing và tài nguyên riêng của Workbench.

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

Chỉ dùng nhánh `main` chứa source. Workflow upload bản build dưới dạng artifact
`github-pages` và triển khai trực tiếp, không tạo nhánh `deploy` hoặc `gh-pages`.

Địa chỉ website: https://ductrongx.github.io

Repository có dạng `<username>.github.io`, nên website nằm ở `/` và không cần
thêm tên repository vào cấu hình `base`. Khi đổi domain hoặc loại repository,
cần cập nhật `site` và xem lại `base` trong `astro.config.mjs`.

Sau khi chuyển đổi, GitHub Pages phải dùng workflow build thay cho việc phục vụ
file `index.html` ở thư mục gốc. File HTML xuất bản nằm trong `dist/` sau bước build.

## Xử lý lỗi Pages/Jekyll

Nếu workflow **pages build and deployment** báo `Invalid YAML front matter`
trong file `.astro`, GitHub Pages đang dùng nguồn **Deploy from a branch** và
chạy Jekyll trên source Astro.

Đổi **Settings → Pages → Build and deployment → Source** sang **GitHub Actions**.
Không sửa phần JavaScript giữa hai dấu `---` của file Astro để chiều theo Jekyll.
Sau đó push một commit mới và kiểm tra workflow **Deploy to GitHub Pages** có cả
hai job `build` và `deploy` thành công.

Kết quả Jekyll lỗi vẫn được lưu trên commit cũ. Chạy lại workflow Astro trên cùng
commit không xóa check của workflow Jekyll; kiểm tra trạng thái commit mới để
xác nhận cấu hình đã được sửa. Website này đã chuyển nguồn Pages sang GitHub Actions.
