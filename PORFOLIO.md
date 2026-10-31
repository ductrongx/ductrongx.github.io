# Định hướng layout portfolio

## 1. Layout đã chọn

Portfolio tối giản, các phần xếp dọc và lấy dự án làm trọng tâm. Trang chủ giới thiệu tổng quan; Work, Experience và Blog có thể dẫn đến trang riêng để đọc chi tiết.

Các mục chính:

- **Logo / tên:** liên kết về Home.
- **Work:** các dự án đã làm.
- **Experience:** kinh nghiệm làm việc.
- **Blog:** bài viết, trình bày dạng danh sách item.
- **Contact:** thông tin liên hệ.

## 2. Khung trang chủ

```text
┌──────────────────────────────────────────────────┐
│ Tên bạn       Work · Experience · Blog · Contact   │
├──────────────────────────────────────────────────┤
│ Giới thiệu                                       │
│ Một câu nói rõ bạn là ai và làm gì                │
│ Mô tả ngắn + liên kết xem dự án                   │
├──────────────────────────────────────────────────┤
│ Dự án nổi bật                       Xem tất cả ↗  │
│ ┌────────────────────┐  ┌────────────────────┐   │
│ │ Ảnh dự án          │  │ Ảnh dự án          │   │
│ └────────────────────┘  └────────────────────┘   │
│ Tên + mô tả ngắn        Tên + mô tả ngắn         │
├──────────────────────────────────────────────────┤
│ Kinh nghiệm                                      │
│ Thời gian           Công ty · Vai trò            │
│                     Mô tả công việc              │
├──────────────────────────────────────────────────┤
│ Bài viết                            Xem tất cả ↗  │
│ Tiêu đề bài viết                              ↗  │
│ Mô tả ngắn · Chủ đề · Ngày đăng                   │
│ ──────────────────────────────────────────────── │
│ Tiêu đề bài viết                              ↗  │
│ Mô tả ngắn · Chủ đề · Ngày đăng                   │
├──────────────────────────────────────────────────┤
│ Lời mời kết nối                                  │
│ Email và các liên kết cá nhân                    │
└──────────────────────────────────────────────────┘
```

Nội dung trong wireframe là minh họa cấu trúc, chưa phải thông tin cá nhân để xuất bản.

## 3. Hướng thiết kế từng phần

### Header

- Dùng tên làm logo chữ, đặt bên trái và liên kết về Home.
- Menu bên phải gồm Work, Experience, Blog và Contact.
- Menu đơn giản, có trạng thái hover, focus và nhận diện mục đang xem.
- Trên mobile, tên ở bên trái và nút mở menu ở bên phải.

### Giới thiệu

Ưu tiên typography: chữ lớn, nội dung ngắn và nhiều khoảng trắng.

Thành phần:

- Lời giới thiệu có tên.
- Một câu mô tả vai trò hoặc hướng quan tâm.
- Một đoạn bổ sung ngắn nếu cần.
- Liên kết “Xem dự án” dẫn đến phần Work.

Có thể thêm ảnh chân dung hoặc hình đại diện bên phải khi có tài nguyên phù hợp. Hướng đề xuất ban đầu là chỉ dùng chữ.

### Work — grid dự án

- Desktop hiển thị hai cột; mobile hiển thị một cột.
- Mỗi item có ảnh, tên dự án, mô tả một câu, vai trò và năm.
- Ảnh dùng cùng tỉ lệ; tên và mô tả nằm dưới ảnh.
- Tên hoặc ảnh dẫn đến nội dung chi tiết của dự án khi có.
- Có liên kết “Xem tất cả” đến danh sách dự án đầy đủ.
- Tùy chọn: một dự án tiêu biểu chiếm toàn bộ hàng đầu.

### Experience — danh sách theo thời gian

- Hiển thị kinh nghiệm gần nhất trước.
- Mỗi hàng gồm thời gian, công ty, vai trò và mô tả ngắn về phạm vi công việc.
- Desktop đặt thời gian ở cột trái, nội dung ở cột phải.
- Mobile xếp thời gian phía trên nội dung.
- Dùng đường phân cách mảnh giữa các hàng.
- Trang chủ chỉ hiển thị một số vị trí gần nhất; trang Experience riêng có thể bổ sung trách nhiệm và kết quả thực tế.

### Blog — list item

```text
Bài viết                                      Xem tất cả ↗

Tiêu đề bài viết có thể dài đến hai dòng                 ↗
Một câu mô tả ngắn về nội dung bài.
Chủ đề · Ngày đăng
─────────────────────────────────────────────────────────
Tiêu đề bài viết tiếp theo                              ↗
Một câu mô tả ngắn về nội dung bài.
Chủ đề · Ngày đăng
```

- Mỗi bài là một item trong danh sách, ngăn cách bằng đường kẻ mảnh.
- Tiêu đề là liên kết đến bài viết.
- Ưu tiên chữ; không cần thumbnail.
- Trang chủ hiển thị khoảng ba bài gần nhất.
- Trang Blog dùng cùng kiểu danh sách; chỉ thêm bộ lọc chủ đề khi có đủ nhiều bài.

### Contact — khối kết trang

- Một tiêu đề hoặc lời mời kết nối ngắn.
- Một câu mô tả phù hợp với giọng cá nhân.
- Email và các liên kết thực sự có, chẳng hạn GitHub hoặc LinkedIn.
- Trước mắt dùng liên kết trực tiếp; chưa cần form liên hệ.

## 4. Hướng thị giác đề xuất

Các lựa chọn dưới đây là hướng đề xuất, chưa phải bộ thông số thiết kế đã chốt:

- Nền sáng hơi ấm, chữ đậm và một màu nhấn.
- Typography rõ ràng, hỗ trợ đầy đủ tiếng Việt.
- Khoảng trắng rộng và đường phân cách mảnh.
- Dự án tạo điểm nhấn bằng ảnh; kinh nghiệm và blog ưu tiên khả năng đọc.
- Nhịp trang: giới thiệu bằng chữ → dự án bằng ảnh → kinh nghiệm dạng hàng → blog dạng list → liên hệ bằng chữ lớn.

## 5. Responsive và tương tác

- Mobile chuyển nội dung về một cột.
- Giữ thứ tự: giới thiệu → dự án → kinh nghiệm → blog → liên hệ.
- Tiêu đề dài được xuống dòng tự nhiên, không bị cắt mất nội dung.
- Menu, liên kết và nút phải thao tác được bằng bàn phím, có focus rõ ràng.
- Bảo đảm tương phản chữ, vùng bấm đủ rộng và không tràn ngang.

## 6. Nội dung và quyết định cần bổ sung

- Tên hiển thị, câu giới thiệu và ngôn ngữ nội dung website.
- Danh sách dự án, ảnh minh họa và thông tin vai trò thực tế.
- Kinh nghiệm làm việc và các bài blog thực tế.
- Email và liên kết cá nhân.
- Màu nhấn, font chữ và lựa chọn có dùng ảnh chân dung hay không.
- Chi tiết điều hướng giữa phần trên Home và các trang riêng.

Không tự tạo kinh nghiệm, thành tích, số liệu hoặc liên kết cá nhân. Tài liệu này ghi lại định hướng layout; chưa bao gồm triển khai giao diện.
