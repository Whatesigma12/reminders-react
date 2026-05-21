import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "reminders-react";
const priorities = ["Низкий", "Средний", "Высокий"];

function App() {
  const [tasks, setTasks] = useState(() => loadTasks());
  const [form, setForm] = useState({
    text: "",
    topic: "",
    date: "",
    priority: "Низкий",
    subtasks: "",
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.toLowerCase().trim();

    return tasks.filter((task) => {
      const subtasksText = task.subtasks.map((subtask) => subtask.text).join(" ").toLowerCase();
      const matchesSearch =
        query === "" ||
        task.text.toLowerCase().includes(query) ||
        task.topic.toLowerCase().includes(query) ||
        subtasksText.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !task.completed) ||
        (statusFilter === "completed" && task.completed);

      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      active: tasks.filter((task) => !task.completed).length,
      completed: tasks.filter((task) => task.completed).length,
    }),
    [tasks]
  );

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addTask(event) {
    event.preventDefault();

    const text = form.text.trim();
    const topic = form.topic.trim();

    if (!text) {
      alert("Введите задачу");
      return;
    }

    if (!topic) {
      alert("Введите тему задачи");
      return;
    }

    const subtasks = form.subtasks
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => ({
        id: crypto.randomUUID(),
        text: item,
        completed: false,
      }));

    const newTask = {
      id: crypto.randomUUID(),
      text,
      topic,
      date: form.date,
      priority: form.priority,
      completed: false,
      subtasks,
    };

    setTasks((current) => [newTask, ...current]);
    setForm({ text: "", topic: "", date: "", priority: "Низкий", subtasks: "" });
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function editTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    const newText = prompt("Изменить задачу:", task.text);
    if (newText === null || newText.trim() === "") return;

    const newTopic = prompt("Изменить тему:", task.topic);
    if (newTopic === null || newTopic.trim() === "") return;

    const newDate = prompt("Изменить дату в формате ГГГГ-ММ-ДД:", task.date || "");
    if (newDate === null) return;

    setTasks((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              text: newText.trim(),
              topic: newTopic.trim(),
              date: newDate.trim(),
            }
          : item
      )
    );
  }

  function addSubtask(taskId, text) {
    const value = text.trim();

    if (!value) {
      alert("Введите текст подзадачи");
      return;
    }

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [
                ...task.subtasks,
                { id: crypto.randomUUID(), text: value, completed: false },
              ],
            }
          : task
      )
    );
  }

  function toggleSubtask(taskId, subtaskId) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.id === subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              ),
            }
          : task
      )
    );
  }

  function deleteSubtask(taskId, subtaskId) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId),
            }
          : task
      )
    );
  }

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">React + Vite</p>
        <h1>Напоминания React</h1>
        <p className="subtitle">
          Менеджер задач с темами, датами, подзадачами, поиском, фильтрами и сохранением в LocalStorage.
        </p>
      </section>

      <TaskForm form={form} onChange={updateForm} onSubmit={addTask} />

      <Toolbar
        search={search}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onSearch={setSearch}
        onStatusFilter={setStatusFilter}
        onPriorityFilter={setPriorityFilter}
      />

      <Stats stats={stats} />

      <TaskList
        tasks={filteredTasks}
        onToggle={toggleTask}
        onDelete={deleteTask}
        onEdit={editTask}
        onAddSubtask={addSubtask}
        onToggleSubtask={toggleSubtask}
        onDeleteSubtask={deleteSubtask}
      />
    </main>
  );
}

function TaskForm({ form, onChange, onSubmit }) {
  return (
    <form className="panel task-form" onSubmit={onSubmit}>
      <div className="field field-wide">
        <label htmlFor="taskInput">Задача</label>
        <input
          id="taskInput"
          type="text"
          value={form.text}
          onChange={(event) => onChange("text", event.target.value)}
          placeholder="Например: подготовить отчет по практике"
        />
      </div>

      <div className="field">
        <label htmlFor="topicInput">Тема</label>
        <input
          id="topicInput"
          type="text"
          value={form.topic}
          onChange={(event) => onChange("topic", event.target.value)}
          placeholder="Учеба, дом, работа..."
        />
      </div>

      <div className="field">
        <label htmlFor="dateInput">Дата события</label>
        <input
          id="dateInput"
          type="date"
          value={form.date}
          onChange={(event) => onChange("date", event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="prioritySelect">Приоритет</label>
        <select
          id="prioritySelect"
          value={form.priority}
          onChange={(event) => onChange("priority", event.target.value)}
        >
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>

      <div className="field field-wide">
        <label htmlFor="subtasksInput">Подзадачи</label>
        <input
          id="subtasksInput"
          type="text"
          value={form.subtasks}
          onChange={(event) => onChange("subtasks", event.target.value)}
          placeholder="Через запятую: найти источники, написать текст, проверить оформление"
        />
      </div>

      <button className="primary-btn" type="submit">
        Добавить напоминание
      </button>
    </form>
  );
}

function Toolbar({ search, statusFilter, priorityFilter, onSearch, onStatusFilter, onPriorityFilter }) {
  return (
    <section className="panel toolbar">
      <div className="field field-wide">
        <label htmlFor="searchInput">Поиск</label>
        <input
          id="searchInput"
          type="text"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Искать по задаче, теме или подзадачам..."
        />
      </div>

      <div className="field">
        <label htmlFor="filterSelect">Статус</label>
        <select
          id="filterSelect"
          value={statusFilter}
          onChange={(event) => onStatusFilter(event.target.value)}
        >
          <option value="all">Все</option>
          <option value="active">Активные</option>
          <option value="completed">Выполненные</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="priorityFilter">Приоритет</label>
        <select
          id="priorityFilter"
          value={priorityFilter}
          onChange={(event) => onPriorityFilter(event.target.value)}
        >
          <option value="all">Любой</option>
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

function Stats({ stats }) {
  return (
    <section className="stats">
      <div className="stat-card">
        <span>{stats.total}</span>
        <p>всего</p>
      </div>
      <div className="stat-card">
        <span>{stats.active}</span>
        <p>активных</p>
      </div>
      <div className="stat-card">
        <span>{stats.completed}</span>
        <p>выполнено</p>
      </div>
    </section>
  );
}

function TaskList({
  tasks,
  onToggle,
  onDelete,
  onEdit,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) {
  if (tasks.length === 0) {
    return <p className="empty-message visible">Пока нет напоминаний. Добавьте первое событие выше.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          onDeleteSubtask={onDeleteSubtask}
        />
      ))}
    </ul>
  );
}

function TaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) {
  const [newSubtask, setNewSubtask] = useState("");

  function submitSubtask(event) {
    event.preventDefault();
    onAddSubtask(task.id, newSubtask);
    setNewSubtask("");
  }

  return (
    <li className={`task ${task.completed ? "completed" : ""}`}>
      <div className="task-header">
        <div className="task-main">
          <input
            className="task-checkbox"
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
          />
          <div>
            <div className="task-title">{task.text}</div>
            <div className="meta">
              <span className="badge topic">Тема: {task.topic}</span>
              <span className="badge date">Дата: {task.date ? formatDate(task.date) : "Без даты"}</span>
              <span className={`badge ${getPriorityClass(task.priority)}`}>{task.priority}</span>
            </div>
          </div>
        </div>

        <div className="actions">
          <button className="small-btn edit-btn" type="button" onClick={() => onEdit(task.id)}>
            Изменить
          </button>
          <button className="small-btn delete-btn" type="button" onClick={() => onDelete(task.id)}>
            Удалить
          </button>
        </div>
      </div>

      <div className="subtasks">
        {task.subtasks.length === 0 ? (
          <p className="empty-subtasks">Подзадач пока нет.</p>
        ) : (
          task.subtasks.map((subtask) => (
            <div key={subtask.id} className={`subtask ${subtask.completed ? "done" : ""}`}>
              <div className="subtask-left">
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => onToggleSubtask(task.id, subtask.id)}
                />
                <span>{subtask.text}</span>
              </div>
              <button
                className="remove-subtask"
                type="button"
                onClick={() => onDeleteSubtask(task.id, subtask.id)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <form className="subtask-form" onSubmit={submitSubtask}>
        <input
          type="text"
          value={newSubtask}
          onChange={(event) => setNewSubtask(event.target.value)}
          placeholder="Добавить подзадачу..."
        />
        <button className="add-subtask-btn small-btn" type="submit">
          Добавить
        </button>
      </form>
    </li>
  );
}

function loadTasks() {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) return [];

  try {
    return JSON.parse(data).map((task) => ({
      ...task,
      topic: task.topic || task.category || "Без темы",
      date: task.date || "",
      subtasks: task.subtasks || [],
    }));
  } catch {
    return [];
  }
}

function getPriorityClass(priority) {
  if (priority === "Низкий") return "priority-low";
  if (priority === "Средний") return "priority-medium";
  if (priority === "Высокий") return "priority-high";
  return "";
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("ru-RU");
}

export default App;
