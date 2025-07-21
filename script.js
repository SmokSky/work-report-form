/* script.js */
document.addEventListener('DOMContentLoaded', function() {
  // === Lấy các phần tử cần thiết từ DOM ===
  const form = document.getElementById('kpi-form');
  const tasksContainer = document.getElementById('tasks-container');
  const addTaskBtn = document.getElementById('add-task-btn');
  const workDateInput = document.getElementById('work-date');
  const outputContainer = document.getElementById('output-container');
  const outputEl = document.getElementById('output');
  const statusMessage = document.getElementById('status-message');
  let taskCounter = 1;

  // === Thiết lập ban đầu ===
  function setDefaultDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      workDateInput.value = `${year}-${month}-${day}`;
      workDateInput.readOnly = true; // Không cho phép chỉnh sửa
  }
  setDefaultDate();
  updateRemoveButtons();

  // === Hàm để cập nhật các sự kiện cho một khối công việc ===
  function setupTaskEventListeners(taskElement) {
      const categoryRadios = taskElement.querySelectorAll('input[name^="task_category"]');
      const designOptions = taskElement.querySelector('.design-options');
      const overtimeOptions = taskElement.querySelector('.overtime-options');

      categoryRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const selectedValue = taskElement.querySelector('input[name^="task_category"]:checked').value;
            
            if (designOptions) {
                designOptions.style.display = selectedValue === 'Thiết kế' ? 'block' : 'none';
            }
            if (overtimeOptions) {
                overtimeOptions.style.display = selectedValue === 'Tăng ca' ? 'block' : 'none';
            }
        });
      });
  }

  // Thiết lập sự kiện cho khối công việc đầu tiên
  setupTaskEventListeners(document.querySelector('.task-entry'));

  // === Hàm cập nhật trạng thái của nút xóa ===
  function updateRemoveButtons() {
      const taskEntries = tasksContainer.querySelectorAll('.task-entry');
      taskEntries.forEach((task, index) => {
          const removeBtn = task.querySelector('.remove-task-btn');
          // Chỉ hiển thị nút xóa nếu có nhiều hơn 1 công việc
          removeBtn.style.display = taskEntries.length > 1 ? 'block' : 'none';
      });
  }

  // === Sự kiện khi nhấn nút "Thêm công việc" ===
  addTaskBtn.addEventListener('click', function() {
      taskCounter++;
      const firstTask = tasksContainer.querySelector('.task-entry');
      const newTask = firstTask.cloneNode(true); // Nhân bản khối công việc

      // Xóa dữ liệu cũ và cập nhật ID/name/for để tránh trùng lặp
      newTask.querySelectorAll('input, textarea').forEach(input => {
          if (input.type === 'checkbox' || input.type === 'radio') {
              input.checked = false;
          } else {
              input.value = '';
          }
          // Cập nhật các thuộc tính để đảm bảo label hoạt động đúng
          const oldId = input.id;
          if (oldId) {
              const newId = oldId.replace(/-\d+$/, '') + '-' + taskCounter;
              input.id = newId;
              const label = newTask.querySelector(`label[for="${oldId}"]`);
              if (label) {
                  label.htmlFor = newId;
              }
          }
          if (input.name) {
              input.name = input.name.replace(/_\d+$/, '') + '_' + taskCounter;
          }
      });
      // Đặt lại trạng thái mặc định cho task mới
      const defaultStatus = newTask.querySelector('input[value="Hoàn thành"]');
      if (defaultStatus) {
        defaultStatus.checked = true;
      }

      // Ẩn các mục phụ thuộc
      newTask.querySelectorAll('.conditional-group').forEach(group => group.style.display = 'none');
      
      tasksContainer.appendChild(newTask);
      setupTaskEventListeners(newTask); // Gán lại sự kiện cho khối mới
      updateRemoveButtons(); // Cập nhật lại các nút xóa
  });

  // === Sự kiện để xóa một khối công việc (sử dụng event delegation) ===
  tasksContainer.addEventListener('click', function(event) {
      if (event.target.classList.contains('remove-task-btn')) {
          event.target.closest('.task-entry').remove();
          updateRemoveButtons();
      }
  });

  // === Xử lý sự kiện khi gửi form ===
  form.addEventListener('submit', function(event) {
      event.preventDefault();

      // --- 1. Thu thập dữ liệu từ form ---
      const allTasksData = [];
      const taskEntries = document.querySelectorAll('.task-entry');

      taskEntries.forEach(task => {
          const selectedCategory = task.querySelector('input[name^="task_category"]:checked')?.value || 'Chưa chọn';

          const taskData = {
              trang_thai: task.querySelector('input[name^="task_status"]:checked')?.value || 'Hoàn thành',
              hang_muc_cong_viec: selectedCategory,
              quy_mo_thiet_ke: selectedCategory === 'Thiết kế' ? (task.querySelector('input[name^="design_size"]:checked')?.value || 'Chưa chọn') : 'Không áp dụng',
              so_gio_tang_ca: selectedCategory === 'Tăng ca' ? (task.querySelector('input[type="number"][id^="overtime-hours"]').value || '0') : '0',
              chi_tiet: task.querySelector('textarea').value,
              so_luong: task.querySelector('input[id^="quantity"]').value,
              cung_thuc_hien: task.querySelector('input[id^="collaborators"]').value.split(',').map(name => name.trim()).filter(name => name),
          };
          allTasksData.push(taskData);
      });

      const finalData = {
          ho_va_ten: document.getElementById('employee-name').value,
          ngay_lam_viec: workDateInput.value,
          danh_sach_cong_viec: allTasksData,
          thoi_gian_gui: new Date().toLocaleString('vi-VN')
      };

      // --- 2. Gửi dữ liệu tới Google Sheets ---
      // !!! QUAN TRỌNG: Thay thế URL bên dưới bằng Web App URL của bạn !!!
      const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbzFsNmfQ3CFtTA9_MOhb5Es5t2siNLVy-Qn3TI3TjvqkRN-HrLOnKeencwfwi58TGY/exec';
      const submitButton = form.querySelector('button[type="submit"]');

      // Hiển thị trạng thái đang gửi
      statusMessage.textContent = 'Đang gửi dữ liệu, vui lòng chờ...';
      statusMessage.className = 'sending';
      statusMessage.style.display = 'block';
      submitButton.disabled = true;

      // Gửi dữ liệu bằng Fetch API
      fetch(googleScriptUrl, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        cache: 'no-cache',
        headers: {
            // Apps Script yêu cầu Content-Type là text/plain cho e.postData.contents
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(finalData)
      })
      .then(response => response.json())
      .then(data => {
          if (data.result === 'success') {
              statusMessage.textContent = '✅ Gửi báo cáo thành công!';
              statusMessage.className = 'success';
              // Hiển thị dữ liệu JSON đã gửi để kiểm tra, nếu có
              if (outputEl && outputContainer) {
                outputEl.textContent = JSON.stringify(finalData, null, 2);
                outputContainer.style.display = 'block';
                outputContainer.scrollIntoView({ behavior: 'smooth' });
              }
          } else {
              // Ném lỗi nếu Google Script trả về lỗi
              throw new Error(data.error || 'Lỗi không xác định từ Google Script.');
          }
      })
      .catch(error => {
          statusMessage.textContent = `❌ Đã có lỗi xảy ra khi gửi: ${error.message}`;
          statusMessage.className = 'error';
          console.error('Fetch Error:', error);
          // Hiển thị JSON để người dùng không mất dữ liệu, nếu có
          if (outputEl && outputContainer) {
            outputEl.textContent = `// LỖI: Dữ liệu chưa được gửi đi. Vui lòng sao chép lại.\n\n${JSON.stringify(finalData, null, 2)}`;
            outputContainer.style.display = 'block';
            outputContainer.scrollIntoView({ behavior: 'smooth' });
          }
      })
      .finally(() => {
          // Bật lại nút gửi dù thành công hay thất bại
          submitButton.disabled = false;
      });
  });
});