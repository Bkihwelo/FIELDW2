const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuToggle = document.getElementById("menuToggle");
const sidebarClose = document.getElementById("sidebarClose");
const topbarTitle = document.getElementById("topbarTitle");
const currentYear = document.getElementById("currentYear");
const toast = document.getElementById("toast");
const studentForm = document.getElementById("studentForm");
const studentTableBody = document.getElementById("studentTableBody");
const studentSearch = document.getElementById("studentSearch");
const emptyState = document.getElementById("emptyState");
const visibleRecordCount = document.getElementById("visibleRecordCount");
const formTitle = document.getElementById("formTitle");
const cancelEdit = document.getElementById("cancelEdit");
const submitStudent = document.getElementById("submitStudent");
const studentRecords = document.getElementById("studentRecords");
const globalSearchButton = document.getElementById("globalSearchButton");
const notificationButton = document.getElementById("notificationButton");
const profileButton = document.getElementById("profileButton");

const seedStudents = [
    { id: "1", name: "Amina Mwakalinga", code: "IS-2026-001", className: "Form 4", status: "Active" },
    { id: "2", name: "Daniel Mhando", code: "IS-2026-002", className: "Form 3", status: "Active" },
    { id: "3", name: "Neema Joseph", code: "IS-2026-003", className: "Form 2", status: "Inactive" }
];

let students = JSON.parse(localStorage.getItem("iyungaStudents") || "null") || seedStudents;

let toastTimer;

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    })[character]);
}

function setYear() {
    currentYear.textContent = new Date().getFullYear();
}

function isMobile() {
    return window.innerWidth <= 900;
}

function openMobileSidebar() {
    sidebar.classList.add("mobile-open");
    sidebarOverlay.classList.add("visible");
    menuToggle.setAttribute("aria-expanded", "true");
}

function closeMobileSidebar() {
    sidebar.classList.remove("mobile-open");
    sidebarOverlay.classList.remove("visible");
    menuToggle.setAttribute("aria-expanded", "false");
}

function toggleSidebar() {
    if (isMobile()) {
        if (sidebar.classList.contains("mobile-open")) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
        return;
    }

    sidebar.classList.toggle("collapsed");
}

function saveStudents() {
    localStorage.setItem("iyungaStudents", JSON.stringify(students));
}

function renderStudents() {
    const query = studentSearch.value.trim().toLowerCase();
    const visibleStudents = students.filter((student) =>
        [student.name, student.code, student.className, student.status].some((value) => value.toLowerCase().includes(query))
    );

    studentTableBody.innerHTML = visibleStudents.map((student) => `
        <tr>
            <td><strong>${escapeHtml(student.name)}</strong><span>${escapeHtml(student.code)}</span></td>
            <td>${escapeHtml(student.className)}</td>
            <td><span class="status-badge ${student.status.toLowerCase()}">${escapeHtml(student.status)}</span></td>
            <td class="table-actions">
                <button type="button" class="table-button edit" data-id="${student.id}" aria-label="Edit ${student.name}">Edit</button>
                <button type="button" class="table-button delete" data-id="${student.id}" aria-label="Delete ${student.name}">Delete</button>
            </td>
        </tr>`).join("");

    emptyState.hidden = visibleStudents.length !== 0;
    visibleRecordCount.textContent = `${visibleStudents.length} ${visibleStudents.length === 1 ? "record" : "records"}`;
    document.getElementById("totalStudents").textContent = students.length;
    document.getElementById("activeStudents").textContent = students.filter((student) => student.status === "Active").length;
    document.getElementById("classCount").textContent = new Set(students.map((student) => student.className)).size;
    document.getElementById("recordCount").textContent = students.length;
}

function resetForm() {
    studentForm.reset();
    document.getElementById("studentId").value = "";
    formTitle.textContent = "Add a student";
    submitStudent.textContent = "Save Student";
    cancelEdit.hidden = true;
}

function startEdit(student) {
    document.getElementById("studentId").value = student.id;
    document.getElementById("studentName").value = student.name;
    document.getElementById("studentCode").value = student.code;
    document.getElementById("studentClass").value = student.className;
    document.getElementById("studentStatus").value = student.status;
    formTitle.textContent = "Edit student";
    submitStudent.textContent = "Update Student";
    cancelEdit.hidden = false;
    document.getElementById("studentName").focus();
}

studentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = document.getElementById("studentId").value;
    const student = {
        id: id || Date.now().toString(),
        name: document.getElementById("studentName").value.trim(),
        code: document.getElementById("studentCode").value.trim().toUpperCase(),
        className: document.getElementById("studentClass").value,
        status: document.getElementById("studentStatus").value
    };

    if (id) {
        students = students.map((item) => item.id === id ? student : item);
        showToast("Student record updated.");
    } else {
        students.unshift(student);
        showToast("Student added successfully.");
    }
    saveStudents();
    renderStudents();
    resetForm();
});

studentTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const student = students.find((item) => item.id === button.dataset.id);
    if (button.classList.contains("edit")) startEdit(student);
    if (button.classList.contains("delete") && student && window.confirm(`Delete ${student.name}'s record?`)) {
        students = students.filter((item) => item.id !== student.id);
        saveStudents();
        renderStudents();
        showToast("Student record deleted.");
    }
});

studentSearch.addEventListener("input", renderStudents);
cancelEdit.addEventListener("click", resetForm);
globalSearchButton.addEventListener("click", () => {
    studentRecords.scrollIntoView({ behavior: "smooth" });
    studentSearch.focus();
});
notificationButton.addEventListener("click", () => showToast("You are all caught up."));
profileButton.addEventListener("click", () => showToast("Signed in as Administrator."));
document.getElementById("addStudentButton").addEventListener("click", () => {
    resetForm();
    document.getElementById("studentName").focus();
});

menuToggle.addEventListener("click", toggleSidebar);
sidebarClose.addEventListener("click", closeMobileSidebar);
sidebarOverlay.addEventListener("click", closeMobileSidebar);

document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (event) => {
        event.preventDefault();

        document.querySelectorAll(".nav-item").forEach((nav) => {
            nav.classList.remove("active");
        });

        item.classList.add("active");

        const pageName = item.dataset.nav;
        if (pageName && pageName !== "Logout") {
            topbarTitle.textContent = pageName;
        }

        if (isMobile()) {
            closeMobileSidebar();
        }

        if (pageName === "Add Student") {
            resetForm();
            studentRecords.scrollIntoView({ behavior: "smooth" });
            document.getElementById("studentName").focus();
        } else if (pageName === "Students" || pageName === "Student Records") {
            studentRecords.scrollIntoView({ behavior: "smooth" });
        } else if (pageName === "Logout") {
            showToast("Logout is simulated in this demo.");
        } else if (pageName === "Settings") {
            showToast("Settings are not needed for this demo.");
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
});

document.querySelectorAll(".action-card").forEach((card) => {
    card.addEventListener("click", () => {
        if (card.dataset.action === "Add Student") {
            resetForm();
            studentRecords.scrollIntoView({ behavior: "smooth" });
            document.getElementById("studentName").focus();
        } else {
            studentRecords.scrollIntoView({ behavior: "smooth" });
        }
    });
});

function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

window.addEventListener("resize", () => {
    if (!isMobile()) {
        closeMobileSidebar();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebar.classList.contains("mobile-open")) {
        closeMobileSidebar();
    }
});

setYear();
renderStudents();
