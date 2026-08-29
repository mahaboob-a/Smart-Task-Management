/* =====================================================
   TASKFLOW - SMART TASK MANAGEMENT
   ===================================================== */


/* ================= DATA ================= */

let tasks =
  JSON.parse(
    localStorage.getItem("taskflow_tasks") || "[]"
  );

let notes =
  JSON.parse(
    localStorage.getItem("taskflow_notes") || "[]"
  );


/* ================= APPLICATION STATE ================= */

let currentView = "dashboard";

let currentPriority = "all";

let searchQuery = "";

let sortType = "newest";

let calendarDate = new Date();

let selectedCalendarDate = new Date();


/* ================= TIMER ================= */

let timerSeconds = 25 * 60;

let timerInterval = null;


/* ================= HELPERS ================= */

const $ = id =>
  document.getElementById(id);


const taskModal =
  new bootstrap.Modal(
    $("taskModal")
  );


const noteModal =
  new bootstrap.Modal(
    $("noteModal")
  );


/* ================= INITIALIZE ================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadTheme();

    updateHeader();

    setupNavigation();

    setupTaskEvents();

    setupNoteEvents();

    setupCalendar();

    setupTimer();

    renderAll();

    checkReminders();

    setInterval(
      checkReminders,
      30000
    );

  }
);


/* ================= STORAGE ================= */

function saveAll() {

  localStorage.setItem(
    "taskflow_tasks",
    JSON.stringify(tasks)
  );

  localStorage.setItem(
    "taskflow_notes",
    JSON.stringify(notes)
  );

}


/* ================= ID ================= */

function generateId() {

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );

}


/* ================= DATE ================= */

function todayStr(
  date = new Date()
) {

  return date
    .toISOString()
    .slice(0, 10);

}


function formatDate(dateString) {

  if (!dateString) return "";

  return new Date(
    dateString + "T00:00:00"
  ).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );

}


/* ================= HTML SECURITY ================= */

function escapeHTML(
  text = ""
) {

  return text.replace(
    /[&<>"']/g,
    char => {

      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return entities[char];

    }
  );

}


/* ================= TASK DATE ================= */

function isToday(task) {

  return (
    task.dueDate ===
    todayStr()
  );

}


function isOverdue(task) {

  if (
    task.completed ||
    !task.dueDate
  ) {
    return false;
  }

  const end =
    task.dueDate +
    (
      task.dueTime
        ? `T${task.dueTime}`
        : "T23:59"
    );

  return new Date(end) < new Date();

}


/* ================= PRIORITY ================= */

function priorityRank(priority) {

  return {
    high: 1,
    medium: 2,
    low: 3
  }[priority] || 4;

}


/* =====================================================
   NAVIGATION
   ===================================================== */

function setupNavigation() {

  const mobileMenu =
    document.querySelector(
      ".mobile-menu"
    );


  mobileMenu.innerHTML =
    [
      ...document.querySelectorAll(
        "#desktopMenu .nav-item"
      )
    ]
      .map(
        button =>
          `
          <button
            class="nav-item ${
              button.classList.contains(
                "active"
              )
                ? "active"
                : ""
            }"
            data-view="${button.dataset.view}"
          >
            ${button.innerHTML}
          </button>
          `
      )
      .join("");


  document
    .querySelectorAll(
      ".nav-item[data-view]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          switchView(
            button.dataset.view
          )
      );

    });

}


function switchView(view) {

  currentView = view;


  document
    .querySelectorAll(
      ".view-section"
    )
    .forEach(section =>
      section.classList.add(
        "d-none"
      )
    );


  if (
    view === "dashboard" ||
    [
      "today",
      "upcoming",
      "important",
      "completed",
      "pending",
      "overdue"
    ].includes(view)
  ) {

    $("dashboardView")
      .classList.remove(
        "d-none"
      );

  }

  else if (view === "notes") {

    $("notesView")
      .classList.remove(
        "d-none"
      );

  }

  else if (view === "calendar") {

    $("calendarView")
      .classList.remove(
        "d-none"
      );

  }

  else if (view === "focus") {

    $("focusView")
      .classList.remove(
        "d-none"
      );

  }


  document
    .querySelectorAll(
      ".nav-item[data-view]"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.view === view
      );

    });


  if (
    [
      "today",
      "upcoming",
      "important",
      "completed",
      "pending",
      "overdue"
    ].includes(view)
  ) {

    updateTaskTitle();

    renderTasks();

  }


  if (view === "notes") {

    renderNotes();

  }


  if (view === "calendar") {

    renderCalendar();

  }

}


/* =====================================================
   TASK EVENTS
   ===================================================== */

function setupTaskEvents() {

  $("taskForm")
    .addEventListener(
      "submit",
      saveTask
    );


  $("searchInput")
    .addEventListener(
      "input",
      event => {

        searchQuery =
          event.target.value
            .toLowerCase()
            .trim();

        renderTasks();

        renderNotes();

      }
    );


  $("sortSelect")
    .addEventListener(
      "change",
      event => {

        sortType =
          event.target.value;

        renderTasks();

      }
    );


  document
    .querySelectorAll(
      "[data-priority]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          currentPriority =
            button.dataset.priority;


          document
            .querySelectorAll(
              "[data-priority]"
            )
            .forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );


          button.classList.add(
            "active"
          );


          renderTasks();

        }
      );

    });


  $("addTaskBtn")
    .addEventListener(
      "click",
      prepareNewTask
    );


  $("quickAddBtn")
    .addEventListener(
      "click",
      prepareNewTask
    );


  $("themeToggle")
    .addEventListener(
      "click",
      toggleTheme
    );


  $("mobileThemeToggle")
    .addEventListener(
      "click",
      toggleTheme
    );


  $("notificationBtn")
    .addEventListener(
      "click",
      requestNotifications
    );


  $("topNotificationBtn")
    .addEventListener(
      "click",
      requestNotifications
    );


  $("clearAllBtn")
    .addEventListener(
      "click",
      clearAllTasks
    );

}


/* =====================================================
   NEW TASK
   ===================================================== */

function prepareNewTask() {

  $("taskForm").reset();

  $("taskId").value = "";

  $("taskReminderEnabled")
    .checked = true;

  $("taskReminder").value = "30";

  $("taskRepeat").value =
    "none";

  $("modalTitle").textContent =
    "Create New Task";

  $("saveTaskBtn").innerHTML =
    `
      <i class="bi bi-check-lg"></i>
      Save Task
    `;

}


/* =====================================================
   SAVE TASK
   ===================================================== */

function saveTask(event) {

  event.preventDefault();


  const taskId =
    $("taskId").value;


  const title =
    $("taskTitle")
      .value
      .trim();


  if (!title) {

    toast(
      "Enter a task title.",
      "warning"
    );

    return;

  }


  const taskData = {

    title,

    description:
      $("taskDescription")
        .value
        .trim(),

    category:
      $("taskCategory")
        .value,

    priority:
      $("taskPriority")
        .value,

    dueDate:
      $("taskDueDate")
        .value,

    dueTime:
      $("taskDueTime")
        .value,

    reminderMinutes:
      Number(
        $("taskReminder")
          .value
      ),

    reminderEnabled:
      $("taskReminderEnabled")
        .checked,

    repeat:
      $("taskRepeat")
        .value,

    important:
      $("taskImportant")
        .checked

  };


  /* EDIT */

  if (taskId) {

    const task =
      tasks.find(
        item =>
          item.id === taskId
      );


    if (task) {

      Object.assign(
        task,
        taskData,
        {
          updatedAt:
            new Date()
              .toISOString()
        }
      );

    }


    toast(
      "Task updated.",
      "success"
    );

  }


  /* CREATE */

  else {

    tasks.unshift({

      id: generateId(),

      ...taskData,

      completed: false,

      createdAt:
        new Date()
          .toISOString(),

      updatedAt:
        new Date()
          .toISOString()

    });


    toast(
      "Task created.",
      "success"
    );

  }


  saveAll();

  taskModal.hide();

  renderAll();

}


/* =====================================================
   EDIT TASK
   ===================================================== */

function editTask(taskId) {

  const task =
    tasks.find(
      item =>
        item.id === taskId
    );


  if (!task) return;


  $("taskId").value =
    task.id;


  $("taskTitle").value =
    task.title;


  $("taskDescription").value =
    task.description || "";


  $("taskCategory").value =
    task.category || "Other";


  $("taskPriority").value =
    task.priority || "medium";


  $("taskDueDate").value =
    task.dueDate || "";


  $("taskDueTime").value =
    task.dueTime || "";


  $("taskReminder").value =
    task.reminderMinutes ?? 30;


  $("taskReminderEnabled")
    .checked =
    task.reminderEnabled !== false;


  $("taskRepeat").value =
    task.repeat || "none";


  $("taskImportant")
    .checked =
    Boolean(
      task.important
    );


  $("modalTitle").textContent =
    "Edit Task";


  $("saveTaskBtn").innerHTML =
    `
      <i class="bi bi-check-lg"></i>
      Update Task
    `;


  taskModal.show();

}


/* =====================================================
   COMPLETE TASK
   ===================================================== */

function toggleTask(taskId) {

  const task =
    tasks.find(
      item =>
        item.id === taskId
    );


  if (!task) return;


  task.completed =
    !task.completed;


  task.completedAt =
    task.completed
      ? new Date()
          .toISOString()
      : null;


  saveAll();


  toast(
    task.completed
      ? "Task completed! 🎉"
      : "Task reopened.",
    "success"
  );


  renderAll();

}


/* =====================================================
   IMPORTANT
   ===================================================== */

function toggleImportant(taskId) {

  const task =
    tasks.find(
      item =>
        item.id === taskId
    );


  if (!task) return;


  task.important =
    !task.important;


  saveAll();

  renderAll();

}


/* =====================================================
   DELETE TASK
   ===================================================== */

function deleteTask(taskId) {

  if (
    !confirm(
      "Delete this task?"
    )
  ) {
    return;
  }


  tasks =
    tasks.filter(
      task =>
        task.id !== taskId
    );


  saveAll();

  toast(
    "Task deleted.",
    "success"
  );


  renderAll();

}


/* =====================================================
   CLEAR ALL
   ===================================================== */

function clearAllTasks() {

  if (
    tasks.length &&
    confirm(
      "Delete all tasks?"
    )
  ) {

    tasks = [];

    saveAll();

    renderAll();

    toast(
      "All tasks deleted.",
      "success"
    );

  }

}


/* =====================================================
   FILTER TASKS
   ===================================================== */

function filteredTasks() {

  let result =
    [...tasks];


  /* SEARCH */

  if (searchQuery) {

    result =
      result.filter(
        task =>
          `
          ${task.title}
          ${task.description}
          ${task.category}
          `
            .toLowerCase()
            .includes(
              searchQuery
            )
      );

  }


  /* VIEW */

  if (
    currentView === "today"
  ) {

    result =
      result.filter(
        isToday
      );

  }


  if (
    currentView === "upcoming"
  ) {

    result =
      result.filter(
        task =>
          task.dueDate &&
          task.dueDate >
            todayStr() &&
          !task.completed
      );

  }


  if (
    currentView === "important"
  ) {

    result =
      result.filter(
        task =>
          task.important
      );

  }


  if (
    currentView === "completed"
  ) {

    result =
      result.filter(
        task =>
          task.completed
      );

  }


  if (
    currentView === "pending"
  ) {

    result =
      result.filter(
        task =>
          !task.completed
      );

  }


  if (
    currentView === "overdue"
  ) {

    result =
      result.filter(
        isOverdue
      );

  }


  /* PRIORITY */

  if (
    currentPriority !==
    "all"
  ) {

    result =
      result.filter(
        task =>
          task.priority ===
          currentPriority
      );

  }


  /* SORT */

  result.sort(
    (a, b) => {

      if (
        sortType ===
        "oldest"
      ) {

        return (
          new Date(
            a.createdAt
          ) -
          new Date(
            b.createdAt
          )
        );

      }


      if (
        sortType ===
        "due"
      ) {

        return (
          new Date(
            (
              a.dueDate ||
              "9999-12-31"
            ) +
            "T" +
            (
              a.dueTime ||
              "23:59"
            )
          ) -

          new Date(
            (
              b.dueDate ||
              "9999-12-31"
            ) +
            "T" +
            (
              b.dueTime ||
              "23:59"
            )
          )
        );

      }


      if (
        sortType ===
        "priority"
      ) {

        return (
          priorityRank(
            a.priority
          ) -
          priorityRank(
            b.priority
          )
        );

      }


      return (
        new Date(
          b.createdAt
        ) -
        new Date(
          a.createdAt
        )
      );

    }
  );


  return result;

}


/* =====================================================
   RENDER TASKS
   ===================================================== */

function renderTasks() {

  const list =
    $("taskList");


  const result =
    filteredTasks();


  list.innerHTML = "";


  $("emptyState")
    .classList.toggle(
      "d-none",
      result.length > 0
    );


  result.forEach(
    task => {

      const dueStatus =
        isOverdue(task)
          ? "overdue"
          : isToday(task)
          ? "today"
          : "";


      const element =
        document.createElement(
          "div"
        );


      element.className =
        `task-item ${
          task.completed
            ? "completed"
            : ""
        }`;


      element.innerHTML = `

        <div class="task-check">

          <button
            class="task-checkbox ${
              task.completed
                ? "checked"
                : ""
            }"
            onclick="toggleTask('${task.id}')"
          >

            ${
              task.completed
                ? '<i class="bi bi-check"></i>'
                : ""
            }

          </button>

        </div>


        <div class="task-content">

          <div class="task-title-row">

            <h6 class="task-title">
              ${escapeHTML(
                task.title
              )}
            </h6>


            ${
              task.important
                ? `
                  <i
                    class="bi bi-star-fill important-star"
                  ></i>
                `
                : ""
            }


            ${
              task.reminderEnabled &&
              task.dueDate
                ? `
                  <i
                    class="bi bi-bell-fill text-warning"
                    title="Reminder enabled"
                  ></i>
                `
                : ""
            }

          </div>


          ${
            task.description
              ? `
                <div class="task-description">
                  ${escapeHTML(
                    task.description
                  )}
                </div>
              `
              : ""
          }


          <div class="task-meta">

            <span class="task-badge category-badge">
              ${escapeHTML(
                task.category
              )}
            </span>


            <span
              class="task-badge priority-badge ${
                task.priority
              }"
            >
              ${task.priority}
            </span>


            ${
              task.dueDate
                ? `
                  <span
                    class="due-date ${dueStatus}"
                  >

                    <i
                      class="bi bi-calendar-event"
                    ></i>

                    ${formatDate(
                      task.dueDate
                    )}

                    ${
                      task.dueTime
                        ? ` • ${task.dueTime}`
                        : ""
                    }

                    ${
                      isOverdue(task)
                        ? " • Overdue"
                        : ""
                    }

                  </span>
                `
                : ""
            }


            ${
              task.repeat &&
              task.repeat !== "none"
                ? `
                  <span
                    class="task-badge category-badge"
                  >

                    <i
                      class="bi bi-arrow-repeat"
                    ></i>

                    ${task.repeat}

                  </span>
                `
                : ""
            }

          </div>

        </div>


        <div class="task-actions">

          <button
            class="task-action-btn"
            onclick="toggleImportant('${task.id}')"
            title="Important"
          >

            <i
              class="bi bi-star${
                task.important
                  ? "-fill"
                  : ""
              }"
            ></i>

          </button>


          <button
            class="task-action-btn"
            onclick="editTask('${task.id}')"
            title="Edit"
          >

            <i class="bi bi-pencil"></i>

          </button>


          <button
            class="task-action-btn"
            onclick="deleteTask('${task.id}')"
            title="Delete"
          >

            <i class="bi bi-trash3"></i>

          </button>

        </div>

      `;


      list.appendChild(
        element
      );

    }
  );

}


/* =====================================================
   TASK TITLE
   ===================================================== */

function updateTaskTitle() {

  const names = {

    dashboard: [
      "All Tasks",
      "Manage your tasks efficiently"
    ],

    today: [
      "Today's Tasks",
      "Tasks scheduled for today"
    ],

    upcoming: [
      "Upcoming Tasks",
      "Plan what comes next"
    ],

    important: [
      "Important Tasks",
      "Your starred tasks"
    ],

    completed: [
      "Completed Tasks",
      "Tasks you have finished"
    ],

    pending: [
      "Pending Tasks",
      "Tasks still waiting for completion"
    ],

    overdue: [
      "Overdue Tasks",
      "Tasks that need attention"
    ]

  };


  if (
    names[currentView]
  ) {

    $("taskSectionTitle")
      .textContent =
      names[currentView][0];


    $("taskSectionSubtitle")
      .textContent =
      names[currentView][1];

  }

}


/* =====================================================
   DASHBOARD
   ===================================================== */

function renderDashboard() {

  const total =
    tasks.length;


  const completed =
    tasks.filter(
      task =>
        task.completed
    ).length;


  const pending =
    total -
    completed;


  const overdue =
    tasks.filter(
      isOverdue
    ).length;


  $("totalTasks")
    .textContent =
    total;


  $("pendingTasks")
    .textContent =
    pending;


  $("completedTasks")
    .textContent =
    completed;


  $("overdueTasks")
    .textContent =
    overdue;


  const percentage =
    total
      ? Math.round(
          completed /
          total *
          100
        )
      : 0;


  $("progressPercentage")
    .textContent =
    percentage + "%";


  $("progressBar")
    .style.width =
    percentage + "%";


  $("progressText")
    .textContent =
    `${completed} of ${total} tasks completed`;


  if (
    percentage === 100 &&
    total
  ) {

    $("productivityMessage")
      .textContent =
      "Amazing! All tasks completed! 🎉";

  }

  else if (
    percentage >= 75
  ) {

    $("productivityMessage")
      .textContent =
      "Great progress! Keep going!";

  }

  else if (
    percentage >= 50
  ) {

    $("productivityMessage")
      .textContent =
      "You're halfway there!";

  }

  else {

    $("productivityMessage")
      .textContent =
      "Keep working towards your goals!";

  }


  /* CATEGORY */

  const categories = {

    Work: 0,
    Study: 0,
    Personal: 0,
    Shopping: 0,
    Fitness: 0,
    Other: 0

  };


  tasks.forEach(
    task => {

      categories[
        task.category
      ] =
        (
          categories[
            task.category
          ] || 0
        ) + 1;

    }
  );


  $("categoryStats")
    .innerHTML =

    Object.entries(
      categories
    )

      .filter(
        ([, count]) =>
          count || !total
      )

      .map(
        ([category, count]) =>

          `
          <div class="category-item">

            <div class="category-label">

              <span>
                ${category}
              </span>

              <span>
                ${count}
              </span>

            </div>

            <div class="category-progress">

              <div
                class="category-progress-bar"
                style="
                  width:
                  ${
                    total
                      ? Math.round(
                          count /
                          total *
                          100
                        )
                      : 0
                  }%
                "
              ></div>

            </div>

          </div>
          `
      )

      .join("");


  /* TODAY FOCUS */

  const focusTasks =
    tasks
      .filter(
        task =>
          !task.completed &&
          (
            isToday(task) ||
            task.important ||
            isOverdue(task)
          )
      )
      .slice(0, 5);


  $("focusTasks")
    .innerHTML =

    focusTasks.length

      ? focusTasks
          .map(
            task =>

              `
              <div class="calendar-task-row">

                <i
                  class="bi bi-${
                    task.priority ===
                    "high"
                      ? "exclamation-circle"
                      : "circle"
                  } me-2"
                ></i>

                ${escapeHTML(
                  task.title
                )}

                ${
                  task.dueTime
                    ? `
                      <small
                        class="text-muted float-end"
                      >
                        ${task.dueTime}
                      </small>
                    `
                    : ""
                }

              </div>
              `
          )
          .join("")

      :

        `
        <div
          class="empty-state py-4"
        >

          <p>
            No urgent tasks.
            Enjoy your day! ✨
          </p>

        </div>
        `;


  /* STREAK */

  const completedDates =
    new Set(
      tasks
        .filter(
          task =>
            task.completed &&
            task.completedAt
        )
        .map(
          task =>
            todayStr(
              new Date(
                task.completedAt
              )
            )
        )
    );


  let streak = 0;

  let date = new Date();


  while (
    completedDates.has(
      todayStr(date)
    )
  ) {

    streak++;

    date.setDate(
      date.getDate() - 1
    );

  }


  $("streakNumber")
    .textContent =
    streak;


  $("streakMessage")
    .textContent =

    streak
      ? `You're on a ${streak}-day streak! Keep going.`
      : "Complete a task today to start.";

}


/* =====================================================
   RENDER ALL
   ===================================================== */

function renderAll() {

  renderDashboard();

  renderTasks();

  updateTaskTitle();

  renderNotes();

  renderCalendar();

}


/* =====================================================
   HEADER
   ===================================================== */

function updateHeader() {

  const hour =
    new Date().getHours();


  $("greeting")
    .textContent =

    (
      hour < 12
        ? "Good Morning"
        : hour < 18
        ? "Good Afternoon"
        : "Good Evening"
    ) + " 👋";


  $("currentDate")
    .textContent =

    new Date()
      .toLocaleDateString(
        undefined,
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      );

}


/* =====================================================
   NOTIFICATIONS
   ===================================================== */

function requestNotifications() {

  if (
    !("Notification" in window)
  ) {

    toast(
      "Notifications are not supported in this browser.",
      "warning"
    );

    return;

  }


  Notification
    .requestPermission()
    .then(
      permission => {

        if (
          permission ===
          "granted"
        ) {

          toast(
            "Notifications enabled 🔔",
            "success"
          );

        }

        else {

          toast(
            "Notification permission was not granted.",
            "warning"
          );

        }

      }
    );

}


/* =====================================================
   REMINDER CHECK
   ===================================================== */

function checkReminders() {

  if (
    !("Notification" in window) ||
    Notification.permission !==
      "granted"
  ) {
    return;
  }


  const now =
    new Date();


  tasks
    .filter(
      task =>
        !task.completed &&
        task.reminderEnabled &&
        task.dueDate &&
        task.dueTime
    )
    .forEach(
      task => {

        const due =
          new Date(
            `${task.dueDate}T${task.dueTime}`
          );


        const reminder =
          new Date(
            due.getTime() -
            (
              task.reminderMinutes ||
              0
            ) *
            60000
          );


        const difference =
          now - reminder;


        const notificationKey =
          `
          taskflow_notified_
          ${task.id}_
          ${task.dueDate}_
          ${task.dueTime}_
          ${task.reminderMinutes}
          `;


        if (
          difference >= 0 &&
          difference < 90000 &&
          !localStorage.getItem(
            notificationKey
          )
        ) {

          new Notification(
            "TaskFlow Reminder",
            {
              body:
                `${task.title} is due ${
                  now >= due
                    ? "now"
                    : "soon"
                }.`
            }
          );


          localStorage.setItem(
            notificationKey,
            "1"
          );

        }

      }
    );

}


/* =====================================================
   DARK MODE
   ===================================================== */

function toggleTheme() {

  document.body
    .classList.toggle(
      "dark-mode"
    );


  localStorage.setItem(
    "taskflow_theme",

    document.body
      .classList.contains(
        "dark-mode"
      )
      ? "dark"
      : "light"
  );

}


function loadTheme() {

  if (
    localStorage.getItem(
      "taskflow_theme"
    ) === "dark"
  ) {

    document.body
      .classList.add(
        "dark-mode"
      );

  }

}


/* =====================================================
   NOTES
   ===================================================== */

function setupNoteEvents() {

  $("addNoteBtn")
    .addEventListener(
      "click",
      prepareNewNote
    );


  $("noteForm")
    .addEventListener(
      "submit",
      saveNote
    );


  $("noteSearch")
    .addEventListener(
      "input",
      renderNotes
    );


  $("noteCategoryFilter")
    .addEventListener(
      "change",
      renderNotes
    );

}


/* ================= NEW NOTE ================= */

function prepareNewNote() {

  $("noteForm").reset();

  $("noteId").value = "";

  $("notePinned")
    .checked = false;


  $("noteModalTitle")
    .textContent =
    "New Note";


  noteModal.show();

}


/* ================= SAVE NOTE ================= */

function saveNote(event) {

  event.preventDefault();


  const noteId =
    $("noteId").value;


  const data = {

    title:
      $("noteTitle")
        .value
        .trim(),

    category:
      $("noteCategory")
        .value,

    content:
      $("noteContent")
        .value
        .trim(),

    pinned:
      $("notePinned")
        .checked,

    updatedAt:
      new Date()
        .toISOString()

  };


  if (
    !data.title ||
    !data.content
  ) {
    return;
  }


  if (noteId) {

    const note =
      notes.find(
        item =>
          item.id === noteId
      );


    if (note) {

      Object.assign(
        note,
        data
      );

    }


    toast(
      "Note updated.",
      "success"
    );

  }

  else {

    notes.unshift({

      id: generateId(),

      ...data,

      createdAt:
        new Date()
          .toISOString()

    });


    toast(
      "Note saved.",
      "success"
    );

  }


  saveAll();

  noteModal.hide();

  renderNotes();

}


/* ================= EDIT NOTE ================= */

function editNote(noteId) {

  const note =
    notes.find(
      item =>
        item.id === noteId
    );


  if (!note) return;


  $("noteId").value =
    note.id;


  $("noteTitle").value =
    note.title;


  $("noteCategory").value =
    note.category;


  $("noteContent").value =
    note.content;


  $("notePinned").checked =
    Boolean(
      note.pinned
    );


  $("noteModalTitle")
    .textContent =
    "Edit Note";


  noteModal.show();

}


/* ================= DELETE NOTE ================= */

function deleteNote(noteId) {

  if (
    !confirm(
      "Delete this note?"
    )
  ) {
    return;
  }


  notes =
    notes.filter(
      note =>
        note.id !== noteId
    );


  saveAll();

  renderNotes();


  toast(
    "Note deleted.",
    "success"
  );

}


/* ================= PIN NOTE ================= */

function pinNote(noteId) {

  const note =
    notes.find(
      item =>
        item.id === noteId
    );


  if (!note) return;


  note.pinned =
    !note.pinned;


  saveAll();

  renderNotes();

}


/* ================= RENDER NOTES ================= */

function renderNotes() {

  if (!$("notesGrid")) {
    return;
  }


  const query =
    $("noteSearch")
      .value
      .toLowerCase()
      .trim();


  const category =
    $("noteCategoryFilter")
      .value;


  const filtered =
    notes
      .filter(
        note =>

          (
            category ===
            "all" ||
            note.category ===
            category
          )

          &&

          (
            !query ||

            `
            ${note.title}
            ${note.content}
            ${note.category}
            `
              .toLowerCase()
              .includes(
                query
              )
          )
      )


      .sort(
        (a, b) =>

          Number(b.pinned) -
          Number(a.pinned)

          ||

          new Date(
            b.updatedAt
          ) -

          new Date(
            a.updatedAt
          )
      );


  $("notesGrid")
    .innerHTML =

    filtered.length

      ? filtered
          .map(
            note =>

              `
              <article
                class="note-card ${
                  note.pinned
                    ? "pinned"
                    : ""
                }"
              >

                <div class="note-top">

                  <div>

                    <h5 class="note-title">
                      ${escapeHTML(
                        note.title
                      )}
                    </h5>

                    <span class="note-category">
                      ${escapeHTML(
                        note.category
                      )}
                    </span>

                  </div>


                  <div class="note-actions">

                    <button
                      class="task-action-btn"
                      onclick="pinNote('${note.id}')"
                      title="Pin"
                    >

                      <i
                        class="bi bi-pin${
                          note.pinned
                            ? "-fill"
                            : ""
                        }"
                      ></i>

                    </button>


                    <button
                      class="task-action-btn"
                      onclick="editNote('${note.id}')"
                      title="Edit"
                    >

                      <i class="bi bi-pencil"></i>

                    </button>


                    <button
                      class="task-action-btn"
                      onclick="deleteNote('${note.id}')"
                      title="Delete"
                    >

                      <i class="bi bi-trash3"></i>

                    </button>

                  </div>

                </div>


                <div class="note-content">
                  ${escapeHTML(
                    note.content
                  )}
                </div>


                <div class="note-date">

                  Updated
                  ${new Date(
                    note.updatedAt
                  ).toLocaleString()}

                </div>

              </article>
              `
          )
          .join("")

      :

        `
        <div
          class="empty-state"
          style="grid-column:1/-1"
        >

          <div class="empty-icon">

            <i
              class="bi bi-journal-text"
            ></i>

          </div>

          <h5>
            No notes found
          </h5>

          <p>
            Create your first note.
          </p>

        </div>
        `;

}


/* =====================================================
   CALENDAR
   ===================================================== */

function setupCalendar() {

  $("prevMonth")
    .addEventListener(
      "click",
      () => {

        calendarDate.setMonth(
          calendarDate.getMonth() - 1
        );

        renderCalendar();

      }
    );


  $("nextMonth")
    .addEventListener(
      "click",
      () => {

        calendarDate.setMonth(
          calendarDate.getMonth() + 1
        );

        renderCalendar();

      }
    );

}


/* ================= RENDER CALENDAR ================= */

function renderCalendar() {

  $("calendarTitle")
    .textContent =

    calendarDate
      .toLocaleDateString(
        undefined,
        {
          month: "long",
          year: "numeric"
        }
      );


  const firstDay =
    new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth(),
      1
    );


  const lastDay =
    new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth() + 1,
      0
    );


  const start =
    (
      firstDay.getDay() +
      6
    ) % 7;


  const totalDays =
    Math.ceil(
      (
        start +
        lastDay.getDate()
      ) / 7
    ) * 7;


  let html = "";


  [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun"
  ]
    .forEach(
      day => {

        html +=
          `
          <div class="calendar-day-name">
            ${day}
          </div>
          `;

      }
    );


  for (
    let index = 0;
    index < totalDays;
    index++
  ) {

    const number =
      index -
      start +
      1;


    const date =
      new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth(),
        number
      );


    const inMonth =
      date.getMonth() ===
      calendarDate.getMonth();


    const dateString =
      todayStr(date);


    const dayTasks =
      tasks.filter(
        task =>
          task.dueDate ===
          dateString
      );


    html +=

      `
      <div
        class="
          calendar-cell
          ${inMonth ? "" : "muted"}
          ${
            dateString ===
            todayStr()
              ? "today"
              : ""
          }
          ${
            dateString ===
            todayStr(
              selectedCalendarDate
            )
              ? "selected"
              : ""
          }
        "
        onclick="
          selectCalendarDate(
            '${dateString}'
          )
        "
      >

        <div class="calendar-date">
          ${date.getDate()}
        </div>


        <div class="calendar-dots">

          ${dayTasks
            .slice(0, 5)
            .map(
              task =>
                `
                <span
                  class="calendar-dot"
                  title="${escapeHTML(
                    task.title
                  )}"
                ></span>
                `
            )
            .join("")}

        </div>

      </div>
      `;

  }


  $("calendarGrid")
    .innerHTML =
    html;


  renderCalendarTasks();

}


/* ================= SELECT DATE ================= */

function selectCalendarDate(
  dateString
) {

  selectedCalendarDate =
    new Date(
      dateString + "T00:00"
    );


  renderCalendar();

}


/* ================= CALENDAR TASKS ================= */

function renderCalendarTasks() {

  const dateString =
    todayStr(
      selectedCalendarDate
    );


  const selectedTasks =
    tasks.filter(
      task =>
        task.dueDate ===
        dateString
    );


  $("calendarTasks")
    .innerHTML =

    `
    <h6>

      ${formatDate(
        dateString
      )}

      •
      ${selectedTasks.length}
      task${
        selectedTasks.length === 1
          ? ""
          : "s"
      }

    </h6>

    `

    +

    (

      selectedTasks.length

        ?

          selectedTasks
            .map(
              task =>

                `
                <div
                  class="calendar-task-row"
                >

                  <i
                    class="bi bi-${
                      task.completed
                        ? "check-circle-fill text-success"
                        : "circle"
                    } me-2"
                  ></i>

                  ${escapeHTML(
                    task.title
                  )}

                  <span
                    class="float-end text-muted"
                  >
                    ${
                      task.dueTime ||
                      ""
                    }
                  </span>

                </div>
                `
            )
            .join("")

        :

          `
          <p
            class="text-muted small"
          >
            No tasks scheduled
            for this date.
          </p>
          `

    );

}


/* =====================================================
   POMODORO TIMER
   ===================================================== */

function setupTimer() {

  $("timerStart")
    .addEventListener(
      "click",
      startTimer
    );


  $("timerPause")
    .addEventListener(
      "click",
      pauseTimer
    );


  $("timerReset")
    .addEventListener(
      "click",
      resetTimer
    );

}


/* ================= UPDATE TIMER ================= */

function updateTimer() {

  const minutes =
    Math.floor(
      timerSeconds / 60
    );


  const seconds =
    timerSeconds % 60;


  $("timerDisplay")
    .textContent =

    `${String(
      minutes
    ).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;

}


/* ================= START ================= */

function startTimer() {

  if (timerInterval) {
    return;
  }


  timerInterval =
    setInterval(
      () => {

        timerSeconds--;

        updateTimer();


        if (
          timerSeconds <= 0
        ) {

          pauseTimer();


          toast(
            "Focus session complete! Take a break. 🎉",
            "success"
          );


          if (
            "Notification" in window &&
            Notification.permission ===
              "granted"
          ) {

            new Notification(
              "TaskFlow Focus",
              {
                body:
                  "Focus session complete. Take a short break!"
              }
            );

          }

        }

      },
      1000
    );

}


/* ================= PAUSE ================= */

function pauseTimer() {

  clearInterval(
    timerInterval
  );

  timerInterval =
    null;

}


/* ================= RESET ================= */

function resetTimer() {

  pauseTimer();

  timerSeconds =
    25 * 60;

  updateTimer();

}


/* =====================================================
   TOAST
   ===================================================== */

function toast(
  message,
  type = "success"
) {

  const element =
    document.createElement(
      "div"
    );


  element.className =
    "toast align-items-center show mb-2";


  element.innerHTML =

    `
    <div class="d-flex">

      <div class="toast-body">
        ${escapeHTML(
          message
        )}
      </div>

      <button
        class="btn-close me-2 m-auto"
        data-bs-dismiss="toast"
      ></button>

    </div>
    `;


  $("toastContainer")
    .appendChild(
      element
    );


  setTimeout(
    () =>
      element.remove(),
    3500
  );

}