// APP INITIALIZATION & AUDIO SYNTHESIZER
document.addEventListener('DOMContentLoaded', () => {
    // AUDIO CONTROLLER (Web Audio API)
    let audioCtx = null;
    let isSoundEnabled = true;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // Play a synthetic sound effect
    function playSound(type) {
        if (!isSoundEnabled) return;
        
        try {
            initAudio();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            const now = audioCtx.currentTime;

            if (type === 'click') {
                // Short organic click
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'operator' || type === 'sci') {
                // Higher pitched soft beep
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(550, now);
                osc.frequency.exponentialRampToValueAtTime(250, now + 0.1);
                gainNode.gain.setValueAtTime(0.06, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'success') {
                // Arpeggio chime
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                notes.forEach((freq, idx) => {
                    const noteOsc = audioCtx.createOscillator();
                    const noteGain = audioCtx.createGain();
                    noteOsc.connect(noteGain);
                    noteGain.connect(audioCtx.destination);
                    
                    noteOsc.type = 'sine';
                    noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    
                    noteGain.gain.setValueAtTime(0.05, now + idx * 0.08);
                    noteGain.gain.linearRampToValueAtTime(0, now + idx * 0.08 + 0.2);
                    
                    noteOsc.start(now + idx * 0.08);
                    noteOsc.stop(now + idx * 0.08 + 0.2);
                });
            } else if (type === 'fail') {
                // Sad slide down
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(80, now + 0.4);
                gainNode.gain.setValueAtTime(0.06, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            }
        } catch (e) {
            console.warn("Audio context not supported or blocked: ", e);
        }
    }

    // Sound toggle UI handling
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    const soundIconOn = soundToggleBtn.querySelector('.sound-icon-on');
    const soundIconOff = soundToggleBtn.querySelector('.sound-icon-off');
    const soundStatusText = soundToggleBtn.querySelector('span');

    soundToggleBtn.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        if (isSoundEnabled) {
            soundIconOn.classList.remove('hidden');
            soundIconOff.classList.add('hidden');
            soundStatusText.textContent = 'Efek Suara: Aktif';
            playSound('click');
        } else {
            soundIconOn.classList.add('hidden');
            soundIconOff.classList.remove('hidden');
            soundStatusText.textContent = 'Efek Suara: Nonaktif';
        }
    });


    // ==========================================================================
    // THEME SWITCHER LOGIC
    // ==========================================================================
    const themeMenuBtn = document.getElementById('theme-menu-btn');
    const themeDropdown = document.getElementById('theme-dropdown');
    const themeOptBtns = document.querySelectorAll('.theme-opt-btn');
    const activeThemeNameText = document.getElementById('active-theme-name');

    // Load theme from local storage
    const savedTheme = localStorage.getItem('calc_theme') || 'theme-obsidian';
    applyTheme(savedTheme);

    themeMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('click');
        themeDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        themeDropdown.classList.add('hidden');
    });

    themeOptBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            playSound('success');
            const targetTheme = btn.getAttribute('data-theme');
            applyTheme(targetTheme);
            themeDropdown.classList.add('hidden');
        });
    });

    function applyTheme(themeClass) {
        document.body.classList.remove('theme-obsidian', 'theme-alabaster', 'theme-amber');
        document.body.classList.add(themeClass);
        localStorage.setItem('calc_theme', themeClass);
        
        themeOptBtns.forEach(btn => {
            if (btn.getAttribute('data-theme') === themeClass) {
                btn.classList.add('active');
                activeThemeNameText.textContent = btn.textContent;
            } else {
                btn.classList.remove('active');
            }
        });
    }


    // ==========================================================================
    // MODE TOGGLER (STANDARD vs SCIENTIFIC)
    // ==========================================================================
    const appContainer = document.querySelector('.app-container');
    const calcContainer = document.getElementById('calc-container');
    const scientificPanel = document.getElementById('scientific-panel');
    const modeToggleBtn = document.getElementById('mode-toggle-btn');
    const modeText = document.getElementById('mode-text');
    
    let isScientific = false;
    let isRadian = true; // Radian vs Degree flag

    modeToggleBtn.addEventListener('click', () => {
        playSound('click');
        isScientific = !isScientific;
        
        if (isScientific) {
            appContainer.classList.add('scientific-active');
            calcContainer.classList.add('scientific-glow');
            scientificPanel.classList.remove('hidden');
            modeText.textContent = 'Mode Ilmiah';
            modeToggleBtn.querySelector('span').textContent = 'Standard Mode';
        } else {
            appContainer.classList.remove('scientific-active');
            calcContainer.classList.remove('scientific-glow');
            scientificPanel.classList.add('hidden');
            modeText.textContent = 'Mode Standar';
            modeToggleBtn.querySelector('span').textContent = 'Scientific Mode';
        }
    });


    // ==========================================================================
    // CALCULATOR ENGINE & STATE
    // ==========================================================================
    const calcScreen = document.getElementById('calc-screen');
    const calcExpr = document.getElementById('calc-expr');
    const toggleHistoryBtn = document.getElementById('toggle-history-btn');
    const calcHistoryDrawer = document.getElementById('calc-history-drawer');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const degRadBtn = document.getElementById('btn-deg-rad');

    let currentExpression = '';
    let isCalculated = false;
    let history = JSON.parse(localStorage.getItem('calc_scientific_history') || '[]');

    // Load History
    renderHistory();

    // Setup Degree / Radian toggler inside Scientific panel
    degRadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('sci');
        isRadian = !isRadian;
        if (isRadian) {
            degRadBtn.textContent = 'Rad';
            degRadBtn.classList.add('active');
        } else {
            degRadBtn.textContent = 'Deg';
            degRadBtn.classList.remove('active');
        }
    });
    // Set active status by default
    degRadBtn.classList.add('active');

    // Click listeners for ALL buttons
    const allButtons = document.querySelectorAll('.btn');
    allButtons.forEach(btn => {
        // Skip Deg/Rad button as it is handled separately
        if (btn.id === 'btn-deg-rad') return;

        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            
            if (btn.classList.contains('btn-operator')) {
                playSound('operator');
            } else if (btn.classList.contains('btn-sci')) {
                playSound('sci');
            } else {
                playSound('click');
            }

            handleInput(val);
        });
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        
        // Block during active inputs (e.g. searching or history drawer inputs, none here but good practice)
        if (document.activeElement.tagName === 'INPUT') return;

        if (key >= '0' && key <= '9') {
            playSound('click');
            handleInput(key);
        } else if (key === '.') {
            playSound('click');
            handleInput('.');
        } else if (key === '+' || key === '-' || key === '*' || key === '/' || key === '%' || key === '(' || key === ')') {
            playSound('operator');
            handleInput(key);
        } else if (key === '^') {
            playSound('sci');
            handleInput('^');
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            playSound('click');
            handleInput('=');
        } else if (key === 'Backspace') {
            playSound('click');
            handleInput('backspace');
        } else if (key === 'Escape') {
            playSound('click');
            handleInput('C');
        }
    });

    // INPUT PROCESSOR
    function handleInput(val) {
        if (isCalculated && !['+', '-', '*', '/', '%', '^', 'fact', '1/'].includes(val)) {
            // Reset expression if user starts typing a number after calculation
            currentExpression = '';
            isCalculated = false;
        } else if (isCalculated) {
            isCalculated = false;
        }

        switch (val) {
            case 'C':
                currentExpression = '';
                calcExpr.textContent = '';
                calcScreen.textContent = '0';
                break;
            case 'backspace':
                if (currentExpression.length > 0) {
                    // If deleting a word function (like sin(, cos(, ln()
                    const match = currentExpression.match(/(sin\(|cos\(|tan\(|log\(|ln\(|sqrt\(|abs\(|exp\()$/);
                    if (match) {
                        currentExpression = currentExpression.slice(0, -match[0].length);
                    } else {
                        currentExpression = currentExpression.slice(0, -1);
                    }
                }
                updateDisplay();
                break;
            case '=':
                processCalculation();
                break;
            case 'negate':
                // Wrap expression or negate current input
                if (currentExpression === '') return;
                if (currentExpression.startsWith('-(') && currentExpression.endsWith(')')) {
                    currentExpression = currentExpression.slice(2, -1);
                } else {
                    currentExpression = `-(${currentExpression})`;
                }
                updateDisplay();
                break;
            case 'sin':
            case 'cos':
            case 'tan':
            case 'log':
            case 'ln':
            case 'abs':
            case 'exp':
                currentExpression += `${val}(`;
                updateDisplay();
                break;
            case 'sqrt':
                currentExpression += `√(`;
                updateDisplay();
                break;
            case 'fact':
                currentExpression += `!`;
                updateDisplay();
                break;
            case '1/':
                currentExpression = `1/(${currentExpression})`;
                updateDisplay();
                break;
            case 'pi':
                currentExpression += 'π';
                updateDisplay();
                break;
            case 'e':
                currentExpression += 'e';
                updateDisplay();
                break;
            default:
                // Normal inputs (numbers, basic operators, decimal)
                currentExpression += val;
                updateDisplay();
                break;
        }
    }

    function updateDisplay() {
        // Human readable adjustments
        let formatted = currentExpression
            .replaceAll('*', '×')
            .replaceAll('/', '÷');
        
        calcScreen.textContent = formatted || '0';
    }

    // FACTORIAL HELPER
    function factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        
        // Limit to max 170 to avoid Infinity issues
        if (n > 170) return Infinity;
        
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    // MATHEMATICAL EXPRESSION PARSER & EVALUATOR
    function safeEvaluate(exprStr) {
        let processed = exprStr;
        
        // Constants
        processed = processed.replaceAll('π', 'Math.PI');
        processed = processed.replaceAll('e', 'Math.E');

        // Factorial Parser (e.g. 5! -> factorial(5), or (2+3)! -> factorial(2+3))
        let factorialRegex = /(\b\d+(?:\.\d+)?|\((?:[^()]+|\([^()]*\))*\))!/g;
        let prevProcessed = '';
        while (processed !== prevProcessed) {
            prevProcessed = processed;
            processed = processed.replace(factorialRegex, 'factorial($1)');
        }

        // Degree/Radian mappings for trig functions
        if (!isRadian) {
            processed = processed.replace(/sin\(([^)]+)\)/g, 'Math.sin(($1) * Math.PI / 180)');
            processed = processed.replace(/cos\(([^)]+)\)/g, 'Math.cos(($1) * Math.PI / 180)');
            processed = processed.replace(/tan\(([^)]+)\)/g, 'Math.tan(($1) * Math.PI / 180)');
        } else {
            processed = processed.replace(/sin\(([^)]+)\)/g, 'Math.sin($1)');
            processed = processed.replace(/cos\(([^)]+)\)/g, 'Math.cos($1)');
            processed = processed.replace(/tan\(([^)]+)\)/g, 'Math.tan($1)');
        }

        // Map logs, root, abs
        processed = processed.replace(/ln\(([^)]+)\)/g, 'Math.log($1)');
        processed = processed.replace(/log\(([^)]+)\)/g, 'Math.log10($1)');
        processed = processed.replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)');
        processed = processed.replace(/abs\(([^)]+)\)/g, 'Math.abs($1)');
        processed = processed.replace(/exp\(([^)]+)\)/g, 'Math.exp($1)');

        // Map exponentiation (power symbol)
        processed = processed.replaceAll('^', '**');

        // Whitelist regex to ensure only mathematical codes/numbers can be executed
        const allowedPattern = /[0-9.+\-*/%()e\s]|Math\.(sin|cos|tan|log|log10|sqrt|PI|E|abs|exp)|factorial/g;
        const testStr = processed.replace(allowedPattern, '');
        if (testStr.trim().length > 0) {
            throw new Error("Karakter tidak valid");
        }

        // Run sandboxed evaluation
        const evalFunc = new Function('factorial', `return ${processed}`);
        const result = evalFunc(factorial);
        
        if (typeof result !== 'number' || isNaN(result)) {
            throw new Error("Bukan Angka");
        }
        return result;
    }

    function processCalculation() {
        if (!currentExpression) return;

        try {
            const rawResult = safeEvaluate(currentExpression);
            
            // Clean rounding for JS floating point errors
            let cleanResult = rawResult;
            if (Math.abs(rawResult) < 1e12 && Math.abs(rawResult) > 1e-12) {
                cleanResult = Math.round(rawResult * 1e10) / 1e10;
            }

            const formattedExpr = currentExpression
                .replaceAll('*', '×')
                .replaceAll('/', '÷');
            
            calcExpr.textContent = `${formattedExpr} =`;
            calcScreen.textContent = cleanResult.toString();

            // Save history
            saveHistory(formattedExpr, cleanResult.toString());

            currentExpression = cleanResult.toString();
            isCalculated = true;
            playSound('success');
        } catch (error) {
            console.error(error);
            calcScreen.textContent = 'Error';
            playSound('fail');
            isCalculated = true;
        }
    }


    // ==========================================================================
    // HISTORY DRAWER LOGIC
    // ==========================================================================
    toggleHistoryBtn.addEventListener('click', () => {
        playSound('click');
        const isOpen = calcHistoryDrawer.classList.toggle('open');
        toggleHistoryBtn.classList.toggle('active');
        toggleHistoryBtn.querySelector('span').textContent = isOpen ? 'Sembunyikan Riwayat' : 'Tampilkan Riwayat';
    });

    clearHistoryBtn.addEventListener('click', () => {
        playSound('click');
        history = [];
        localStorage.removeItem('calc_scientific_history');
        renderHistory();
    });

    function saveHistory(expr, result) {
        history.unshift({ expr, result });
        if (history.length > 20) history.pop();
        localStorage.setItem('calc_scientific_history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            historyList.innerHTML = '<li class="empty-history">Belum ada riwayat</li>';
            return;
        }

        historyList.innerHTML = history.map((item, idx) => `
            <li class="history-item" data-index="${idx}">
                <div class="history-item-expr">${item.expr} =</div>
                <div class="history-item-result">${item.result}</div>
            </li>
        `).join('');

        // History items click triggers setting screen output
        const historyItems = historyList.querySelectorAll('.history-item');
        historyItems.forEach(item => {
            item.addEventListener('click', () => {
                playSound('click');
                const idx = item.getAttribute('data-index');
                currentExpression = history[idx].result;
                isCalculated = true;
                updateDisplay();
            });
        });
    }
});
