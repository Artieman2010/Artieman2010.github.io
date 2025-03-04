///setInterval(() => {
// Handle goose toggle button click

  

//}, 1000);

// ...existing code...


    document.querySelectorAll('.next-btn').forEach(button => {
        button.addEventListener('click', () => {
            const nextQuestionId = button.getAttribute('data-next');
            
            // Check if goose is disabled (skip to blocking)
            if (nextQuestionId === '2') {
                const isGooseEnabled = document.getElementById('toggle-goose').checked;
                if (!isGooseEnabled) {
                    showNextQuestion('7', button.closest('.question'));
                    document.querySelector('#question-7 h2').textContent = 'Step 2: Website Blocking';
                    document.querySelector('#question-8 h2').textContent = 'Website Blocking Setup';
                    return;
                }
            }

            // Check if memes are disabled
            if (nextQuestionId === '3') {
                const isMemesEnabled = document.getElementById('toggle-memes').checked;
                console.log('Memes toggle is:', isMemesEnabled); // Debug log
                if (!isMemesEnabled) {
                    showNextQuestion('6', button.closest('.question')); // Go to goals instead of blocking
                    document.querySelector('#question-6 h2').textContent = 'Step 2: Goals';
                    document.querySelector('#question-7 h2').textContent = 'Step 3: Website Blocking';
                    document.querySelector('#question-8 h2').textContent = 'Website Blocking Setup';
                    return;
                }
            }

            // Check if blocking is enabled
            if (nextQuestionId === '8') {
                const isBlockingEnabled = document.getElementById('toggle-blocking').checked;
                if (!isBlockingEnabled) {
                    completeSetup();
                    return;
                }
            }

            showNextQuestion(nextQuestionId, button.closest('.question'));
        });
    });

    document.querySelectorAll('.prev-btn').forEach(button => {
        button.addEventListener('click', () => {
            const prevQuestionId = button.getAttribute('data-prev');
            showPreviousQuestion(prevQuestionId);
        });
    });

    // Initialize goals functionality (without auto-adding)
    const addGoalButton = document.getElementById('add-goal');
    if (addGoalButton) {
        addGoalButton.addEventListener('click', () => {
            const goal = {
                id: Date.now(),
                content: 'New Goal',
                interval: 60,
                lastShown: 0
            };

            chrome.storage.local.get(['goals'], (result) => {
                const goals = result.goals || [];
                goals.push(goal);
                chrome.storage.local.set({ goals }, () => {
                    renderGoal(goal, true);
                });
            });
        });
    }

    // Move complete setup button listener here
    const completeButton = document.querySelector('.complete-setup-btn');
    if (completeButton) {
        completeButton.addEventListener('click', completeSetup);
    }

    function renderGoal(goal, isNew = false) {
        const goalsList = document.getElementById('goals-list');
        if (!goalsList) return;

        const li = document.createElement('li');
        li.className = 'goal-item';
        li.dataset.id = goal.id;


        const intervalWrapper = document.createElement('div');
        intervalWrapper.className = 'interval-wrapper';
        intervalWrapper.appendChild(intervalLabel);
        intervalWrapper.appendChild(interval);
        intervalWrapper.appendChild(secondsLabel);

        li.appendChild(contentLabel);
        li.appendChild(content);
        li.appendChild(intervalWrapper);

        goalsList.appendChild(li);

        if (isNew) {
            content.focus();
            document.execCommand('selectAll', false, null);
        }

        content.addEventListener('blur', () => {
            updateGoal(goal.id, content.textContent, parseInt(interval.value));
        });

        interval.addEventListener('change', () => {
            if (interval.value < 10) interval.value = 10;
            updateGoal(goal.id, content.textContent, parseInt(interval.value));
        });
    }

    function updateGoal(id, content, interval) {
        chrome.storage.local.get(['goals'], (result) => {
            const goals = result.goals || [];
            const index = goals.findIndex(g => g.id === id);
            if (index !== -1) {
                goals[index].content = content;
                goals[index].interval = interval;
                chrome.storage.local.set({ goals });
            }
        });
    }


function showNextQuestion(nextQuestionId, currentQuestionEl) {
    currentQuestionEl.style.display = 'none';
    document.getElementById('question-' + nextQuestionId).style.display = 'block';
}

function showPreviousQuestion(prevQuestionId) {
    const currentQuestion = document.querySelector('.question:not([style*="display: none"])');
    currentQuestion.style.display = 'none';
    document.getElementById('question-' + prevQuestionId).style.display = 'block';
}

function completeSetup() {
    chrome.storage.local.get(['goals', 'blockedSites'], (result) => {
        // Save any final settings
        window.location.href = 'setup-complete.html';
    });
}


