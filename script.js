/* script.js */

// === Google Sign-In Logic ===
let googleIdToken = null; // Variable to store the complete JWT token

/**
 * Handles the response from Google Sign-In.
 * @param {object} response - The credential response object from Google.
 */
function handleCredentialResponse(response) {
    // response.credential contains the full 3-part JWT token. We store it directly.
    googleIdToken = response.credential;
    const responsePayload = parseJwt(response.credential);
    const modalContainer = document.getElementById('modal-container');
    const statusMessage = document.getElementById('status-message');

    if (responsePayload) {
        // Hide the sign-in button and show user info
        document.getElementById('gsi-container').style.display = 'none';
        const userInfo = document.getElementById('user-info');
        userInfo.style.display = 'block';

        // Display user's name
        document.getElementById('employee-name-display').textContent = responsePayload.name;
        // Store the name in the hidden input for form submission
        document.getElementById('employee-name').value = responsePayload.name;
    } else {
        // Handle cases where the token is invalid on the client side
        statusMessage.textContent = 'Lỗi: Không thể giải mã thông tin người dùng từ Google. Vui lòng thử lại.';
        statusMessage.className = 'error';
        modalContainer.style.display = 'flex'; // Show modal
    }
}

/**
 * Decodes a JWT token for client-side display. Does not modify the token.
 * @param {string} token - The JWT token string.
 * @returns {object|null} The decoded payload of the JWT, or null if invalid.
 */
function parseJwt(token) {
    if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        console.error("Invalid JWT token provided for parsing:", token);
        return null;
    }
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding JWT", e);
        return null;
    }
}

/**
 * Handles user sign-out.
 */
function handleSignOut() {
    googleIdToken = null; // Clear the token on sign out
    document.getElementById('gsi-container').style.display = 'block';
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('employee-name-display').textContent = '';
    document.getElementById('employee-name').value = '';
}


document.addEventListener('DOMContentLoaded', function() {
    // === Lấy các phần tử cần thiết từ DOM ===
    const form = document.getElementById('kpi-form');
    const tasksContainer = document.getElementById('tasks-container');
    const addTaskBtn = document.getElementById('add-task-btn');
    const workDateInput = document.getElementById('work-date');
    const modalContainer = document.getElementById('modal-container');
    const statusMessage = document.getElementById('status-message');
    const signOutBtn = document.getElementById('sign-out-btn');
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
  
    if(signOutBtn) {
        signOutBtn.addEventListener('click', handleSignOut);
    }

    // --- New: Close modal when clicking on the backdrop ---
    if (modalContainer) {
        modalContainer.addEventListener('click', function(event) {
            if (event.target === modalContainer) {
                modalContainer.style.display = 'none';
            }
        });
    }

    // === Hàm để cập nhật các sự kiện cho một khối công việc ===
    function setupTaskEventListeners(taskElement) {
        const categoryRadios = taskElement.querySelectorAll('input[name^="task_category"]');
        const designOptions = taskElement.querySelector('.design-options');
        const overtimeOptions = taskElement.querySelector('.overtime-options');
        const otherTaskOptions = taskElement.querySelector('.other-task-options');

        categoryRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const selectedValue = taskElement.querySelector('input[name^="task_category"]:checked').value;
                
                if (designOptions) {
                    designOptions.style.display = selectedValue === 'Thiết kế' ? 'block' : 'none';
                }
                if (overtimeOptions) {
                    overtimeOptions.style.display = selectedValue === 'Tăng ca' ? 'block' : 'none';
                }
                if (otherTaskOptions) {
                    otherTaskOptions.style.display = selectedValue === 'Các công việc khác' ? 'block' : 'none';
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

        // --- 0. Xóa thông báo cũ và bắt đầu xác thực ---
        statusMessage.textContent = '';
        modalContainer.style.display = 'none'; // Hide modal initially
        let isValid = true;
        let validationError = null;

        // --- NEW, ROBUST CLIENT-SIDE CHECK ---
        if (!googleIdToken || googleIdToken.split('.').length !== 3) {
            isValid = false;
            validationError = { 
                task: document.getElementById('gsi-container'), 
                message: `Lỗi xác thực. Vui lòng đăng xuất và đăng nhập lại bằng Google.` 
            };
        }

        const taskEntries = document.querySelectorAll('.task-entry');

        if (isValid) {
            for (let i = 0; i < taskEntries.length; i++) {
                const task = taskEntries[i];
                const taskNumber = i + 1;

                const category = task.querySelector('input[name^="task_category"]:checked');
                if (!category) {
                    isValid = false;
                    validationError = { task, message: `Vui lòng chọn "Hạng mục công việc" cho công việc số ${taskNumber}.` };
                    break;
                }

                const categoryValue = category.value;

                if (categoryValue === 'Thiết kế') {
                    const designSize = task.querySelector('input[name^="design_size"]:checked');
                    if (!designSize) {
                        isValid = false;
                        validationError = { task, message: `Vui lòng chọn "Quy mô thiết kế" cho công việc số ${taskNumber}.` };
                        break;
                    }
                } else if (categoryValue === 'Tăng ca') {
                    const overtimeHours = task.querySelector('input[id^="overtime-hours"]');
                    if (!overtimeHours.value || parseFloat(overtimeHours.value) <= 0) {
                        isValid = false;
                        validationError = { task, message: `Vui lòng nhập "Số giờ tăng ca" hợp lệ (lớn hơn 0) cho công việc số ${taskNumber}.` };
                        break;
                    }
                } else if (categoryValue === 'Các công việc khác') {
                    const otherTaskName = task.querySelector('input[id^="other-task-name"]');
                    if (!otherTaskName.value.trim()) {
                        isValid = false;
                        validationError = { task, message: `Vui lòng nhập tên công việc cho mục "Các công việc khác" ở công việc số ${taskNumber}.` };
                        break;
                    }
                } else if (categoryValue === 'Viết bài Website' || categoryValue === 'Làm Video ngắn') {
                    const quantity = task.querySelector('input[id^="quantity"]');
                    if (!quantity.value || parseInt(quantity.value, 10) < 1) {
                        isValid = false;
                        validationError = { task, message: `Vui lòng nhập "Số lượng" ít nhất là 1 cho công việc số ${taskNumber}.` };
                        break;
                    }
                }
            }
        }

        if (!isValid) {
            statusMessage.textContent = validationError.message;
            statusMessage.className = 'error';
            modalContainer.style.display = 'flex'; // Show modal
            validationError.task.scrollIntoView({ behavior: 'smooth', block: 'center' });
            validationError.task.style.border = '2px solid #dc3545';
            setTimeout(() => {
                validationError.task.style.border = '1px solid #e9ecef';
            }, 3000);
            return;
        }

        // --- 1. Thu thập dữ liệu từ form ---
        const allTasksData = [];
        taskEntries.forEach(task => {
            const selectedCategory = task.querySelector('input[name^="task_category"]:checked')?.value || 'Chưa chọn';
            const taskData = {
                trang_thai: task.querySelector('input[name^="task_status"]:checked')?.value || 'Hoàn thành',
                hang_muc_cong_viec: selectedCategory === 'Các công việc khác' 
                    ? (task.querySelector('input[name^="other_task_name"]').value || 'Công việc khác không tên')
                    : selectedCategory,
                quy_mo_thiet_ke: selectedCategory === 'Thiết kế' ? (task.querySelector('input[name^="design_size"]:checked')?.value || 'Chưa chọn') : 'Không áp dụng',
                so_gio_tang_ca: selectedCategory === 'Tăng ca' ? (task.querySelector('input[type="number"][id^="overtime-hours"]').value || '0') : '0',
                chi_tiet: task.querySelector('textarea').value,
                so_luong: task.querySelector('input[id^="quantity"]').value,
                cung_thuc_hien: task.querySelector('input[id^="collaborators"]').value.split(',').map(name => name.trim()).filter(name => name),
                nguoi_yeu_cau: task.querySelector('input[id^="requester"]').value,
            };
            allTasksData.push(taskData);
        });

        const finalData = {
            id_token: googleIdToken,
            ho_va_ten: document.getElementById('employee-name').value,
            ngay_lam_viec: workDateInput.value,
            danh_sach_cong_viec: allTasksData,
            thoi_gian_gui: new Date().toLocaleString('vi-VN')
        };

        // --- 2. Gửi dữ liệu tới Google Sheets ---
        const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxLD5vIg_EVaVG2GjMQ0RmwDagLdT6maL3ai6OYuN6XsQWhq4YjMvXpPSb3NIzidNo/exec';
        const submitButton = form.querySelector('button[type="submit"]');

        statusMessage.textContent = 'Đang gửi dữ liệu, vui lòng chờ...';
        statusMessage.className = 'sending';
        modalContainer.style.display = 'flex'; // Show modal
        submitButton.disabled = true;

        fetch(googleScriptUrl, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(finalData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'success') {
                statusMessage.textContent = '✅ Gửi báo cáo thành công!';
                statusMessage.className = 'success';
            } else {
                throw new Error(data.error || 'Lỗi không xác định từ Google Script.');
            }
        })
        .catch(error => {
            statusMessage.textContent = `❌ Đã có lỗi xảy ra khi gửi: ${error.message}`;
            statusMessage.className = 'error';
        })
        .finally(() => {
            submitButton.disabled = false;
        });
    });
});
