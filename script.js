document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const SECONDS_PER_BOX = 21600; // 25 minutes
    const TOTAL_BOXES = 24;
    const QUOTES = [
        "The only way to do great work is to love what you do.", "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "Believe you can and you're halfway there.", "The secret of getting ahead is getting started.", "It does not matter how slowly you go as long as you do not stop.",
        "The future belongs to those who believe in the beauty of their dreams.", "Well done is better than well said.", "You are the master of your destiny.",
        "Strive for progress, not perfection.", "The expert in anything was once a beginner.", "The journey of a thousand miles begins with a single step.",
        "Either you run the day or the day runs you.", "Your limitation is only your imagination.", "Push yourself, because no one else is going to do it for you.",
        "Great things never come from comfort zones.", "Dream it. Wish it. Do it.", "Success doesn’t just find you. You have to go out and get it.",
        "The harder you work for something, the greater you’ll feel when you achieve it.", "Dream bigger. Do bigger.", "Don’t stop when you’re tired. Stop when you’re done.",
        "Wake up with determination. Go to bed with satisfaction.", "Do something today that your future self will thank you for.",
        "Little things make big days.", "It’s going to be hard, but hard does not mean impossible."
    ];

    // --- DOM ELEMENTS ---
    const timerDisplay = document.getElementById('timer-display');
    const totalTimeDisplay = document.getElementById('total-time');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const resetBtn = document.getElementById('reset-btn'); 
    resetBtn.addEventListener('click', resetProgress);
    const grid = document.getElementById('calendar-grid');
    const progressBar = document.getElementById('progress-bar');
    const overlay = document.querySelector('.overlay');

    // --- STATE MANAGEMENT ---
    let totalSeconds = 0;
    let timerInterval = null;
    let completedBoxes = new Set();

    // --- TIMER LOGIC ---
    function startTimer() {
        if (timerInterval) return;
        startBtn.textContent = 'Running...';
        timerInterval = setInterval(() => {
            totalSeconds++;
            updateUI();
            saveProgress();
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        startBtn.textContent = 'Start';
    }

    function resetProgress() {
        // 1. Stop the timer if it's running.
        stopTimer();

        // 2. Ask the user to confirm, as this is a destructive action.
        const isConfirmed = confirm("Are you sure you want to reset all your progress? This cannot be undone.");

        if (isConfirmed) {
            // 3. Reset the state variables.
            totalSeconds = 0;
            completedBoxes.clear();

            // 4. Remove the saved data from the browser's storage.
            localStorage.removeItem('adventCalendarProgress');

            // 5. Update the UI to reflect the reset state.
            updateUI();
            
            console.log("Progress has been reset.");
        }
    }

    // --- UI UPDATES ---
    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function updateUI() {
        timerDisplay.textContent = formatTime(totalSeconds);
        totalTimeDisplay.textContent = totalSeconds;
        updateBoxes();
        updateProgressBar();
        const pendingCount = calculatePendingBoxes();
        document.getElementById('pending-rewards-count').textContent = pendingCount;
    }

    function updateProgressBar() {
        const unlockedCount = calculateUnlockedBoxes(totalSeconds);
        const nextBoxTime = (unlockedCount + 1) * SECONDS_PER_BOX;
        const prevBoxTime = unlockedCount * SECONDS_PER_BOX;
        const progress = (totalSeconds - prevBoxTime) / (nextBoxTime - prevBoxTime) * 100;
        progressBar.style.width = `${Math.min(progress, 100)}%`;
    }

    // --- BOX LOGIC ---
    function calculateUnlockedBoxes(seconds) {
        return Math.floor(seconds / SECONDS_PER_BOX);
    }

    function calculatePendingBoxes() {
        // 1. Calculate the total number of boxes earned from study time.
        const earnedCount = calculateUnlockedBoxes(totalSeconds);
        
        // 2. Get the number of boxes that have already been opened and completed.
        const openedCount = completedBoxes.size;
        
        // 3. The difference is the number of rewards waiting to be opened.
        const pendingCount = earnedCount - openedCount;
        
        // Ensure the count is never negative.
        return Math.max(0, pendingCount);
    }

    // THIS IS THE CORRECTED FUNCTION
    // THIS IS THE CORRECTED FUNCTION
    function updateBoxes() {
        // How many boxes has the user earned with their time?
        const unlockedCount = calculateUnlockedBoxes(totalSeconds);

        const boxes = document.querySelectorAll('.box');
        boxes.forEach((box, index) => {
            const boxId = index + 1;

            // Clear previous state classes
            box.classList.remove('locked', 'unlocked', 'completed');

            // Condition 1: If the box is already completed, mark it as such.
            if (completedBoxes.has(boxId.toString())) {
                box.classList.add('completed');
            
            // Condition 2: If the box's number is less than or equal to the earned count...
            } else if (boxId <= unlockedCount) {
                // ...it is available to be opened.
                box.classList.add('unlocked');
            
            // Condition 3: Otherwise, it remains locked.
            } else {
                box.classList.add('locked');
            }
        });
    }

    function handleBoxClick(event) {
        const box = event.currentTarget;
        if (box.classList.contains('locked') || box.classList.contains('completed') || document.querySelector('.box--maximized')) {
            return;
        }
        box.classList.add('box--maximized');
        overlay.classList.add('active');
    }

    function handleCompletion(event) {
        const maximizedBox = document.querySelector('.box--maximized');
        if (maximizedBox) {
            const boxId = maximizedBox.dataset.id;
            completedBoxes.add(boxId);
            maximizedBox.classList.remove('box--maximized');
            maximizedBox.classList.add('completed');
            overlay.classList.remove('active');
            saveProgress();
        }
        event.stopPropagation();
    }

    // --- DATA PERSISTENCE ---
    function saveProgress() {
        const data = {
            totalSeconds: totalSeconds,
            completedBoxes: Array.from(completedBoxes)
        };
        localStorage.setItem('adventCalendarProgress', JSON.stringify(data));
    }

    function loadProgress() {
        const data = JSON.parse(localStorage.getItem('adventCalendarProgress'));
        if (data) {
            totalSeconds = data.totalSeconds || 0;
            completedBoxes = new Set(data.completedBoxes || []);
        }
        updateUI();
    }

    // --- DEBUG HELPER FUNCTION ---
    function addTestTime(hours) {
        const secondsToAdd = hours * 3600;
        totalSeconds += secondsToAdd;
        console.log(`Added ${hours} hours. New total seconds: ${totalSeconds}`);
        updateUI();
        saveProgress();
    }

    // --- INITIALIZATION ---
    function initialize() {
        const sizeWeights = [
            'size-normal', 'size-normal', 'size-normal', 'size-normal', 'size-normal',
            'size-wide', 'size-tall'
        ];

        for (let i = 1; i <= TOTAL_BOXES; i++) {
            const box = document.createElement('div');
            box.dataset.id = i;
            box.classList.add('box', 'locked');

            const randomSizeClass = sizeWeights[Math.floor(Math.random() * sizeWeights.length)];
            box.classList.add(randomSizeClass);

            const label = document.createElement('span');
            label.classList.add('box-label');
            label.textContent = i;
            
            const content = document.createElement('div');
            content.classList.add('box-content');
            content.innerHTML = `
                <h2>Day ${i} Reward!</h2>
                <p>"${QUOTES[i-1]}"</p>
                <button class="complete-btn">Mark as Done</button>
            `;
            
            box.appendChild(label);
            box.appendChild(content);
            grid.appendChild(box);

            box.addEventListener('click', handleBoxClick);
        }
        
        document.addEventListener('click', function(event) {
            if (event.target && event.target.classList.contains('complete-btn')) {
                handleCompletion(event);
            }
        });
        
        startBtn.addEventListener('click', startTimer);
        stopBtn.addEventListener('click', stopTimer);
        
        loadProgress();
    }

    initialize();
    
    // --- DEBUG HELPERS (Expose to Console) ---
    window.addTestTime = addTestTime;
    window.updateUI = updateUI;
    window.setTotalSeconds = (seconds) => {
        totalSeconds = seconds;
        console.log(`totalSeconds has been set to ${totalSeconds}`);
    };
});