const SHEET_NAME = "Báo Cáo Công Việc";
const SCRIPT_PROP = PropertiesService.getScriptProperties();

/**
 * Handles HTTP POST requests to the web app.
 * This is the main function that receives data from the HTML form.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait up to 10 seconds for the lock

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = doc.getSheetByName(SHEET_NAME);

    // Create the sheet if it doesn't exist
    if (!sheet) {
      sheet = doc.insertSheet(SHEET_NAME);
      // Define the header row
      const headers = [
        "Timestamp", "Tên Nhân Viên", "Ngày Làm Việc", "Thời Gian Gửi",
        "Trạng Thái Task", "Hạng Mục Công Việc", "Mô Tả Chi Tiết", "Số Lượng",
        "Thành Viên Cùng Thực Hiện", "Quy Mô Thiết Kế", "Số Giờ Tăng Ca"
      ];
      sheet.appendRow(headers);
      // Formatting the header
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#d9ead3");
      sheet.setFrozenRows(1);
    }

    // Parse the JSON data sent from the form
    const data = JSON.parse(e.postData.contents);

    const timestamp = new Date();
    
    // Loop through each task and add it as a new row
    data.danh_sach_cong_viec.forEach(task => {
      const row = [
        timestamp,
        data.ho_va_ten,
        data.ngay_lam_viec,
        data.thoi_gian_gui,
        task.trang_thai,
        task.hang_muc_cong_viec,
        task.chi_tiet,
        task.so_luong,
        task.cung_thuc_hien.join(", "),
        task.quy_mo_thiet_ke,
        task.so_gio_tang_ca
      ];
      sheet.appendRow(row);
    });
    
    // Return a success response
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "data": JSON.stringify(data) }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return an error response
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
} 