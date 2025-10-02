let tasks = JSON.parse(localStorage.getItem('tasks') || "[]");
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function addTask() {
  const title = document.getElementById('taskTitle').value.trim();
  const due = document.getElementById('taskDue').value;
  if(title && due) {
    tasks.push({title, due, completed:false});
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDue').value = '';
    saveTasks();
    renderTasks();
    renderCalendar();
    renderSummary();
    renderWeeklyProgress();
    renderMonthlyProgress();
    if(window.updateProfileProgress) updateProfileProgress();
  } else {
    alert("Task title and due date/time required.");
  }
}

function deleteTask(i) {
  tasks.splice(i, 1);
  saveTasks();
  renderTasks();
  renderCalendar();
  renderSummary();
  renderWeeklyProgress();
  renderMonthlyProgress();
  if(window.updateProfileProgress) updateProfileProgress();
}

function editTask(i) {
  let newTitle = prompt("Edit task title:", tasks[i].title);
  if (newTitle !== null && newTitle.trim() !== "") {
    tasks[i].title = newTitle.trim();
  }
  let newDue = prompt("Edit due date/time ('yyyy-mm-ddThh:mm'):", tasks[i].due);
  if (newDue !== null && newDue.trim() !== "" ) {
    tasks[i].due = newDue.trim();
  }
  saveTasks();
  renderTasks();
  renderCalendar();
  renderSummary();
  renderWeeklyProgress();
  renderMonthlyProgress();
  if(window.updateProfileProgress) updateProfileProgress();
}

function toggleComplete(i) {
  tasks[i].completed = !tasks[i].completed;
  saveTasks();
  renderTasks();
  renderSummary();
  renderWeeklyProgress();
  renderMonthlyProgress();
  if(window.updateProfileProgress) updateProfileProgress();
}

function renderTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = '';
  tasks.forEach((task, i) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.innerHTML = `
      <span>${task.title} <small>(${new Date(task.due).toLocaleString()})</small></span>
      <div>
        <button onclick="toggleComplete(${i})">${task.completed ? 'Undo' : 'Done'}</button>
        <button onclick="editTask(${i})">Edit</button>
        <button onclick="deleteTask(${i})">Delete</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function changeCalendarMonth(delta) {
  calendarMonth += delta;
  if(calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear--;
  } else if(calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear++;
  }
  renderCalendar();
}

function renderCalendar() {
  const calendarDiv = document.getElementById('calendar');
  const currMonthSpan = document.getElementById('calendarCurrentMonth');
  const year = calendarYear;
  const month = calendarMonth;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month+1, 0);
  
  currMonthSpan.textContent = `${firstDay.toLocaleString('default', { month: 'long' })} ${year}`;

  let html = `<table>`;
  html += '<tr>';
  for(let d=0; d<7; d++) {
    html += "<th>" + ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d] + "</th>";
  }
  html += '</tr><tr>';
  for(let i=0;i<firstDay.getDay();i++) html += '<td></td>';
  const today = new Date();
  const isSameMonthYear = (today.getFullYear()===year && today.getMonth()===month);
  for(let date=1; date<=lastDay.getDate(); date++) {
    let dayTasks = tasks.filter(t => {
      let dueDate = new Date(t.due);
      return dueDate.getFullYear()===year && dueDate.getMonth()===month && dueDate.getDate()===date;
    });
    let classes = [];
    if(isSameMonthYear && date === today.getDate()) classes.push('today');
    if(dayTasks.length > 0) classes.push('has-task');
    html += `<td class="${classes.join(' ')}">${date}`;
    if(dayTasks.length > 0){
      html += `<ul style="list-style:disc inside;padding-left:0">`;
      dayTasks.forEach(t=>{
        html+=`<li>${t.title}</li>`;
      });
      html+='</ul>';
    }
    html += '</td>';
    if((firstDay.getDay()+date)%7===0) html += '</tr><tr>';
  }
  html += '</tr></table>';
  calendarDiv.innerHTML = html;
}

function renderWeeklyProgress() {
  const ctx = document.getElementById('weeklyProgress').getContext('2d');
  const now = new Date(), weekStart = new Date(now.getFullYear(),now.getMonth(),now.getDate()-now.getDay());
  let daily = Array(7).fill(0);
  tasks.forEach(t=>{
    let due = new Date(t.due);
    if (due >= weekStart && due <= new Date(weekStart.getFullYear(),weekStart.getMonth(),weekStart.getDate()+6)) {
      daily[due.getDay()]++;
    }
  });
  if(window.weeklyChart) window.weeklyChart.destroy();
  window.weeklyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
      datasets: [{
        label: 'Tasks Due',
        data: daily,
        backgroundColor: '#154c79'
      }]
    }
  });
}

function renderMonthlyProgress() {
  const ctx = document.getElementById('monthlyProgress').getContext('2d');
  const now = new Date();
  let monthly = Array(4).fill(0);
  tasks.forEach(t=>{
    let due = new Date(t.due);
    if(due.getMonth() === now.getMonth()) {
      let week = Math.floor((due.getDate()-1)/7);
      monthly[week]++;
    }
  });
  if(window.monthlyChart) window.monthlyChart.destroy();
  window.monthlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Week 1','Week 2','Week 3','Week 4'],
      datasets: [{
        label: 'Tasks Due',
        data: monthly,
        borderColor: '#154c79',
        backgroundColor: '#a5e5fc'
      }]
    }
  });
}

function renderSummary() {
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()-now.getDay());
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()+6);
  const weekTasks = tasks.filter(t=>{
    let due = new Date(t.due);
    return due>=weekStart && due<=weekEnd;
  });
  const weekDone = weekTasks.filter(t=>t.completed).length;

  const monthTasks = tasks.filter(t=> {
    let due = new Date(t.due);
    return due.getMonth()===now.getMonth() && due.getFullYear()===now.getFullYear();
  });
  const monthDone = monthTasks.filter(t=>t.completed).length;

  document.getElementById('summary').innerHTML = `
    <p><strong>This Week:</strong> Total tasks: ${weekTasks.length}, Completed: ${weekDone}</p>
    <p><strong>This Month:</strong> Total tasks: ${monthTasks.length}, Completed: ${monthDone}</p>
  `;
}

window.getProfileStats = function() {
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()-now.getDay());
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()+6);
  const weekTasks = tasks.filter(t=>{
    let due = new Date(t.due);
    return due>=weekStart && due<=weekEnd;
  });
  const weekDone = weekTasks.filter(t=>t.completed).length;

  const monthTasks = tasks.filter(t=> {
    let due = new Date(t.due);
    return due.getMonth()===now.getMonth() && due.getFullYear()===now.getFullYear();
  });
  const monthDone = monthTasks.filter(t=>t.completed).length;

  return {
    week: { total: weekTasks.length, completed: weekDone },
    month: { total: monthTasks.length, completed: monthDone }
  };
};

window.onload = () => {
  if(document.getElementById('taskList')){
    renderTasks();
    renderCalendar();
    renderSummary();
    renderWeeklyProgress();
    renderMonthlyProgress();
    if(window.updateProfileProgress) updateProfileProgress();
  }
};
