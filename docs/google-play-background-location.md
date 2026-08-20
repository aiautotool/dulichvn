# Khai báo quyền vị trí nền khi phát hành Vinago+ lên Google Play

Cập nhật: 19/07/2026

## Kết luận từ mã nguồn

Vinago+ thực sự cần quyền vị trí nền cho **một tính năng duy nhất: Chia sẻ GPS trực tiếp trong Live Team**.

- `ACCESS_COARSE_LOCATION` và `ACCESS_FINE_LOCATION`: lấy vị trí khi app đang mở cho địa điểm gần đây, bản đồ, chỉ đường, Local Helper và Live Team.
- `ACCESS_BACKGROUND_LOCATION`: tiếp tục cập nhật vị trí của người dùng cho thành viên cùng Live Team khi app xuống nền hoặc người dùng chuyển sang app khác.
- `FOREGROUND_SERVICE_LOCATION`: chạy dịch vụ vị trí có thông báo thường trực trên Android trong lúc Live Team đang chia sẻ GPS.
- Tác vụ nền được định nghĩa ở top-level bằng `TaskManager.defineTask` và gửi bản ghi vị trí mới nhất tới API Live Team.
- Người dùng chủ động bật công tắc **Chia sẻ GPS**. App hiển thị thông tin công bố nổi bật trước mọi lời nhắc quyền hệ thống. Người dùng có thể dừng bằng cách tắt công tắc hoặc rời đội.

Các tính năng vị trí thông thường ngoài Live Team chỉ dùng vị trí khi app đang mở. Không dùng vị trí nền cho quảng cáo.

## Nội dung điền vào Play Console

### 1. Chức năng của ứng dụng — Ứng dụng của bạn có mục đích chính là gì?

Sao chép nguyên văn:

> Vinago+ là ứng dụng đồng hành du lịch Việt Nam, giúp người dùng khám phá địa điểm, lập lộ trình và phối hợp chuyến đi theo nhóm. Tính năng Live Team cho phép các thành viên trong cùng một đội xem vị trí trực tiếp của nhau trên bản đồ, liên lạc bằng thoại và tiếp tục theo dõi lộ trình an toàn khi ứng dụng chuyển sang chế độ nền.

### 2. Quyền truy cập thông tin vị trí — mô tả một tính năng

Sao chép nguyên văn:

> Live Team chia sẻ vị trí trực tiếp của người dùng với các thành viên đã tham gia cùng đội. Khi người dùng chủ động bật “Chia sẻ GPS”, Vinago+ tiếp tục cập nhật vị trí trên bản đồ đội ngay cả khi app ở chế độ nền để cả nhóm không mất dấu nhau trong hành trình. Người dùng luôn thấy thông báo dịch vụ vị trí của Android và có thể dừng bằng cách tắt “Chia sẻ GPS” hoặc rời đội. Dữ liệu không được dùng cho quảng cáo.

Nội dung này mô tả đúng một tính năng và dưới giới hạn 500 ký tự.

### 3. Video hướng dẫn

Không thể điền URL giả. Sau khi quay và tải video lên YouTube ở chế độ **Không công khai (Unlisted)**, dán URL video vào trường này.

Kịch bản đề xuất 25–30 giây, quay trên thiết bị Android từ bản phát hành gửi xét duyệt:

1. Mở Vinago+, đăng nhập và vào **Live Team**.
2. Tạo hoặc tham gia một đội để màn hình có bản đồ và công tắc **Chia sẻ GPS**.
3. Bật **Chia sẻ GPS**.
4. Quay rõ toàn bộ hộp công bố nổi bật có tiêu đề **“Vinago+ sử dụng vị trí ở chế độ nền”** và nội dung giải thích việc thu thập/chia sẻ vị trí khi app đóng hoặc không được sử dụng.
5. Nhấn **Tiếp tục**, cấp quyền vị trí khi dùng app, rồi chọn quyền cho phép mọi lúc tại màn hình hệ thống Android nếu được yêu cầu.
6. Cho thấy vị trí người dùng trên bản đồ Live Team và thông báo thường trực **“Vinago+ Live Team đang hoạt động”**.
7. Bấm Home hoặc chuyển sang app khác, sau đó cho thấy vị trí vẫn cập nhật trên thiết bị của một thành viên khác hoặc quay lại Live Team để chứng minh tính năng nền đang hoạt động.

Video phải thấy được hộp công bố nổi bật, lời nhắc quyền hệ thống và tác dụng của tính năng khi app ở nền. Không dùng video iOS, không thêm nhạc hoặc phần giới thiệu dài.

### 4. Đoạn bổ sung vào mô tả ứng dụng trên Google Play

Đặt nội dung này ở phần dễ nhìn thấy trong mô tả đầy đủ, không chỉ trong chính sách quyền riêng tư:

> LIVE TEAM CHO CHUYẾN ĐI NHÓM: Chủ động chia sẻ vị trí trực tiếp với các thành viên cùng đội, xem mọi người trên bản đồ và phối hợp lộ trình ngay cả khi Vinago+ đang ở chế độ nền. Bạn toàn quyền bật hoặc tắt Chia sẻ GPS và có thể dừng bất cứ lúc nào bằng cách rời đội.

## Nội dung điền form Quyền cho dịch vụ trên nền trước

Màn hình **Xem lại bản phát hành > Quyền cho dịch vụ trên nền trước** đang yêu cầu khai báo cho:

```text
FOREGROUND_SERVICE_LOCATION
FOREGROUND_SERVICE_MEDIA_PLAYBACK
FOREGROUND_SERVICE_MICROPHONE
```

Nguyên tắc chung: chỉ chọn các tác vụ đúng với chức năng có thể nhìn thấy, do người dùng chủ động bắt đầu, có thông báo foreground service thường trực và có thể dừng trong app. Với Vinago+, gộp toàn bộ giải thích quanh **Live Team** để reviewer thấy đây là một luồng duy nhất: người dùng vào Live Team, bật chia sẻ GPS/thoại, app giữ vị trí và âm thanh hoạt động khi chuyển app hoặc tắt màn hình.

### 1. Vị trí — FOREGROUND_SERVICE_LOCATION

**Câu hỏi trên form**

> Những nhiệm vụ nào yêu cầu ứng dụng của bạn sử dụng quyền FOREGROUND_SERVICE_LOCATION?

**Nên chọn**

- [x] Hoạt động chia sẻ vị trí do người dùng thực hiện
- [ ] Chỉ đường
- [ ] Khoanh vùng địa lý
- [ ] Khác

Không chọn **Chỉ đường** trừ khi video xét duyệt chứng minh app đang chạy chế độ dẫn đường turn-by-turn ở nền. Không chọn **Khoanh vùng địa lý** vì mã hiện tại không dùng geofence.

**Nội dung mô tả để điền nếu form yêu cầu giải thích**

> Vinago+ dùng FOREGROUND_SERVICE_LOCATION cho tính năng Live Team. Khi người dùng chủ động tham gia một đội và bật “Chia sẻ GPS”, app chạy dịch vụ vị trí với thông báo thường trực để tiếp tục cập nhật vị trí của người dùng cho các thành viên cùng đội khi người dùng chuyển sang app khác hoặc tắt màn hình. Người dùng có thể dừng bất cứ lúc nào bằng cách tắt “Chia sẻ GPS” hoặc rời Live Team. Vị trí không dùng cho quảng cáo.

### 2. Phát nội dung nghe nhìn — FOREGROUND_SERVICE_MEDIA_PLAYBACK

**Câu hỏi trên form**

> Những nhiệm vụ nào yêu cầu ứng dụng của bạn sử dụng quyền FOREGROUND_SERVICE_MEDIA_PLAYBACK?

**Nên chọn**

- [x] Phát nội dung nghe nhìn
- [ ] Hiện chế độ hình trong hình
- [ ] Khác

Lý do chọn **Phát nội dung nghe nhìn**: Live Team phát âm thanh thoại của thành viên khác qua loa/tai nghe trong khi phiên Live Team đang hoạt động. Không chọn **Hiện chế độ hình trong hình** vì app không dùng Picture-in-Picture cho Live Team.

**Nội dung mô tả để điền nếu form yêu cầu giải thích**

> Vinago+ dùng FOREGROUND_SERVICE_MEDIA_PLAYBACK để duy trì phát âm thanh thoại nhóm trong Live Team. Khi người dùng đã tham gia Live Team, âm thanh từ các thành viên khác vẫn có thể phát qua loa hoặc tai nghe khi người dùng chuyển app hoặc màn hình tắt, tương tự một phiên liên lạc thoại đang diễn ra. Người dùng thấy trạng thái Live Team trong app, có thể bật/tắt loa và có thể kết thúc bằng cách rời đội.

**Lưu ý rủi ro**

Nếu Google Play phản hồi rằng đây không phải use case media playback hợp lệ, hướng ít rủi ro hơn là kiểm tra lại AAB/manifest và chỉ giữ `FOREGROUND_SERVICE_MEDIA_PLAYBACK` nếu thư viện native thật sự cần loại foreground service này. Với phiên thoại, reviewer thường quan tâm nhất tới `FOREGROUND_SERVICE_MICROPHONE`; không khai báo thừa nếu bản build không thực sự start foreground service loại `mediaPlayback`.

### 3. Micrô — FOREGROUND_SERVICE_MICROPHONE

**Câu hỏi trên form**

> Những nhiệm vụ nào yêu cầu ứng dụng của bạn sử dụng quyền FOREGROUND_SERVICE_MICROPHONE?

**Nên chọn**

- [x] Đầu vào âm thanh ở chế độ nền
- [ ] Khác

**Nội dung mô tả để điền nếu form yêu cầu giải thích**

> Vinago+ dùng FOREGROUND_SERVICE_MICROPHONE cho tính năng thoại nhóm trong Live Team. Khi người dùng chủ động tham gia Live Team và bật micro, app cần tiếp tục thu âm giọng nói để truyền cho các thành viên cùng đội trong lúc người dùng đang di chuyển, chuyển sang app khác hoặc tắt màn hình. Người dùng có nút tắt micro, bật/tắt loa và rời đội để dừng phiên thoại. App không thu âm bí mật và không dùng âm thanh cho quảng cáo.

### 4. Video minh họa cho form foreground service

Nếu Play Console yêu cầu video cho từng loại quyền, có thể dùng cùng một video Live Team miễn là video thể hiện đủ ba quyền:

1. Mở Vinago+, đăng nhập và vào **Live Team**.
2. Tạo hoặc tham gia một đội.
3. Bật **Chia sẻ GPS** và quay rõ hộp công bố nổi bật trước khi xin quyền vị trí.
4. Cho thấy bản đồ Live Team cập nhật vị trí và thông báo thường trực **“Vinago+ Live Team đang hoạt động”**.
5. Bật micro hoặc vào phiên thoại Live Team, nói thử một câu ngắn để thiết bị khác nghe được.
6. Cho thấy nút tắt micro, nút loa và nút rời đội.
7. Bấm Home/chuyển app, rồi cho thấy vị trí/âm thanh Live Team vẫn tiếp tục hoạt động trong khi thông báo foreground service còn hiển thị.
8. Quay lại app, tắt **Chia sẻ GPS** hoặc rời đội để chứng minh người dùng kiểm soát được việc dừng.

### 5. Checklist trả lời nhanh theo screenshot

- `FOREGROUND_SERVICE_LOCATION`: chọn **Hoạt động chia sẻ vị trí do người dùng thực hiện**.
- `FOREGROUND_SERVICE_MEDIA_PLAYBACK`: chọn **Phát nội dung nghe nhìn** nếu AAB vẫn khai báo quyền này.
- `FOREGROUND_SERVICE_MICROPHONE`: chọn **Đầu vào âm thanh ở chế độ nền**.
- Không chọn **Khoanh vùng địa lý**, **Hiện chế độ hình trong hình** hoặc **Khác** nếu không có trường bắt buộc phải giải thích thêm.

## Thông tin công bố nổi bật đã áp dụng trong app

Hộp thoại xuất hiện khi người dùng bật **Chia sẻ GPS**, trước khi app gọi API yêu cầu quyền hệ thống:

**Tiêu đề**

> Vinago+ sử dụng vị trí ở chế độ nền

**Nội dung**

> Vinago+ thu thập dữ liệu vị trí để chia sẻ vị trí trực tiếp với các thành viên trong Live Team ngay cả khi bạn đóng hoặc không sử dụng ứng dụng. Dữ liệu chỉ được chia sẻ với thành viên trong đội bạn tham gia, không dùng cho quảng cáo. Bạn có thể dừng bất cứ lúc nào bằng cách tắt “Chia sẻ GPS” hoặc rời đội.

**Nút**

- `Không phải bây giờ`: không yêu cầu quyền và không bật chia sẻ.
- `Tiếp tục`: sau đó mới hiển thị lời nhắc quyền vị trí của Android.

## Cấu hình quyền đã áp dụng

Trong `app.json`, plugin `expo-location` đang bật:

```json
{
  "isAndroidBackgroundLocationEnabled": true,
  "isAndroidForegroundServiceEnabled": true
}
```

Các quyền Android tương ứng có trong cấu hình:

```text
android.permission.ACCESS_COARSE_LOCATION
android.permission.ACCESS_FINE_LOCATION
android.permission.ACCESS_BACKGROUND_LOCATION
android.permission.FOREGROUND_SERVICE_LOCATION
android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK
android.permission.FOREGROUND_SERVICE_MICROPHONE
```

Thay đổi cấu hình native chỉ có hiệu lực sau khi tạo bản build Android mới. Không gửi lại AAB cũ vì manifest của AAB cũ và giao diện công bố cũ sẽ không thay đổi.

## Checklist trước khi gửi xét duyệt

- [ ] Tăng `android.versionCode` và tạo AAB production mới.
- [ ] Cài chính AAB/bản internal testing lên thiết bị Android thật để kiểm tra.
- [ ] Gỡ app hoặc xoá dữ liệu app trước khi quay để lời nhắc quyền xuất hiện từ đầu.
- [ ] Xác nhận hộp công bố nổi bật xuất hiện **trước** lời nhắc quyền vị trí.
- [ ] Xác nhận từ chối quyền không làm app lỗi và các tính năng không cần vị trí vẫn dùng được.
- [ ] Xác nhận bật chia sẻ tạo thông báo dịch vụ vị trí thường trực.
- [ ] Xác nhận tắt **Chia sẻ GPS** và **Rời đội** đều dừng cập nhật vị trí nền.
- [ ] Đưa Live Team và khả năng chia sẻ vị trí nền vào mô tả nổi bật trên trang Google Play.
- [ ] Cập nhật mục **An toàn dữ liệu**: khai báo việc thu thập vị trí chính xác cho mục đích chức năng ứng dụng. Đối chiếu định nghĩa hiện hành của biểu mẫu khi trả lời mục “chia sẻ”, vì vị trí được truyền qua máy chủ và hiển thị cho thành viên cùng đội theo hành động chủ động của người dùng.
- [ ] Dùng URL chính sách quyền riêng tư đang hoạt động: `https://vinago.aiautotool.com/privacy-policy`.
- [ ] Triển khai lại backend/trang web để nội dung chính sách quyền riêng tư mới được công khai trước khi gửi xét duyệt.
- [ ] Tải video lên YouTube ở chế độ Unlisted và kiểm tra URL khi không đăng nhập.
- [ ] Chỉ khai báo **Live Team – chia sẻ GPS trực tiếp** trong biểu mẫu, không liệt kê nhiều tính năng.

## Lưu ý quan trọng về khả năng được duyệt

Google Play chỉ chấp nhận vị trí nền khi tính năng đó mang lại lợi ích đáng kể và thuộc chức năng cốt lõi được quảng bá nổi bật của ứng dụng. Vì vậy, nội dung trang cửa hàng phải giới thiệu rõ Live Team như một phần chính của trải nghiệm phối hợp và an toàn khi du lịch nhóm. Việc có đủ hộp công bố, video và biểu mẫu không tự động bảo đảm được duyệt nếu reviewer đánh giá Live Team chỉ là tính năng phụ.

Nếu không muốn quảng bá Live Team như chức năng cốt lõi, phương án ít rủi ro hơn là bỏ `ACCESS_BACKGROUND_LOCATION` và chỉ chia sẻ vị trí khi app đang mở; khi đó không nộp biểu mẫu quyền vị trí nền.

## Tài liệu đối chiếu

- Expo SDK 56 — Location: https://docs.expo.dev/versions/v56.0.0/sdk/location/
- Expo SDK 56 — TaskManager: https://docs.expo.dev/versions/v56.0.0/sdk/task-manager/
- Google Play — Quyền truy cập thông tin vị trí ở chế độ nền: https://support.google.com/googleplay/android-developer/answer/9799150?hl=vi
- Google Play — Foreground service requirements: https://support.google.com/googleplay/android-developer/answer/13392821
- Android Developers — Foreground service types: https://developer.android.com/develop/background-work/services/fgs/service-types
