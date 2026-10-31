> **Hướng triển khai hiện hành — Experimental AI Studio (31/10/2026)**
> Phần này thay thế các mô tả màu sắc, kiểu chữ, khung hero và camera ở các phiên bản bên dưới. Cá tính đã được người dùng chọn: táo bạo, thích thử nghiệm, sáng tạo công nghệ.

## Experimental AI Studio

- Bố cục rộng tối đa 1600px, lề 40px desktop / 16px mobile. Hero không còn nằm trong container 1152px. Nội dung đọc có lề riêng.
- Nền mineral `#f5f5f0`, chữ graphite `#17201f`, accent electric blue `#244bd8`, vùng phụ sage `#e4eccd`. Không dùng cam. Khu compute trong phòng có màu graphite để tạo chiều sâu với kiến trúc sáng.
- Typography sans-serif hỗ trợ tiếng Việt, tên cỡ lớn, tracking chặt, label monospace nhỏ và có tiết chế. CTA rõ, ít bo góc, tránh nhiều card nổi chồng lên nhau.
- Poster mở đầu là lớp HTML dễ đọc ở trái, phòng 3D hiện bên phải; bảng danh tính vật lý vẫn có trong phòng. Ảnh cá nhân chưa được cung cấp nên giữ vị trí có nhãn rõ.
- Camera khám phá ở tầm nhìn trong không gian, không nhìn từ trên xuống một mô hình có đế. Sàn, trần và tường kéo dài khỏi khung hình. Có cửa kính, baffle trần, khu compute, bàn hai màn hình, ghế, dây, tủ và mô hình mạng neural.
- Vật liệu PBR có hạt bề mặt nhẹ, môi trường phản xạ, một nguồn bóng chính. Desktop dùng SSAO bóng tiếp xúc với render target MSAA; mobile render trực tiếp. Geometry tĩnh gộp theo vật liệu và điểm tương tác.
- Điều hướng theo preset camera, chọn đồ vật hoặc menu tương đương bằng bàn phím. Panel mở trên phòng desktop, dưới phòng mobile; Escape đóng và trả focus. Nội dung vẫn đọc được khi không có WebGL.
- Chuyển camera 900ms, panel 350ms, hover 200ms; card dự án reveal bằng CSS view timeline khi trình duyệt hỗ trợ. Tôn trọng reduced-motion; không chạy vòng render liên tục khi đứng yên.
- Nguồn tham khảo chuyển động: [Motion JavaScript](https://motion.dev/docs/), [Chrome motion guidance](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion). Triển khai bằng API trình duyệt và Three.js, không sao chép component trả phí hoặc thêm React.
- Không bịa thành tích hoặc số liệu. Các project/blog mẫu tiếp tục có nhãn; màn hình trong lab là mô phỏng concept, không phải dữ liệu vận hành thật.

---

# Style Design — Light Research Lab

Phiên bản: 2 · Cập nhật: 31/10/2026

Đặc tả bố cục và tương tác để refactor portfolio theo [DESIGN.md](DESIGN.md). Đây là thiết kế mục tiêu; cảnh lab, ảnh cá nhân và các hành vi dưới đây chưa được triển khai.

## 1. Cấu trúc trải nghiệm

```text
Tên / Home                       Dự án · Kinh nghiệm · Bài viết · Liên hệ

┌───────────────────────────────────────────────────────────────────────┐
│ LAB — ban đầu camera nhìn gần poster trên tường                       │
│      ┌─────────────────────────────────────────────────────────┐      │
│      │ [Ảnh cá nhân]       [Tên]                               │      │
│      │                     AI Engineer                         │      │
│      │                     [Một câu định vị]                   │      │
│      │                     [2–3 thông tin đã xác minh]          │      │
│      │                     [Khám phá lab]  Xem dự án ↓          │      │
│      └─────────────────────────────────────────────────────────┘      │
│ Khi khám phá: lùi ra thấy bàn, màn hình, bảng và kệ                    │
│ [Giới thiệu] [Dự án] [Kinh nghiệm] [Bài viết] [Liên hệ] [Toàn cảnh]    │
└───────────────────────────────────────────────────────────────────────┘

Dự án        Một preview chính rộng + các mục tiếp theo
Kinh nghiệm  Danh sách theo thời gian khi có nội dung thật
Bài viết     Một mục nhấn + danh sách dễ đọc
Liên hệ      Khối kết trang với thông tin thật
```

Wireframe minh họa cấu trúc, không phải nội dung xuất bản. Tiếp tục tiếng Việt từ UI hiện có, có thể giữ thuật ngữ như AI Engineer; không thêm chuyển ngôn ngữ trong đợt này.

## 2. Header và đường đi trực tiếp

- Tên/logo chữ liên kết `/`. Menu dùng nhãn: Dự án, Kinh nghiệm, Bài viết, Liên hệ.
- Ở trang chủ, liên kết tới `#work`, `#experience`, `#blog`, `#contact` để xem trực tiếp. Từ trang khác dùng `/#...`.
- Trong từng phần có liên kết xem toàn bộ tới `/work/` hoặc `/blog/`. Giữ route chi tiết hiện có.
- Header nằm trong luồng bố cục. Nếu làm sticky, dùng nền đặc và chừa khoảng cuộn cho anchor/focus; tránh lớp kính khó đọc trên cảnh.
- Menu mobile có nút mở rõ ràng, trạng thái expanded, đóng bằng Escape hoặc chọn link; trả focus đúng nơi khi đóng bằng bàn phím.
- Có skip link tới nội dung chính; không đặt camera tour trước điểm đến này.

## 3. Dàn cảnh lab

### Thành phần và phân vai

| Đồ vật / khu vực | Nội dung | Khi tương tác |
|---|---|---|
| Bảng poster lớn | Ảnh và giới thiệu | Trở về góc poster, hiện giới thiệu |
| Màn hình trên bàn | Dự án | Camera tới bàn, mở tóm tắt và link `#work`, `/work/` |
| Bảng hồ sơ cạnh tường | Kinh nghiệm | Camera tới bảng, mở nội dung và link `#experience` |
| Kệ sổ nghiên cứu | Bài viết | Camera tới kệ, hiện bài viết và link `#blog`, `/blog/` |
| Thẻ liên hệ trên bàn | Liên hệ | Camera tới thẻ, hiện cách liên hệ thật và link `#contact` |

Đây là đề xuất dàn cảnh; có thể đổi vị trí khi dựng để tránh che khuất. Nhãn UI nói rõ nội dung, chẳng hạn “Dự án”, thay vì chỉ “Màn hình”.

- Giữ 4–5 điểm nội dung chính; vật trang trí khác không giả vờ tương tác.
- Màn hình chỉ hiện screenshot thật, mẫu có nhãn hoặc trạng thái trống. Không chạy terminal/số liệu giả.
- Chưa có dữ liệu thì điểm đến giải thích bằng chữ, không mở panel trống hoặc link lỗi; có thể giảm nhấn ở bản xuất bản.
- Dùng chung một cảnh cho các góc, không tải căn phòng riêng cho từng section.
- Máy SVG hiện tại không còn là trung tâm hero. Khi refactor có thể dùng làm đồ vật nhỏ nếu phù hợp hoặc bỏ khỏi trang; không cần sửa bộ sinh hình chỉ để giữ tài sản cũ.

### Định khung

- Góc `poster`: gần chính diện, ít méo phối cảnh; đủ chỗ cho tên dài và tiếng Việt.
- Góc `overview`: phối cảnh ba phần tư, thấy hai mặt tường và sàn; bàn thấp hơn poster, kệ cân bằng khối phía đối diện.
- Góc đối tượng: tiến đủ để thấy vật thể và bối cảnh; panel HTML có vùng riêng, không che điểm đang được nhấn.
- Camera không đi xuyên tường, cắt bàn hoặc để mặt gần che poster. Kiểm tra cả các thời điểm trung gian.
- Hero desktop mục tiêu 75–90svh với giới hạn theo màn hình. Đây là kích thước vùng cảnh; khối chữ được tăng chiều cao hoặc đổi bố cục khi cần, không bị cắt để vừa viewport.

## 4. Poster: nội dung và cách đọc

| Trường | Nguồn hiện có / cần bổ sung |
|---|---|
| Tên | `src/data/profile.json` → `name` |
| Vai trò | `role`, hiện là AI Engineer |
| Câu định vị | `headline` |
| Mô tả ngắn | `intro`, biên tập 2–3 dòng theo layout thật |
| Hướng quan tâm | Có thể từ `eyebrow`; chỉ tách nhãn khi có ý nghĩa |
| Ảnh | Cần ảnh thật và crop; schema hiện chưa có trường ảnh |
| Liên hệ | `email`, `links`; chỉ hiện dữ liệu thật |

- Chưa có ảnh thì bản dựng hiện vùng giữ chỗ “Ảnh cá nhân — chờ bổ sung”; nói rõ nếu còn khi bàn giao.
- Không thêm thông tin chỉ để lấp poster. Cho phép khoảng trắng khi hồ sơ ngắn.
- Tên là heading chính; vai trò và câu định vị tạo thứ bậc sau. Biên tập headline hiện tại để tránh hai `h1`.
- Ảnh có kích thước dự trữ, crop không cắt mặt, alt phù hợp ngữ cảnh, không lặp cả đoạn giới thiệu.

### HTML gắn với bảng trong phòng

- HTML là nguồn nội dung chính, render bằng Astro ngay. Khung vật lý và bóng của bảng thuộc cảnh 3D.
- Ở mở đầu, lớp HTML khớp mặt bảng. Nếu projection làm chữ khó đọc, điều chỉnh camera/mặt bảng và ưu tiên chữ rõ nét.
- Khi lùi ra, poster có thể chuyển thành hình đại diện thị giác đơn giản trong cảnh. Không để nút HTML thu nhỏ thành đích khó bấm; giữ nút “Giới thiệu” ở dải điều khiển lab.
- Bản poster trong cảnh và HTML cùng nguồn dữ liệu; bản thị giác lặp lại không tạo thêm heading/tab stop cho công nghệ hỗ trợ.
- Fallback dùng chính HTML và ảnh căn phòng tĩnh, không có hồ sơ thứ hai với nội dung riêng.

## 5. Trạng thái và hành vi camera

| Trạng thái | Hiển thị | Hành động |
|---|---|---|
| `loading` | Poster HTML và ảnh phòng tĩnh đã hiện | Menu, Xem dự án; phản hồi tải nếu bấm Khám phá lab |
| `poster` | Camera nhìn gần poster | Khám phá lab, Xem dự án, menu |
| `overview` | Camera nhìn toàn phòng | Điểm nội dung, Giới thiệu, menu |
| `transitioning` | Camera đi giữa hai góc | Về toàn cảnh/hủy, menu và cuộn vẫn hoạt động |
| `focused` | Camera ở đối tượng, panel hiện | Đọc tóm tắt, link xem tiếp, Về toàn cảnh |
| `fallback` | Ảnh phòng tĩnh, poster và link HTML | Đủ đường đọc; không mô tả như 3D đang hoạt động |

### Luồng mặc định

1. Hiện poster HTML và ảnh tĩnh ngay khi trang tải, không có splash chặn đọc.
2. Cảnh sẵn sàng thì thay ảnh tĩnh bằng canvas cùng góc poster; không nháy nền hoặc đổi layout.
3. Bấm “Khám phá lab”: camera lùi ra `overview` khoảng 900–1200ms. Không tự hẹn giờ rời poster, không bắt chờ tour để dùng menu.
4. Bấm điểm nội dung: camera tới góc tương ứng khoảng 600–900ms rồi hiện panel. Reduced motion chuyển trực tiếp.
5. “Về toàn cảnh” hoặc Escape đóng panel và về `overview`. “Giới thiệu” trở về poster.
6. Bấm “Xem dự án” hoặc menu anchor: đóng panel, hủy chuyển camera và cuộn tới nội dung. Không kéo người xem trở lại hero.

Thời lượng là mức thử ban đầu. Bấm “Khám phá lab” khi chưa tải xong phải có phản hồi ngay; chỉ thực hiện một lần khi sẵn sàng nếu người xem vẫn ở hero. Rời hero hoặc chuyển fallback thì hủy yêu cầu đó.

### Chuyển trạng thái và quay lại

- Chỉ có một camera transition. Chọn đích khác thay đích từ vị trí hiện tại, không xếp hàng các chuyến bay.
- Escape/Về toàn cảnh hủy transition an toàn, không để kẹt điều khiển hay panel thiếu nội dung.
- Chọn qua canvas và nút HTML gọi cùng hành động.
- Hero khuất màn hình/tab ẩn: dừng render và chốt về đích logic, không tích lũy thời gian để camera nhảy khi trở lại.
- Tải mới bắt đầu ở poster. URL có hash section giữ vị trí hash, không tự chạy mở đầu.
- Góc phòng là state UI cục bộ, không thêm từng góc vào browser history. Anchor/route là liên kết thật, giữ hành vi Back.

## 6. Điểm bấm, panel và accessibility

- Nhãn điểm bấm có tên nội dung và gắn theo projection đồ vật. Canvas hỗ trợ chuột/chạm nhưng không phải đường thao tác duy nhất.
- Dải nút HTML theo thứ tự Giới thiệu → Dự án → Kinh nghiệm → Bài viết → Liên hệ. Mỗi đích chỉ có một nút trong tab order; nhãn trùng trên cảnh không tạo nút bàn phím thứ hai.
- Khi projection bị vật khác che, ra ngoài viewport hoặc chồng nhãn, ẩn nhãn trên cảnh và giữ dải nút. Không bấm xuyên qua vật che.
- Vùng bấm tối thiểu khoảng 44×44 CSS px; focus rõ và selected có cả chữ/viền.
- Mô tả cảnh ngắn bằng HTML. Nếu canvas chỉ bổ sung thị giác, ẩn nó khỏi cây accessibility và trình bày mọi hành động qua HTML tương đương.
- Panel desktop là vùng nền đặc cạnh cảnh, có heading và nút đóng. Mobile dùng cùng nội dung trong luồng dưới cảnh; không cần modal cho tóm tắt.
- Mở panel thì focus heading có `tabindex="-1"`; đóng bằng nút/Escape trả về nút mở. Không trap focus ở panel không modal.
- Chỉ thông báo tải/lỗi cần thiết bằng trạng thái ngắn; không đọc vị trí camera mỗi frame.
- Không có hành động chỉ bằng hover. Hover/focus làm nổi viền/nhãn, không rung hoặc phóng toàn phòng.
- Thứ tự DOM: header → giới thiệu → điều khiển lab → panel → nội dung cuộn; không chạy theo vị trí 3D.

## 7. Nội dung cuộn bên dưới

### Dự án

- Đề xuất một dự án dẫn đầu có preview rộng và mô tả lệch cạnh; mục tiếp theo có thể dùng hai cột. Mobile một cột theo thứ tự nội dung.
- Chọn mục dẫn đầu bằng thứ tự đã biên tập, không tự khẳng định thành tích hoặc chất lượng cao nhất.
- Preview trên bề mặt sage/blue, có mép và bóng mềm; nền trang vẫn thoáng.
- Ưu tiên screenshot/demo thật. Concept/sample hiện có phải giữ nhãn “Nội dung mẫu”.
- Có tên, một câu bài toán/đầu ra, vai trò và năm; mở `/work/[id]/`.
- Nút demo riêng với link case study; video có poster, controls, không autoplay, không nằm trong link bao card.

### Kinh nghiệm

- Thời gian bên trái, nội dung bên phải; mobile xếp dọc.
- Có thể dùng dải nền stone và điểm mốc nhỏ tạo nhịp, không bọc mỗi hàng thành card nổi.
- Chỉ hiện dữ liệu thật. Trống thì có trạng thái cập nhật ngắn, không tạo résumé giả.

### Bài viết

- Một bài gần nhất có thể nhấn bằng mảng giấy rộng, sans heading và mô tả; bài còn lại dạng list.
- Không bắt buộc thumbnail; minh họa chỉ khi giúp hiểu nội dung.
- Giữ chủ đề, ngày, route `/blog/[id]/` và nhãn bài mẫu theo dữ liệu.

### Liên hệ

- Vùng kết sáng như chân poster: câu mời, địa chỉ và link thật.
- Chỉ hiện email, GitHub, LinkedIn hoặc CV khi có dữ liệu/tài nguyên; chưa thêm form.
- Thiếu thông tin thì trạng thái ngắn, không đưa nút vô hiệu/địa chỉ mẫu vào bản công khai.

### Trang danh sách và chi tiết

- `/work/`, `/blog/` và trang chi tiết cùng tokens, font, header/footer; không tải lab ở các route này.
- Chi tiết ưu tiên đọc: cột khoảng 65–72 ký tự, heading rõ, code cuộn trong vùng riêng, hình có kích thước dự trữ.
- Tên/ảnh dự án dùng link thật; không tạo đích rỗng cho vật trang trí.

## 8. Responsive và dự phòng

| Ngữ cảnh | Cách trình bày |
|---|---|
| Desktop rộng | Poster trong phòng; toàn cảnh có nhãn, panel cạnh cảnh |
| Tablet | Crop lại camera giữ nội dung chính; nút xuống dòng, panel dưới cảnh nếu thiếu chỗ |
| Mobile | Poster đọc rõ phía trước khung phòng; khám phá dùng góc gọn, nút/panel dưới cảnh |
| Không JavaScript | Ảnh phòng tĩnh, poster HTML, menu/anchor/routes hoạt động |
| Không WebGL / lỗi tải / mất context | Giữ hoặc phục hồi ảnh tĩnh, thông báo ngắn, đủ đường đọc HTML |
| Reduced motion | Bỏ hành trình camera/parallax/reveal; đổi góc trực tiếp, giữ nút nội dung |
| Tải chậm | Poster và ảnh tĩnh sẵn trước; tải 3D riêng, tiếp tục đọc ngay |

- Không thu nhỏ nguyên desktop xuống mobile. Nếu cần, ảnh/chữ poster xếp dọc, hero cao theo nội dung.
- Mobile ưu tiên chính diện poster; không cố giữ transform làm chữ mờ/méo.
- Quyết định tải 3D mobile sau khi đo prototype. Nếu chưa đạt ngân sách, mặc định ảnh tĩnh và nút “Bật khám phá 3D”; mọi nội dung vẫn truy cập qua HTML.
- Không dùng bảng tải toàn màn hình. Có thể hiện “Đang chuẩn bị lab” gần điều khiển kèm “Xem dự án”; lỗi chuyển trạng thái rõ, không spinner vô hạn.
- Kiểm tra 360px, 390px, 768px, 1024px, 1440px, màn hình thấp/ngang và zoom chữ 200%.

## 9. Hướng triển khai kỹ thuật

### Nền tảng và dữ liệu

- Giữ Astro static, TypeScript strict, Tailwind v4, npm/lockfile, GitHub Pages và route hiện có.
- Astro render poster/menu/nội dung chính lúc build; không lấy nội dung tĩnh qua API trình duyệt.
- Đề xuất Three.js cho 3D thật và camera preset. Cần đánh giá/cài ở giai đoạn prototype; chưa thêm dependency trong lần cập nhật tài liệu.
- Vòng đời cảnh và state machine đặt trong module TypeScript cục bộ. Chưa cần React, engine game, thư viện scroll hay global store.
- JS nhỏ cho menu/panel/camera; chỉ cân nhắc framework khi độ phức tạp thực tế chứng minh cần thiết.
- Hồ sơ và mỗi collection là nguồn chung cho poster, panel, section; không sao chép nội dung vào scene.
- Khi có ảnh thật, mở rộng schema ảnh và cập nhật README theo AGENTS.md.

### Phân trách nhiệm dự kiến

Chỉ tạo file khi bước refactor thực sự dùng tới:

- `src/components/LabHero.astro`: ghép poster, ảnh tĩnh, canvas, điều khiển và panel.
- `src/components/ProfilePoster.astro`: ảnh/hồ sơ, tách vì trách nhiệm riêng và responsive phức tạp.
- `src/components/lab-scene.ts`: renderer, camera preset, chọn vật thể và projection; tách thêm khi trách nhiệm thực tế cần.
- `src/assets/`: ảnh cần tối ưu và asset có pipeline build phù hợp; `public/` cho file cần phục vụ nguyên bản.
- Tokens nền trong `src/styles/global.css`; style riêng của lab gần component. Bố cục UI dùng Tailwind là chính.

### Render và hiệu năng

- Poster/ảnh đầu trang không chờ module 3D; ảnh cá nhân có width/height, responsive sizes và không lazy-load nếu là ứng viên LCP.
- Dynamic import cảnh tách khỏi nội dung chính, chỉ tải ở trang chủ; không preload mọi model/video/texture.
- Render khi scene đổi; frame loop chỉ chạy trong camera transition/animation cần thiết. Đứng yên thì dừng, cập nhật khi resize, tải asset xong hoặc tương tác.
- Dừng khi ngoài viewport/tab ẩn; hủy listeners và giải phóng tài nguyên GPU khi tháo scene.
- Prototype dùng geometry đơn giản, vật liệu mờ, ít texture, ánh sáng/bóng có thể bake. Không mặc định hậu kỳ, bloom hay realtime shadow lớn.
- Pixel ratio theo đo đạc, dự kiến 1–1.5 mobile, tối đa 2 desktop; không tự lấy toàn bộ devicePixelRatio.
- Ngân sách thử ban đầu: phần 3D tải thêm gồm JS/model/texture khoảng ≤2MB transfer ở cấu hình cơ bản; hướng tới 60fps desktop và tối thiểu 30fps mobile trong camera transition. Đây là mục tiêu cần đo, chưa đạt sẵn.
- Nếu vượt ngân sách, giảm texture/vật liệu/bóng trước, giữ khả năng đọc và điều hướng.

Tham khảo chính thức: [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html), [Rendering on Demand](https://threejs.org/manual/pages/rendering-on-demand.html), [Responsive Design](https://threejs.org/manual/pages/responsive.html). Đây là hướng áp dụng cho repo; phiên bản và API cụ thể sẽ kiểm tra khi triển khai.

## 10. Thứ tự refactor và nghiệm thu

1. **Poster HTML và bộ màu:** ảnh giữ chỗ có nhãn, nội dung từ profile, header, trạng thái rỗng và fallback tĩnh; chốt layout desktop/mobile.
2. **Prototype căn phòng:** tường/sàn/bàn/poster/kệ, ánh sáng và hai góc poster/toàn cảnh; kiểm tra chiều sâu và chữ khớp bảng trước chi tiết nhỏ.
3. **Camera và nội dung:** góc tương tác, panel, nút bàn phím, Escape/quay lại, thao tác liên tiếp.
4. **Đồng bộ trang cuộn/route:** refactor preview, kinh nghiệm, bài viết, liên hệ, trang danh sách/chi tiết; giữ nhãn dữ liệu mẫu.
5. **Tối ưu và kiểm tra:** đo tải/GPU, fallback, mobile, focus, reduced motion, production build; tinh chỉnh trang trí sau luồng chính.

### Kiểm tra khi thực hiện UI

- `npm run check`, `npm run build`; repo không có script lint/format, không tự báo đã chạy.
- Desktop/mobile: layout, chữ dài, crop ảnh, tương phản, focus, không tràn ngang.
- Tab/Shift+Tab, Enter/Space, Escape: mở/đọc/đóng panel và trả focus.
- Camera: đổi đích liên tiếp, hủy, rời hero, tab ẩn/hiện và resize ở từng góc.
- Reduced motion từ đầu và khi đang chuyển camera.
- Không JS/WebGL, lỗi asset, tải chậm, mất context: nội dung vẫn truy cập được.
- Anchor, URL có hash, route, browser Back và focus không bị kéo về hero.
- Console, đường asset production; không tải lab trên trang bài viết/case study.
- Đo transfer và frame rate thực tế trước khi tuyên bố đạt ngân sách.

## 11. Tài nguyên thiếu và điểm cần xác minh

| Mục | Trạng thái |
|---|---|
| Ảnh thật, quyền sử dụng, crop | Chưa cung cấp |
| Nội dung poster | Có name/role/headline/intro; cần biên tập trên layout |
| Email, link, kinh nghiệm | Hiện trống |
| Dự án, bài viết, preview thật | Có hai dự án và một bài mẫu; cần thay hoặc giữ nhãn mẫu công khai |
| Asset phòng, ánh sáng, camera preset | Chưa dựng |
| Hình tĩnh khớp góc mở đầu | Chưa tạo |
| Màu, cặp font, vị trí đồ vật, thời lượng | Đề xuất theo hướng đã chọn; cần kiểm chứng qua prototype |
| WebGL mobile, accessibility, hiệu năng | Chưa đo/kiểm tra |

Thiếu ảnh hoặc dữ liệu thật không ngăn dựng prototype có nhãn. Tài liệu/prototype chưa đồng nghĩa UI hoàn thành hoặc hồ sơ sẵn sàng xuất bản.

## Cập nhật triển khai — AI Research Studio

Theo yêu cầu nâng cấp mới: nền sáng chuyển sang trắng khoáng và ice teal, bổ sung cobalt/lilac; display dùng sans hệ thống. Hướng này thay các đề xuất serif và giấy kem ở phiên bản đầu.

- Lab có màn hình ultrawide minh họa neural graph, cụm máy tính nghiên cứu, mô hình mạng trên bệ, bàn thử chip và bảng ghi chép. Các hình là concept, không phải kết quả/thiết bị sở hữu thực tế.
- Vật thể có cạnh bo nhỏ, vật liệu nhôm và sơn mờ, một đèn đổ bóng cùng ánh sáng cửa sổ/trần. Renderer dùng sRGB và ACES; màn hình dùng texture minh họa không phụ thuộc ánh sáng để giữ màu rõ.
- Chi tiết tĩnh được ghép theo vật liệu và đích tương tác để giảm draw calls. Vẫn render theo nhu cầu, giữ reduced motion và HTML fallback.
- Tham khảo đương đại: [Google DeepMind Science](https://deepmind.google/science/), [Anthropic Research](https://www.anthropic.com/research). Đây là định hướng biên tập riêng, không tuyên bố là một xu hướng duy nhất hay mới nhất.
