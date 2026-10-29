# Hướng dẫn cho agent

Áp dụng cho toàn bộ repository portfolio cá nhân `ductrongx.github.io`.

## 1. Bối cảnh và mục tiêu

- Repository sử dụng Astro, TypeScript strict và Tailwind CSS, xuất trang tĩnh để triển khai trên GitHub Pages.
- Trang chủ nằm ở `src/pages/index.astro`, khung HTML ở `src/layouts/BaseLayout.astro`, điểm vào Tailwind ở `src/styles/global.css`.
- Thiết kế, nội dung và các phần của portfolio chưa được chốt. Không mặc định website phải có blog, danh sách kỹ năng, trang liên hệ hoặc các phần khác.
- Ưu tiên: code rõ ràng, hiệu năng tốt, khả năng truy cập, dễ sửa và ít phụ thuộc.
- Chỉ khởi tạo hoặc chuyển đổi công nghệ khi nhiệm vụ yêu cầu; file này không phải yêu cầu tự động migrate website.
- Kiểm tra trạng thái thực tế của repository trước khi áp dụng các hướng dẫn dành cho Astro.

## 2. Cách thực hiện công việc

- Đọc hướng dẫn liên quan, kiểm tra file hiện có và thay đổi chưa commit trước khi sửa.
- Giữ nguyên thay đổi của người dùng; không ghi đè, hoàn tác hoặc xóa công việc không thuộc nhiệm vụ.
- Hoàn thành thay đổi trong phạm vi yêu cầu. Không tiện tay refactor phần không liên quan.
- Tự quyết định các chi tiết triển khai nhỏ theo quy ước hiện có. Chỉ hỏi khi thiếu thông tin ảnh hưởng đáng kể đến nội dung, thiết kế hoặc kiến trúc.
- Không tự commit, push hoặc thay đổi cấu hình triển khai khi nhiệm vụ chưa bao gồm việc đó.
- Sau khi làm xong, báo ngắn gọn: đã thay đổi gì, đã kiểm tra gì và phần nào chưa xác minh được.

## 3. Kiến trúc và cấu trúc thư mục

Khi khởi tạo Astro, dùng bộ khung tối thiểu dưới đây. Chỉ tạo thư mục khi có file thực sự cần đặt vào đó.

```text
public/                 File phục vụ nguyên bản: favicon, CV, robots.txt...
src/
  assets/               Ảnh và tài nguyên cần xử lý khi build
  components/           Các phần giao diện có trách nhiệm rõ ràng
  layouts/              Khung trang dùng chung
  pages/                Route và phần ghép trang
  styles/               Design tokens và CSS nền tảng
```

- `pages/` tập trung lấy dữ liệu và ghép giao diện. Đưa logic dùng chung ra ngoài khi thực sự có nhu cầu.
- `layouts/` quản lý khung HTML, metadata và các thành phần chung theo thiết kế thực tế.
- Tách component theo trách nhiệm, khả năng tái sử dụng hoặc độ phức tạp; không tách mọi thẻ HTML thành component.
- Để logic chỉ phục vụ một component gần component đó. Khi nhiều nơi cần dùng, mới chuyển sang module chung.
- Chỉ thêm `data/`, `content/`, `lib/` hoặc nhóm component theo tính năng khi có nhu cầu cụ thể.
- Không tạo trước service layer, repository pattern, global store, barrel export hoặc hệ thống plugin cho nhu cầu giả định.
- Không dùng số dòng cố định làm lý do duy nhất để tách file.

## 4. Quy tắc Astro và TypeScript

- Dùng component `.astro` cho giao diện và nội dung thông thường.
- Ưu tiên render nội dung chính thành HTML lúc build. Không gọi API ở trình duyệt để lấy nội dung tĩnh đã có thể lấy lúc build.
- Dùng JavaScript thuần cho tương tác nhỏ. Chỉ thêm React hoặc thư viện UI khi tính năng cụ thể cần đến.
- Khi dùng component tương tác, chọn thời điểm hydrate theo nhu cầu; tránh mặc định dùng `client:load` hoặc `client:only` cho mọi component.
- Bật TypeScript strict khi thiết lập dự án. Khai báo kiểu cho props và dữ liệu tại ranh giới module.
- Tránh `any`, non-null assertion và ép kiểu để che lỗi. Thu hẹp kiểu hoặc kiểm tra dữ liệu đầu vào.
- Không tắt kiểm tra TypeScript, lint hoặc accessibility chỉ để vượt qua bước kiểm tra.
- Đặt tên thể hiện mục đích; tránh các tên mơ hồ như `data2`, `temp`, `Common` hoặc `Manager` khi có tên cụ thể hơn.
- Component và layout dùng PascalCase; module tiện ích và route dùng kebab-case; biến và hàm dùng camelCase.
- Ưu tiên named export cho module TypeScript nội bộ, trừ khi framework hoặc công cụ yêu cầu cách khác.
- Chỉ comment để giải thích quyết định, ràng buộc hoặc logic khó hiểu; không diễn giải lại từng dòng code.

## 5. Giao diện và CSS

- Tôn trọng thiết kế đã được chấp nhận. Khi chưa có thiết kế, chỉ xây phần cần cho nhiệm vụ và giữ dễ thay đổi.
- Dùng Tailwind CSS làm công cụ styling chính, tích hợp vào quá trình build; không dùng CDN runtime cho production.
- Ưu tiên utility class cho bố cục, responsive và trạng thái tương tác. Chỉ dùng CSS tùy chỉnh hoặc scoped style khi utility không diễn đạt rõ hoặc không đáp ứng nhu cầu.
- Khai báo design tokens dùng chung như màu, font, khoảng cách và kích thước nội dung qua cơ chế theme phù hợp với phiên bản Tailwind đang dùng; không lặp lại giá trị tùy ý ở nhiều component.
- Giữ tên class Tailwind đầy đủ trong mã nguồn. Khi chọn style theo props, dùng ánh xạ sang chuỗi class hoàn chỉnh; không nối động từng phần tên class.
- Tái sử dụng nhóm style qua component và props có ý nghĩa; tránh lạm dụng `@apply`, class xung đột và arbitrary values cho các giá trị đã có trong theme.
- CSS global chỉ chứa điểm vào Tailwind, cấu hình theme và style nền tảng cần thiết; không thêm reset trùng lặp với Tailwind.
- Dùng Grid và Flexbox cho bố cục; tránh định vị tuyệt đối cho toàn trang, chiều cao cứng cho vùng văn bản và lạm dụng `!important`.
- Làm responsive theo nội dung; kiểm tra màn hình hẹp, rộng và nội dung dài.
- Không thêm dark mode, animation, icon pack hoặc design system nếu nhiệm vụ chưa cần.
- Khi có chuyển động, tôn trọng `prefers-reduced-motion` và tránh làm nội dung phụ thuộc vào hiệu ứng.

## 6. Nội dung và tài nguyên

- Tách dữ liệu lặp lại hoặc cần cập nhật độc lập khỏi markup; nội dung đơn giản dùng một lần có thể nằm ngay trong trang.
- Khi có blog hoặc case study, ưu tiên Content Collections với schema kiểm tra dữ liệu. Chỉ dùng MDX khi cần nhúng component.
- Nếu có trạng thái bản nháp, lọc bản nháp khỏi trang, danh sách và các đầu ra công khai liên quan trong production.
- Không tự bịa kinh nghiệm, số liệu, khách hàng, thành tích, lời chứng thực hoặc liên kết cá nhân.
- Nội dung mẫu phải được nhận diện rõ và nêu trong bàn giao nếu còn tồn tại.
- Giữ ngôn ngữ nội dung nhất quán với yêu cầu. Dùng tiếng Anh cho tên biến, hàm và file code.
- Ảnh cần tối ưu đặt trong `src/assets/` hoặc gần nội dung; `public/` dành cho tài nguyên cần giữ nguyên.
- Không thêm CMS, database hoặc backend khi chưa có nhu cầu quản trị hay xử lý dữ liệu cụ thể.

## 7. Hiệu năng, SEO và accessibility

- Hạn chế JavaScript phía trình duyệt và thư viện bên thứ ba. Không tải cả thư viện cho một thao tác nhỏ.
- Dùng pipeline ảnh của Astro khi phù hợp; cung cấp kích thước và ảnh responsive. Không lazy-load ảnh chính đầu trang nếu đó là ứng viên LCP.
- Giới hạn số font, biến thể và dung lượng. Nếu có tiếng Việt, bảo đảm font hỗ trợ đầy đủ dấu.
- Dùng HTML semantic, thứ bậc heading hợp lý, nút cho hành động và liên kết cho điều hướng.
- Các thành phần tương tác phải dùng được bằng bàn phím, có focus rõ ràng và nhãn phù hợp.
- Ảnh mang thông tin có alt mô tả; ảnh trang trí có alt rỗng. Form có label và thông báo lỗi dễ hiểu.
- Đặt `lang`, title và description phù hợp; thêm canonical, Open Graph và sitemap khi triển khai các trang công khai cần đến.
- Không bịa structured data hoặc metadata. Chỉ xuất thông tin có thật.
- Tránh nhảy bố cục, tràn ngang và nội dung chỉ xuất hiện sau khi JavaScript chạy.

## 8. Dependencies, bảo mật và triển khai

- Dùng package manager và lockfile hiện có. Nếu khởi tạo mới mà chưa có quy ước, dùng npm và commit `package-lock.json`.
- Không tạo nhiều lockfile hoặc nâng cấp dependencies không liên quan đến nhiệm vụ.
- Trước khi thêm dependency, cân nhắc API native và chi phí bảo trì, dung lượng cùng khả năng chạy với static build.
- Không commit secret hoặc đưa token riêng vào code trình duyệt. Nếu cần biến môi trường, cung cấp `.env.example` với giá trị mẫu an toàn.
- Không render HTML tùy ý từ nguồn không tin cậy mà chưa có biện pháp xử lý phù hợp.
- Giữ tương thích với GitHub Pages: tính năng cần server phải có dịch vụ riêng và quyết định kiến trúc rõ ràng trước khi triển khai.
- Xác định `site`, `base` và đường dẫn tài nguyên từ URL triển khai thực tế; không tự mặc định có tiền tố tên repository.
- Không chỉnh file trong `dist/` hoặc commit output build, trừ khi workflow của repository yêu cầu rõ.

## 9. Kiểm tra và bàn giao

- Kiểm tra scripts trong `package.json`; chỉ chạy lệnh thực sự tồn tại hoặc công cụ đã được cài đặt.
- Với dự án Astro đã thiết lập, chạy kiểm tra kiểu/Astro và production build phù hợp với thay đổi. Khi tạo dự án, cung cấp script kiểm tra rõ ràng, ví dụ `check` và `build`.
- Chạy lint và format check nếu dự án có cấu hình tương ứng. Không áp đặt bộ công cụ mới cho một thay đổi nhỏ.
- Với thay đổi giao diện, kiểm tra trực quan ở kích thước mobile và desktop nếu có công cụ; kiểm tra tương tác và bàn phím ở phần bị ảnh hưởng.
- Viết test cho logic đáng kể hoặc hành vi dễ lỗi; không viết test chỉ để kiểm tra lại markup tĩnh hoặc tăng số lượng test.
- Kiểm tra link nội bộ, đường dẫn ảnh và lỗi console liên quan khi sửa route hoặc tương tác.
- Nếu không thể chạy kiểm tra, nói rõ lý do và phạm vi chưa xác minh; không báo kiểm tra thành công khi chưa chạy.
- Xem lại diff trước khi bàn giao, loại bỏ debug log, code chết và file tạm do mình tạo.
- Cập nhật README khi thay đổi cách cài đặt, chạy, quản lý nội dung hoặc triển khai.
