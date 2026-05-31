// 1. FIREBASE SDK IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, child, push, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 2. FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyDI6oI8rwNwsKBmU_0J6fp7-lIx_oZL9Cc",
    authDomain: "roshan-academy-tracker.firebaseapp.com",
    databaseURL: "https://roshan-academy-tracker-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "roshan-academy-tracker",
    storageBucket: "roshan-academy-tracker.firebasestorage.app",
    messagingSenderId: "680586023085",
    appId: "1:680586023085:web:f14b6f84b618a244917624",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 3. APP CONFIGURATION
const TEACHER_PASSWORD = "Roshan123";

document.addEventListener("DOMContentLoaded", () => {
    // UI ELEMENTS
    const loginScreen = document.getElementById("login-screen");
    const attendanceScreen = document.getElementById("attendance-screen");
    const attendanceBody = document.getElementById("attendance-body");
    const stdSelect = document.getElementById("attendance-std");
    const dateInput = document.getElementById("attendance-date");
    const masterPassInput = document.getElementById("master-pass");
    const loginError = document.getElementById("login-error");
    const enterBtn = document.getElementById("enter-btn");
    const saveBtn = document.getElementById("save-attendance");
    const togglePassBtn = document.getElementById("toggle-password");
    
    // EXPORT BUTTONS
    const exportBtn = document.getElementById("export-btn");               // Daily
    const exportWeeklyBtn = document.getElementById("export-weekly-btn");   // New Weekly Button
    const exportMonthlyBtn = document.getElementById("export-monthly-btn"); // New Monthly Button

    // Initialize Date
    if (!dateInput.value) dateInput.valueAsDate = new Date();

    // --- PASSWORD TOGGLE ---
    togglePassBtn.onclick = () => {
        const isPassword = masterPassInput.type === "password";
        masterPassInput.type = isPassword ? "text" : "password";
        togglePassBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    };

    // --- LOGIN LOGIC ---
    enterBtn.onclick = () => {
        if (masterPassInput.value === TEACHER_PASSWORD) {
            loginScreen.classList.add("scale-95", "opacity-0");
            setTimeout(() => {
                loginScreen.classList.add("hidden");
                attendanceScreen.classList.remove("hidden");
                attendanceScreen.classList.add("animate-in", "fade-in", "duration-500");
                renderStudents();
            }, 300);
        } else {
            loginError.classList.remove("hidden");
            masterPassInput.classList.add("border-red-500", "animate-bounce");
            setTimeout(() => masterPassInput.classList.remove("animate-bounce"), 500);
            masterPassInput.value = "";
        }
    };

    // --- CRUD: RENDER & FETCH ---
    async function renderStudents() {
        const selectedStd = stdSelect.value;
        const selectedDate = dateInput.value;

        attendanceBody.innerHTML = `<tr><td colspan="4" class="p-10 text-center text-blue-500 font-bold animate-pulse">Syncing Cloud Data...</td></tr>`;

        try {
            const [studentSnap, attendanceSnap] = await Promise.all([
                get(ref(db, `students/${selectedStd}`)),
                get(ref(db, `attendance/${selectedStd}/${selectedDate}`))
            ]);

            const studentData = studentSnap.val() || {};
            const attendanceData = attendanceSnap.val() || {};
            attendanceBody.innerHTML = "";

            if (Object.keys(studentData).length === 0) {
                attendanceBody.innerHTML = `<tr><td colspan="4" class="p-10 text-center text-gray-400 italic">No students in Standard ${selectedStd}</td></tr>`;
                return;
            }

            Object.keys(studentData).forEach((key) => {
                const student = studentData[key];
                const status = attendanceData[key] || "Present";
                const isAbsent = status === "Absent";

                const row = document.createElement("tr");
                row.className = `group transition-all duration-200 border-b border-gray-50 ${isAbsent ? "bg-red-50/50" : "hover:bg-blue-50/30"}`;
                row.innerHTML = `
                    <td class="p-5 text-gray-400 font-mono text-sm font-bold uppercase">${student.rollNo}</td>
                    <td class="p-5 font-bold text-gray-700">${student.name}</td>
                    <td class="p-5 text-center">
                        <select class="status-select p-2 px-4 rounded-xl border-none ring-1 font-bold text-sm outline-none transition-all ${isAbsent ? "ring-red-200 text-red-600 bg-white" : "ring-gray-100 text-green-600 bg-white"}" data-key="${key}">
                            <option value="Present" ${status === "Present" ? "selected" : ""}>Present</option>
                            <option value="Absent" ${status === "Absent" ? "selected" : ""}>Absent</option>
                        </select>
                    </td>
                    <td class="p-5 text-right">
                        <button class="delete-btn opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all" data-key="${key}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                attendanceBody.appendChild(row);
            });

            attachRowEventListeners();
        } catch (error) {
            console.error(error);
            attendanceBody.innerHTML = `<tr><td colspan="4" class="p-5 text-center text-red-500">Cloud Connection Error</td></tr>`;
        }
    }

    // --- CRUD: ADD STUDENT ---
    window.addStudent = async () => {
        const rollInput = document.getElementById("new-roll");
        const nameInput = document.getElementById("new-name");
        const std = stdSelect.value;

        if (rollInput.value && nameInput.value) {
            const newStudentRef = push(ref(db, `students/${std}`));
            await set(newStudentRef, { rollNo: rollInput.value, name: nameInput.value });
            rollInput.value = "";
            nameInput.value = "";
            renderStudents();
        } else {
            alert("Please fill both Roll No and Name");
        }
    };

    function attachRowEventListeners() {
        document.querySelectorAll(".status-select").forEach((select) => {
            select.onchange = (e) => {
                const isAbsent = e.target.value === "Absent";
                const row = e.target.closest("tr");
                row.className = `group transition-all duration-200 border-b border-gray-50 ${isAbsent ? "bg-red-50/50" : "hover:bg-blue-50/30"}`;
                e.target.className = `status-select p-2 px-4 rounded-xl border-none ring-1 font-bold text-sm outline-none transition-all ${isAbsent ? "ring-red-200 text-red-600 bg-white" : "ring-gray-100 text-green-600 bg-white"}`;
            };
        });

        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.onclick = async (e) => {
                const key = e.target.closest("button").dataset.key;
                if (confirm("Delete this student permanently?")) {
                    await remove(ref(db, `students/${stdSelect.value}/${key}`));
                    renderStudents();
                }
            };
        });
    }

    // --- CRUD: SAVE ATTENDANCE ---
    saveBtn.onclick = async () => {
        const data = {};
        document.querySelectorAll(".status-select").forEach((select) => {
            data[select.dataset.key] = select.value;
        });

        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Syncing...';
        saveBtn.disabled = true;

        try {
            await set(ref(db, `attendance/${stdSelect.value}/${dateInput.value}`), data);
            saveBtn.innerHTML = 'Attendance Saved! ✅';
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }, 2000);
        } catch (error) {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
            alert("Save failed!");
        }
    };

    // --- NEW: HELPER RANGE EXPORT FOR WEEKLY & MONTHLY ---
    async function exportHistoricalRange(type) {
        const selectedStd = stdSelect.value;
        const chosenDateStr = dateInput.value; 
        if (!chosenDateStr) return alert("Please pick an anchor date first.");

        const anchorDate = new Date(chosenDateStr);
        const targetDates = [];

        if (type === 'weekly') {
            // Generates the trailing 7 days leading up to the selected date
            for (let i = 6; i >= 0; i--) {
                const target = new Date(anchorDate);
                target.setDate(anchorDate.getDate() - i);
                targetDates.push(target.toISOString().split('T')[0]);
            }
        } else if (type === 'monthly') {
            // Generates every calendar day for the chosen date's specific month
            const year = anchorDate.getFullYear();
            const month = anchorDate.getMonth(); 
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dayString = String(day).padStart(2, '0');
                const monthString = String(month + 1).padStart(2, '0');
                targetDates.push(`${year}-${monthString}-${dayString}`);
            }
        }

        try {
            // Fetch student data and all historic logs for this class standard
            const [studentSnap, archiveSnap] = await Promise.all([
                get(ref(db, `students/${selectedStd}`)),
                get(ref(db, `attendance/${selectedStd}`))
            ]);

            const students = studentSnap.val() || {};
            const attendanceHistory = archiveSnap.val() || {};

            if (Object.keys(students).length === 0) {
                return alert("No students found in this standard to compile a report.");
            }

            // Create Excel row structures mapping dates dynamically into separate columns
            const structuredRows = Object.keys(students).map(studentKey => {
                const info = students[studentKey];
                const excelRow = {
                    "Roll No": info.rollNo,
                    "Student Name": info.name
                };

                // Append columns dynamically for each date generated above
                targetDates.forEach(dateStr => {
                    const dayLogs = attendanceHistory[dateStr] || {};
                    excelRow[dateStr] = dayLogs[studentKey] || "-"; // Defaults to dash if day log missing
                });

                return excelRow;
            });

            // Parse data matrix using SheetJS
            const worksheet = XLSX.utils.json_to_sheet(structuredRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Log");
            
            // Finalize download file matching type requested
            XLSX.writeFile(workbook, `Attendance_Std${selectedStd}_${type}_Report_${chosenDateStr}.xlsx`);

        } catch (err) {
            console.error(err);
            alert("Failed to build range report. Check network connection.");
        }
    }

    // --- EXPORT EVENT HANDLERS ---
    
    // 1. Daily Export (Keeps your fast, localized DOM reader intact)
    exportBtn.onclick = () => {
        const dataForExcel = [];
        const rows = document.querySelectorAll("#attendance-body tr");

        rows.forEach((row) => {
            const cols = row.querySelectorAll("td");
            if (cols.length >= 3) {
                dataForExcel.push({
                    "Roll No": cols[0].innerText,
                    "Student Name": cols[1].innerText,
                    "Status": row.querySelector(".status-select").value,
                });
            }
        });

        if (dataForExcel.length === 0) return alert("No data to export");

        const ws = XLSX.utils.json_to_sheet(dataForExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `Attendance_Std${stdSelect.value}_Daily_${dateInput.value}.xlsx`);
    };

    // 2. Weekly Link
    if (exportWeeklyBtn) {
        exportWeeklyBtn.onclick = () => exportHistoricalRange('weekly');
    }

    // 3. Monthly Link
    if (exportMonthlyBtn) {
        exportMonthlyBtn.onclick = () => exportHistoricalRange('monthly');
    }

    // UI Listeners
    stdSelect.onchange = renderStudents;
    dateInput.onchange = renderStudents;
    document.getElementById("lock-btn").onclick = () => location.reload();
});
