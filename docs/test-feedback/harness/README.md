# Chạy lại kiểm thử cô lập

Chạy các lệnh tại `D:\DEV\LMS_PHYSICS`. Các harness chỉ kết nối backend test `127.0.0.1:18080`; không dùng backend ở cổng 8080. Backend nằm trong bản sao `.tmp-comprehensive-test/backend`, H2 chạy trong RAM, MinIO tắt. Dữ liệu và tệp upload chỉ là dữ liệu thử.

## Chuẩn bị và chạy test

```powershell
New-Item -ItemType Directory -Path '.tmp-comprehensive-test/backend' -Force
Copy-Item -LiteralPath 'D:\DEV\vat_li_be\hethongvatli1\pom.xml' -Destination '.tmp-comprehensive-test/backend'
# Lệnh sao chép src dưới đây dành cho thư mục backend test mới.
Copy-Item -LiteralPath 'D:\DEV\vat_li_be\hethongvatli1\src' -Destination '.tmp-comprehensive-test/backend' -Recurse
node --test scripts/*.test.mjs
npm run scan:html
npm run build
Push-Location '.tmp-comprehensive-test/backend'
mvn test '-Dspring.profiles.active=test'
Pop-Location
```

Bộ test gốc hiện có hai test Excel phụ thuộc `D:\vatli1`; giữ kết quả thất bại để phản ánh đúng tình trạng bộ test. Không tạo/ghi file ở đường dẫn đó.

## Khởi động môi trường

Terminal thứ nhất:

```powershell
& './docs/test-feedback/harness/start-backend.ps1'
```

Terminal thứ hai:

```powershell
$env:VITE_API_PROXY_TARGET='http://127.0.0.1:18080'
npm run dev -- --port 5188 --host 127.0.0.1 --strictPort
```

Terminal thứ ba, tạo fixture và kiểm tra API thật:

```powershell
node docs/test-feedback/harness/backend-probes.mjs
```

Mỗi lần khởi động lại backend sẽ mất dữ liệu H2. Chạy lại `backend-probes.mjs` để tạo lại `.tmp-comprehensive-test/fixture.json`. Probe tạo thí nghiệm, giao bài, nộp/chấm/chốt dữ liệu thử và kiểm tra các tình huống bị từ chối. Kết quả nằm trong `.tmp-comprehensive-test/backend-probes-results.json`; kiểm tra trường `passed`, không chỉ exit code.

## Kiểm tra giao diện với API thật

Khởi động Chrome với hồ sơ riêng, ẩn cửa sổ:

```powershell
Start-Process -FilePath 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9340','--user-data-dir=D:\DEV\LMS_PHYSICS\.tmp-comprehensive-test\chrome-replay','about:blank' -WindowStyle Hidden
node docs/test-feedback/harness/live-ui.mjs
```

Harness tự đóng trình duyệt sau khi hoàn tất. Khởi động lại Chrome với profile khác trước khi chạy vòng đời thí nghiệm:

```powershell
Start-Process -FilePath 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9340','--user-data-dir=D:\DEV\LMS_PHYSICS\.tmp-comprehensive-test\chrome-replay-lifecycle','about:blank' -WindowStyle Hidden
node docs/test-feedback/harness/lab-lifecycle-ui.mjs
```

Vòng đời này tạo/giao/nộp/chấm/chốt bằng UI. Dùng liên kết báo cáo có đủ `assignmentId` để kiểm tra phần còn lại của luồng; lỗi thiếu ID khi đi qua mô phỏng được kiểm tra riêng trong `live-ui.mjs`. Tệp minh chứng là `File` giả tạo trong RAM, không xác minh tính hợp lệ của nội dung PDF.

Các bộ UI hiện có trong `scripts/check-*.mjs` dùng Chrome cổng 9339 và frontend cổng 5188, phần lớn mock API. `check-dashboard.mjs` cần đặt `DASHBOARD_DEBUG=http://127.0.0.1:9339`; test này không mock dữ liệu lịch và đang đòi đúng 5 sự kiện. Cần cập nhật fixture trước khi dùng nó làm điều kiện nghiệm thu.

Dừng hai server bằng Ctrl+C sau khi kiểm tra. Không dùng bộ probe này với cơ sở dữ liệu thật. Không đưa log Maven/Surefire đầy đủ vào kho mã: log có thể chứa JWT và thông tin đăng nhập thử. Các file JSON ở thư mục báo cáo đã chỉ giữ kết quả kiểm thử, không chứa token.
