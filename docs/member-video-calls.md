# Gọi video giữa các thành viên

Đây là tính năng miễn phí và độc lập với Live Preview, địa điểm khám phá, Local Helper, job và ví thanh toán.

## Luồng sử dụng

1. Thành viên đăng nhập Vinago+.
2. Mở mục **Gọi video** từ Công cụ du lịch, thanh bên web hoặc trang Tài khoản.
3. Có thể tìm thành viên bằng email/tên, gửi lời mời và chấp nhận kết bạn.
4. Có thể bật vị trí để tìm thành viên trong bán kính 50 km và gửi lời kết nối; người khác chỉ thấy khoảng cách ước tính, không thấy tọa độ.
5. Trong danh sách bạn bè, bấm **Gọi** để vào phòng riêng của hai người.
6. Mỗi người bạn có nút **Chat**, **Gọi thoại** và **Gọi video**; tin nhắn 1-1 được lưu trên server.
7. Cuộc gọi thoại không bật camera; cuộc gọi video có đầy đủ điều khiển camera và micro.
8. Ngoài ra vẫn có thể tạo phòng và gửi mã mời 10 ký tự.

API `POST /api/member-calls/token` chỉ xác thực tài khoản và mã phòng. API này không tạo job, không kiểm tra địa điểm và không thực hiện giao dịch thanh toán.
