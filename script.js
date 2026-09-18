// Використовуємо надійні CDN посилання, які не блокуються політикою CORS
import { initializeApp } from "https://gstatic.com";
import { getFirestore, doc, setDoc, getDoc } from "https://gstatic.com";



// 2. Конфігурація твого проєкту Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDXWLekBLETz6Y7nMyi5iqFAlME-AnjJUc",
  authDomain: "://firebaseapp.com",
  projectId: "todolist-c473c",
  storageBucket: "todolist-c473c.firebasestorage.app",
  messagingSenderId: "399560354449",
  appId: "1:399560354449:web:a0ab35a21328c79ba56d30",
  measurementId: "G-VMQGWYC1Z4",
};

// 3. Ініціалізація Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. Знаходимо всі потрібні елементи на HTML-сторінці
const done = document.getElementById("doneCount");
const total = document.getElementById("totalCount");

const text = document.getElementById("taskTitle");
const time = document.getElementById("taskTime");
const date = document.getElementById("taskDate");
const select = document.getElementById("taskPriority");
const form = document.getElementById("taskForm");
const list = document.getElementById("taskList");

// 5. Головний масив, де зберігаються всі наші завдання
let tasks = [];

// 6. Функція для синхронізації (одночасно зберігає в LocalStorage і в Firebase)
async function syncData(tasksArray) {
  // Зберігаємо в браузері
  localStorage.setItem("tasksData", JSON.stringify(tasksArray));
  
  // Оновлюємо лічильники на екрані
  updateCounters();

  // Відправляємо в хмару Firebase
  try {
    await setDoc(doc(db, "tasks", "allTasks"), { items: tasksArray });
    console.log("☁️ Дані успішно синхронізовано з Firebase");
  } catch (error) {
    console.warn("⚠️ Помилка запису у Firebase", error);
  }
}

// 7. Функція для підрахунку виконаних та загальних завдань
function updateCounters() {
  const totalCount = tasks.length;
  const doneCount = tasks.filter(t => t.isDone).length;
  
  total.textContent = totalCount;
  done.textContent = doneCount;
}

// 8. Допоміжна функція для швидкого створення HTML-елементів
function createChild(clas, text, parent, tagName = "div") {
  const el = document.createElement(tagName);
  el.className = clas;
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

// 9. Головна функція, яка створює картку завдання на екрані
function renderTask(item) {
  let task = document.createElement("div");
  
  // Визначаємо пріоритет (high, medium, low) і додаємо класи для CSS
  let priorityClass = `priority-${item.priority}`;
  task.className = `task-item ${priorityClass}`;
  
  // Прив'язуємо унікальний ID до картки
  task.dataset.id = item.id;

  // Якщо завдання вже виконане — додаємо клас done
  if (item.isDone) {
    task.classList.add("done");
  }

  // Наповнюємо картку текстом, датою та часом
  createChild("task-title", item.task, task);
  createChild("task-date", item.date, task);
  createChild("task-time", item.time, task);

  // Створюємо блок кнопок дії
  let taskActions = document.createElement("div");
  taskActions.classList = "task-actions";

  let doneBtn = createChild("btn-done", "✓", taskActions, "button");
  let deleteBtn = createChild("btn-delete", "🗑", taskActions, "button");

  task.appendChild(taskActions);

  // Логіка кнопки "Виконано" (✓)
  doneBtn.addEventListener("click", function () {
    if (!task.classList.contains("done")) {
      task.classList.add("done");
      
      // Знаходимо це завдання в масиві та міняємо статус на true
      const targetTask = tasks.find(t => t.id === item.id);
      if (targetTask) targetTask.isDone = true;
      
      syncData(tasks);
    }
  });

  // Логіка кнопки "Видалити" (🗑)
  deleteBtn.addEventListener("click", function () {
    task.remove(); // Видаляємо візуально з екрану

    // Видаляємо з масиву
    tasks = tasks.filter(t => t.id !== item.id);
    
    syncData(tasks);
  });

  list.appendChild(task);
}

// =======================================================
// 🔄 10. БЛОК АВТОМАТИЧНОГО ВІДНОВЛЕННЯ ДАНИХ ДЛЯ ДЗ
// =======================================================

// Спочатку миттєво завантажуємо дані з LocalStorage (якщо вони там є)
let localData = JSON.parse(localStorage.getItem("tasksData")) || [];
if (localData.length > 0) {
  tasks = [...localData];
  tasks.forEach(item => renderTask(item));
  updateCounters();
}

// Функція, яка автоматично перевіряє Firebase на наявність даних
async function checkCloudData() {
  try {
    const docRef = doc(db, "tasks", "allTasks");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().items) {
      const cloudTasks = docSnap.data().items;

      // ЯКЩО КЕШ ОЧИЩЕНО (в браузері 0 тасок, а в хмарі Firebase дані є)
      if (tasks.length === 0 && cloudTasks.length > 0) {
        showRestoreBanner(cloudTasks);
      } 
      // АБО якщо користувач просто зайшов з іншого пристрою чи дані оновилися
      else if (JSON.stringify(tasks) !== JSON.stringify(cloudTasks)) {
        tasks = cloudTasks;
        list.innerHTML = ""; 
        tasks.forEach(item => renderTask(item));
        updateCounters();
        localStorage.setItem("tasksData", JSON.stringify(tasks));
        console.log("🔥 Синхронізовано з хмарою автоматично!");
      }
    }
  } catch (error) {
    console.error("Помилка перевірки Firebase:", error);
  }
}

// Функція, яка показує повідомлення з кнопкою для відновлення даних
function showRestoreBanner(cloudTasks) {
  const banner = document.createElement("div");
  banner.style.cssText = `
    background: #e3f2fd;
    color: #0d47a1;
    padding: 15px;
    border-radius: 15px;
    text-align: center;
    margin-bottom: 20px;
    border: 1px solid #bbdefb;
    font-weight: 600;
  `;
  banner.innerHTML = `
    <span>☁️ Знайдено збережені завдання у хмарі Firebase (${cloudTasks.length} шт.)</span>
    <button id="btnRestore" style="
      margin-left: 15px; 
      padding: 6px 15px; 
      background: #1976d2; 
      color: white; 
      border: none; 
      border-radius: 8px; 
      cursor: pointer;
      font-weight: bold;
    ">Відновити дані</button>
  `;

  // Вставляємо банер на сторінку перед списком завдань
  list.parentNode.insertBefore(banner, list);

  // Клік на кнопку "Відновити дані"
  document.getElementById("btnRestore").addEventListener("click", () => {
    tasks = cloudTasks;
    list.innerHTML = ""; // Прибираємо напис про пустий екран
    tasks.forEach(item => renderTask(item)); // Малюємо відновлені таски
    updateCounters();
    localStorage.setItem("tasksData", JSON.stringify(tasks)); // Рятуємо в кеш браузера
    banner.remove(); // Видаляємо банер
    console.log("✅ Дані успішно відновлено з хмарою!");
  });
}

// Запускаємо перевірку хмари відразу при завантаженні сторінки
checkCloudData();

// =======================================================
// ➕ 11. ОБРОБНИК ФОРМИ (ДОДАВАННЯ НОВОГО ЗАВДАННЯ)
// =======================================================
form.addEventListener("submit", function (event) {
  event.preventDefault(); // Щоб сторінка не перезавантажувалась

  // Створюємо правильний об'єкт завдання з унікальним ID
  const newTask = {
    id: String(Date.now()), 
    task: text.value,
    date: date.value,
    time: time.value,
    priority: select.value, 
    isDone: false
  };

  tasks.push(newTask); // Додаємо в масив
  renderTask(newTask); // Малюємо на екрані

  // Очищаємо поля форми після додавання
  text.value = "";
  date.value = "";
  time.value = "";

  // Зберігаємо і в LocalStorage, і в Firebase
  syncData(tasks);
});
