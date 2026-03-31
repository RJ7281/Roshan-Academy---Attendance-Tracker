// 1. FIREBASE SDK IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 2. DATA IMPORTS (Standardizing lists)
import { studentList as list1 } from "./Data1.js";
import { studentList as list2 } from "./Data2.js";
import { studentList as list3 } from "./Data3.js";
import { studentList as list4 } from "./Data4.js";
import { studentList as list5 } from "./Data5.js";
import { studentList as list6 } from "./Data6.js";
import { studentList as list7 } from "./Data7.js";
import { studentList as list8 } from "./Data8.js";
import { studentList as list9 } from "./Data9.js";
import { studentList as list10 } from "./Data10.js";

// 3. FIREBASE CONFIGURATION 
const firebaseConfig = {
    apiKey: "AIzaSyDI6oI8rwNwsKBmU_0J6fp7-lIx_oZL9Cc",
    authDomain: "roshan-academy-tracker.firebaseapp.com",
    databaseURL: "https://roshan-academy-tracker-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "roshan-academy-tracker",
    storageBucket: "roshan-academy-tracker.firebasestorage.app",
    messagingSenderId: "680586023085",
    appId: "1:680586023085:web:f14b6f84b618a244917624"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 4. APP CONFIGURATION
const TEACHER_PASSWORD = "Roshan123"; 
const allStudents = {
    1: typeof list1 !== "undefined" ? list1 : [],
    2: typeof list2 !== "undefined" ? list2 : [],
    3: typeof list3 !== "undefined" ? list3 : [],
    4: typeof list4 !== "undefined" ? list4 : [],
    5: typeof list5 !== "undefined" ? list5 : [],
    6: typeof list6 !== "undefined" ? list6 : [],
    7: typeof list7 !== "undefined" ? list7 : [],
    8: typeof list8 !== "undefined" ? list8 : [],
    9: typeof list9 !== "undefined" ? list9 : [],
    10: typeof list10 !== "undefined" ? list10 : [],
};

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

    // Initialize Date
    if (!dateInput.value) dateInput.valueAsDate = new Date();

    // --- PASSWORD TOGGLE LOGIC ---
    togglePassBtn.onclick = () => {
        const isPassword = masterPassInput.type === "password";
        masterPassInput.type = isPassword ? "text" : "password";
        togglePassBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    };

    // --- LOGIN LOGIC ---
    enterBtn.onclick = () => {
        if (masterPassInput.value === TEACHER_PASSWORD) {
            // Success Animation
            loginScreen.classList.add("scale-95", "opacity-0");
            setTimeout(() => {
                loginScreen.classList.add("hidden");
                attendanceScreen.classList.remove("hidden");
                // Trigger a fade-in for the main screen
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

    masterPassInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") enterBtn.click();
    });

    // --- ATTENDANCE RENDERING ---
    async function renderStudents() {
        const selectedStd = stdSelect.value;
        const currentList = allStudents[selectedStd] || [];
        const selectedDate = dateInput.value;

        attendanceBody.innerHTML = '<tr><td colspan="3" class="p-10 text-center"><div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-2"></div><p class="text-blue-500 font-medium">Fetching from Cloud...</p></td></tr>';

        if (currentList.length === 0) {
            attendanceBody.innerHTML = `<tr><td colspan="3" class="p-10 text-center text-red-500 font-bold bg-red-50 rounded-lg">No student data found for Standard ${selectedStd}.</td></tr>`;
            return;
        }

        let savedData = {};
        try {
            const dbRef = ref(db);
            const snapshot = await get(child(dbRef, `attendance/${selectedStd}/${selectedDate}`));
            if (snapshot.exists()) {
                savedData = snapshot.val();
            }
        } catch (error) {
            console.error("Cloud fetch error:", error);
        }

        attendanceBody.innerHTML = "";
        currentList.forEach((student) => {
            const status = savedData[student.id] || "Present";
            const isAbsent = status === "Absent";
            
            const row = document.createElement("tr");
            row.className = `border-b transition-colors duration-200 ${isAbsent ? 'bg-red-50' : 'hover:bg-blue-50/30'}`;
            row.innerHTML = `
                <td class="p-4 text-gray-500 font-mono text-sm font-bold uppercase">${student.id}</td>
                <td class="p-4 font-semibold text-gray-800">${student.name}</td>
                <td class="p-4 text-center">
                    <select class="status-select w-full max-w-[120px] p-2 border-2 rounded-xl bg-white shadow-sm font-bold outline-none focus:ring-2 focus:ring-blue-400 transition-all ${isAbsent ? 'border-red-300 text-red-600' : 'border-gray-100 text-green-600'}" data-id="${student.id}">
                        <option value="Present" ${status === "Present" ? "selected" : ""}>Present</option>
                        <option value="Absent" ${status === "Absent" ? "selected" : ""}>Absent</option>
                    </select>
                </td>
            `;
            attendanceBody.appendChild(row);
        });

        // Add change listener to select to change row color live
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const row = e.target.closest('tr');
                if(e.target.value === "Absent") {
                    row.classList.add('bg-red-50');
                    e.target.classList.replace('border-gray-100', 'border-red-300');
                    e.target.classList.replace('text-green-600', 'text-red-600');
                } else {
                    row.classList.remove('bg-red-50');
                    e.target.classList.replace('border-red-300', 'border-gray-100');
                    e.target.classList.replace('text-red-600', 'text-green-600');
                }
            });
        });
    }

    // --- SAVE LOGIC ---
    saveBtn.onclick = async () => {
        const selectedStd = stdSelect.value;
        const selectedDate = dateInput.value;
        const data = {};

        document.querySelectorAll(".status-select").forEach((select) => {
            data[select.dataset.id] = select.value;
        });

        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Syncing...';
        saveBtn.disabled = true;

        try {
            await set(ref(db, `attendance/${selectedStd}/${selectedDate}`), data);
            
            saveBtn.innerHTML = 'All Records Saved! ✅';
            saveBtn.classList.replace("bg-green-600", "bg-indigo-600");

            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.classList.replace("bg-indigo-600", "bg-green-600");
                saveBtn.disabled = false;
            }, 2500);
        } catch (error) {
            console.error("Save error:", error);
            alert("⚠️ Cloud Error: Please check your internet connection.");
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    };

    // Event Listeners
    stdSelect.onchange = renderStudents;
    dateInput.onchange = renderStudents;
    document.getElementById("lock-btn").onclick = () => {
        // Add a "locking" effect
        attendanceScreen.classList.add("scale-95", "opacity-0");
        setTimeout(() => location.reload(), 300);
    };
});