class TasksList {
    constructor(bingoBoard) {
        this.bingoBoard = bingoBoard;
        this.tasks = [];
        this.loadTasks();
    }

    async loadTasks() {
        const response = await fetch('./data/tasks.json');
        this.tasks = await response.json();
        this.renderTasks();
    }

    renderTasks() {
        const taskListContainer = document.getElementById('task-list');
        taskListContainer.innerHTML = '';

        this.tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-item');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = task.id;
            checkbox.addEventListener('change', () => this.handleCheckboxChange(task.id, checkbox.checked));

            const label = document.createElement('label');
            label.htmlFor = task.id;
            label.textContent = task.description;

            taskItem.appendChild(checkbox);
            taskItem.appendChild(label);
            taskListContainer.appendChild(taskItem);
        });
    }

    handleCheckboxChange(taskId, isChecked) {
        const tileIndex = this.tasks.findIndex(task => task.id === taskId);
        if (tileIndex !== -1) {
            this.bingoBoard.updateTileColor(tileIndex, isChecked);
        }
    }
}

export default TasksList;