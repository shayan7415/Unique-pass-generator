// SecurePass Pro - Password Generator JavaScript

class PasswordGenerator {
    constructor() {
        this.stats = {
            totalGenerated: 0,
            totalStrength: 0,
            strongestPassword: 0,
            strengthHistory: []
        };
        
        this.currentPassword = '';
        this.selectedCategory = null;
        this.generatedPasswords = new Set(); // Track all generated passwords
        this.maxAttempts = 1000; // Maximum attempts to generate unique password
        
        this.initializeElements();
        this.bindEvents();
        this.loadPreferences();
        this.generatePassword();
        this.initializeTooltips();
    }

    initializeElements() {
        // Core elements
        this.passwordDisplay = document.getElementById('passwordDisplay');
        this.lengthSlider = document.getElementById('lengthSlider');
        this.lengthDisplay = document.getElementById('lengthDisplay');
        this.generateBtn = document.getElementById('generateBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        
        // Character options
        this.uppercase = document.getElementById('uppercase');
        this.lowercase = document.getElementById('lowercase');
        this.numbers = document.getElementById('numbers');
        this.symbols = document.getElementById('symbols');
        this.excludeSimilar = document.getElementById('excludeSimilar');
        this.excludeAmbiguous = document.getElementById('excludeAmbiguous');
        
        // Pattern selection
        this.randomPattern = document.getElementById('randomPattern');
        this.memorablePattern = document.getElementById('memorablePattern');
        
        // Strength elements
        this.strengthBar = document.getElementById('strengthBar');
        this.strengthLabel = document.getElementById('strengthLabel');
        this.entropyInfo = document.getElementById('entropyInfo');
        this.crackTime = document.getElementById('crackTime');
        
        // Category buttons
        this.categoryButtons = document.querySelectorAll('.category-btn');
        
        // Modal elements
        this.multipleCount = document.getElementById('multipleCount');
        this.multiplePasswordsContainer = document.getElementById('multiplePasswordsContainer');
        this.generateMultipleBtn = document.getElementById('generateMultipleBtn');
        this.copyAllBtn = document.getElementById('copyAllBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        
        // Analytics elements
        this.totalGenerated = document.getElementById('totalGenerated');
        this.avgStrength = document.getElementById('avgStrength');
        this.strongestPassword = document.getElementById('strongestPassword');
        this.strengthChart = document.getElementById('strengthChart');
    }

    bindEvents() {
        // Core functionality
        this.generateBtn.addEventListener('click', () => this.generatePassword());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.refreshBtn.addEventListener('click', () => this.generatePassword());
        this.clearHistoryBtn.addEventListener('click', () => this.clearGeneratedPasswords());
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        
        // Length slider
        this.lengthSlider.addEventListener('input', (e) => {
            this.lengthDisplay.textContent = e.target.value;
            this.generatePassword();
        });
        
        // Character options
        [this.uppercase, this.lowercase, this.numbers, this.symbols, 
         this.excludeSimilar, this.excludeAmbiguous].forEach(checkbox => {
            checkbox.addEventListener('change', () => this.generatePassword());
        });
        
        // Pattern selection
        [this.randomPattern, this.memorablePattern].forEach(radio => {
            radio.addEventListener('change', () => this.generatePassword());
        });
        
        // Category buttons
        this.categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectCategory(e));
        });
        
        // Modal events
        this.generateMultipleBtn.addEventListener('click', () => this.generateMultiplePasswords());
        this.copyAllBtn.addEventListener('click', () => this.copyAllPasswords());
        this.downloadBtn.addEventListener('click', () => this.downloadPasswords());
        document.getElementById('analyticsBtn').addEventListener('click', () => this.updateAnalytics());
        
        // Modal show events
        document.getElementById('qrModal').addEventListener('show.bs.modal', () => this.generateQRCode());
        document.getElementById('analyticsModal').addEventListener('show.bs.modal', () => this.updateAnalytics());
    }

    initializeTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    loadPreferences() {
        // Load dark mode preference
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            this.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
        }
        
        // Load stats
        const savedStats = localStorage.getItem('passwordStats');
        if (savedStats) {
            this.stats = JSON.parse(savedStats);
        }
        
        // Load generated passwords
        const savedPasswords = localStorage.getItem('generatedPasswords');
        if (savedPasswords) {
            this.generatedPasswords = new Set(JSON.parse(savedPasswords));
        }
    }

    savePreferences() {
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        localStorage.setItem('passwordStats', JSON.stringify(this.stats));
        localStorage.setItem('generatedPasswords', JSON.stringify([...this.generatedPasswords]));
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        if (isDarkMode) {
            this.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
        } else {
            this.darkModeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
        }
        
        this.savePreferences();
    }

    selectCategory(event) {
        // Remove active class from all category buttons
        this.categoryButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        event.target.classList.add('active');
        this.selectedCategory = event.target.dataset.category;
        
        // Generate new password with category context
        this.generatePassword();
    }

    generatePassword() {
        const length = parseInt(this.lengthSlider.value);
        const pattern = document.querySelector('input[name="pattern"]:checked').value;
        
        let password = '';
        let attempts = 0;
        
        // Generate unique password
        do {
            if (pattern === 'memorable') {
                password = this.generateMemorablePassword(length);
            } else {
                password = this.generateRandomPassword(length);
            }
            attempts++;
            
            // Prevent infinite loop
            if (attempts > this.maxAttempts) {
                // If we can't generate a unique password, add a timestamp suffix
                const timestamp = Date.now().toString(36);
                password = password.substring(0, length - timestamp.length) + timestamp;
                break;
            }
        } while (this.generatedPasswords.has(password));
        
        // Add to generated passwords set
        this.generatedPasswords.add(password);
        
        this.currentPassword = password;
        this.passwordDisplay.value = password;
        this.updateStrengthMeter(password);
        this.updateStats(password);
        
        // Add fade-in animation
        this.passwordDisplay.classList.add('fade-in');
        setTimeout(() => this.passwordDisplay.classList.remove('fade-in'), 500);
        
        // Show uniqueness indicator
        this.showUniquenessIndicator();
    }

    generateRandomPassword(length) {
        let charset = '';
        
        if (this.uppercase.checked) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (this.lowercase.checked) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (this.numbers.checked) charset += '0123456789';
        if (this.symbols.checked) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        // Exclude similar characters
        if (this.excludeSimilar.checked) {
            charset = charset.replace(/[l1IO0]/g, '');
        }
        
        // Exclude ambiguous characters
        if (this.excludeAmbiguous.checked) {
            charset = charset.replace(/[{}[\]|\\/]/g, '');
        }
        
        if (charset === '') {
            charset = 'abcdefghijklmnopqrstuvwxyz';
        }
        
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        return password;
    }

    generateMemorablePassword(length) {
        const words = [
            'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'garden', 'house',
            'island', 'jungle', 'knight', 'lemon', 'mountain', 'ocean', 'planet', 'queen',
            'river', 'sunset', 'tiger', 'umbrella', 'village', 'window', 'xylophone', 'yellow',
            'zebra', 'adventure', 'beautiful', 'creative', 'delicious', 'excellent', 'fantastic'
        ];
        
        const symbols = ['!', '@', '#', '$', '%', '^', '&', '*'];
        const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        
        let password = '';
        const wordCount = Math.floor(length / 4);
        
        for (let i = 0; i < wordCount; i++) {
            const word = words[Math.floor(Math.random() * words.length)];
            password += word.charAt(0).toUpperCase() + word.slice(1);
            
            if (i < wordCount - 1) {
                password += symbols[Math.floor(Math.random() * symbols.length)];
                password += numbers[Math.floor(Math.random() * numbers.length)];
            }
        }
        
        // Pad to desired length
        while (password.length < length) {
            password += symbols[Math.floor(Math.random() * symbols.length)];
        }
        
        return password.substring(0, length);
    }

    calculateEntropy(password) {
        let charsetSize = 0;
        
        if (this.uppercase.checked) charsetSize += 26;
        if (this.lowercase.checked) charsetSize += 26;
        if (this.numbers.checked) charsetSize += 10;
        if (this.symbols.checked) charsetSize += 32;
        
        if (charsetSize === 0) charsetSize = 26;
        
        return Math.log2(Math.pow(charsetSize, password.length));
    }

    calculateStrength(entropy) {
        if (entropy < 40) return { level: 'Weak', percentage: 25, color: '#ef4444' };
        if (entropy < 60) return { level: 'Moderate', percentage: 50, color: '#f59e0b' };
        if (entropy < 80) return { level: 'Strong', percentage: 75, color: '#10b981' };
        return { level: 'Very Strong', percentage: 100, color: '#059669' };
    }

    estimateCrackTime(entropy) {
        // Assuming 1 billion attempts per second
        const attemptsPerSecond = 1e9;
        const totalCombinations = Math.pow(2, entropy);
        const seconds = totalCombinations / attemptsPerSecond;
        
        if (seconds < 1) return 'Instantly';
        if (seconds < 60) return `${Math.round(seconds)} seconds`;
        if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
        if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
        if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`;
        return 'Centuries';
    }

    updateStrengthMeter(password) {
        const entropy = this.calculateEntropy(password);
        const strength = this.calculateStrength(entropy);
        const crackTime = this.estimateCrackTime(entropy);
        
        // Update progress bar
        this.strengthBar.style.width = `${strength.percentage}%`;
        this.strengthBar.style.backgroundColor = strength.color;
        
        // Update labels
        this.strengthLabel.textContent = strength.level;
        this.entropyInfo.textContent = `Entropy: ${Math.round(entropy)} bits`;
        this.crackTime.innerHTML = `<i class="fas fa-clock"></i> Crack time: ${crackTime}`;
        
        // Add animation
        this.strengthBar.style.transition = 'width 0.5s ease, background-color 0.5s ease';
    }

    updateStats(password) {
        const entropy = this.calculateEntropy(password);
        
        this.stats.totalGenerated++;
        this.stats.totalStrength += entropy;
        this.stats.strongestPassword = Math.max(this.stats.strongestPassword, entropy);
        this.stats.strengthHistory.push(entropy);
        
        // Keep only last 100 entries for chart
        if (this.stats.strengthHistory.length > 100) {
            this.stats.strengthHistory.shift();
        }
        
        this.savePreferences();
    }

    showUniquenessIndicator() {
        // Create or update uniqueness indicator
        let indicator = document.getElementById('uniquenessIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'uniquenessIndicator';
            indicator.className = 'uniqueness-indicator';
            indicator.innerHTML = `
                <i class="fas fa-shield-check"></i>
                <span>Unique Password Generated</span>
                <small>Total unique passwords: ${this.generatedPasswords.size}</small>
            `;
            
            // Insert after password display
            const passwordDisplayCard = document.querySelector('.password-display-card');
            passwordDisplayCard.appendChild(indicator);
        } else {
            indicator.querySelector('small').textContent = `Total unique passwords: ${this.generatedPasswords.size}`;
        }
        
        // Show animation
        indicator.classList.add('show');
        setTimeout(() => indicator.classList.remove('show'), 3000);
    }

    clearGeneratedPasswords() {
        this.generatedPasswords.clear();
        this.savePreferences();
        
        // Remove uniqueness indicator
        const indicator = document.getElementById('uniquenessIndicator');
        if (indicator) {
            indicator.remove();
        }
        
        // Show confirmation
        this.showNotification('Generated passwords history cleared!', 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    copyToClipboard() {
        if (this.currentPassword) {
            navigator.clipboard.writeText(this.currentPassword).then(() => {
                // Show success feedback
                const originalText = this.copyBtn.innerHTML;
                this.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                this.copyBtn.classList.add('btn-success');
                
                setTimeout(() => {
                    this.copyBtn.innerHTML = originalText;
                    this.copyBtn.classList.remove('btn-success');
                }, 2000);
            });
        }
    }



    generateMultiplePasswords() {
        const count = parseInt(this.multipleCount.value);
        const passwords = [];
        const length = parseInt(this.lengthSlider.value);
        const pattern = document.querySelector('input[name="pattern"]:checked').value;
        
        for (let i = 0; i < count; i++) {
            let password = '';
            let attempts = 0;
            
            // Generate unique password for multiple generation
            do {
                if (pattern === 'memorable') {
                    password = this.generateMemorablePassword(length);
                } else {
                    password = this.generateRandomPassword(length);
                }
                attempts++;
                
                // Prevent infinite loop
                if (attempts > this.maxAttempts) {
                    // If we can't generate a unique password, add a timestamp suffix
                    const timestamp = Date.now().toString(36) + i.toString(36);
                    password = password.substring(0, length - timestamp.length) + timestamp;
                    break;
                }
            } while (this.generatedPasswords.has(password));
            
            // Add to generated passwords set
            this.generatedPasswords.add(password);
            passwords.push(password);
        }
        
        this.displayMultiplePasswords(passwords);
        this.showUniquenessIndicator();
    }

    displayMultiplePasswords(passwords) {
        this.multiplePasswordsContainer.innerHTML = '';
        
        passwords.forEach((password, index) => {
            const passwordItem = document.createElement('div');
            passwordItem.className = 'password-item fade-in';
            passwordItem.innerHTML = `
                <span class="password-text">${password}</span>
                <button class="password-copy" onclick="passwordGenerator.copySinglePassword('${password}')">
                    <i class="fas fa-copy"></i>
                </button>
            `;
            this.multiplePasswordsContainer.appendChild(passwordItem);
        });
        
        // Store passwords for copy/download
        this.multiplePasswords = passwords;
    }

    copySinglePassword(password) {
        navigator.clipboard.writeText(password).then(() => {
            // Show feedback
            event.target.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                event.target.innerHTML = '<i class="fas fa-copy"></i>';
            }, 1000);
        });
    }

    copyAllPasswords() {
        if (this.multiplePasswords) {
            const text = this.multiplePasswords.join('\n');
            navigator.clipboard.writeText(text).then(() => {
                // Show feedback
                const originalText = this.copyAllBtn.innerHTML;
                this.copyAllBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                this.copyAllBtn.classList.add('btn-success');
                
                setTimeout(() => {
                    this.copyAllBtn.innerHTML = originalText;
                    this.copyAllBtn.classList.remove('btn-success');
                }, 2000);
            });
        }
    }

    downloadPasswords() {
        if (this.multiplePasswords) {
            const text = this.multiplePasswords.join('\n');
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `passwords_${new Date().toISOString().slice(0, 10)}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    updateAnalytics() {
        // Update stats display
        this.totalGenerated.textContent = this.stats.totalGenerated;
        this.avgStrength.textContent = this.stats.totalGenerated > 0 
            ? Math.round(this.stats.totalStrength / this.stats.totalGenerated) 
            : 0;
        this.strongestPassword.textContent = Math.round(this.stats.strongestPassword);
        
        // Add unique passwords count to analytics
        let uniqueCountElement = document.getElementById('uniquePasswordsCount');
        if (!uniqueCountElement) {
            // Create unique passwords stat item
            const statsGrid = document.querySelector('.stats-grid');
            const uniqueStatItem = document.createElement('div');
            uniqueStatItem.className = 'stat-item';
            uniqueStatItem.innerHTML = `
                <span class="stat-value" id="uniquePasswordsCount">${this.generatedPasswords.size}</span>
                <span class="stat-label">Unique Passwords</span>
            `;
            statsGrid.appendChild(uniqueStatItem);
        } else {
            uniqueCountElement.textContent = this.generatedPasswords.size;
        }
        
        // Update chart
        this.updateStrengthChart();
    }

    updateStrengthChart() {
        if (this.stats.strengthHistory.length === 0) return;
        
        const ctx = this.strengthChart.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }
        
        const labels = this.stats.strengthHistory.map((_, index) => index + 1);
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Password Strength (bits)',
                    data: this.stats.strengthHistory,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Password Number',
                            color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--border-color')
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Entropy (bits)',
                            color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                        },
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-secondary')
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--border-color')
                        }
                    }
                }
            }
        });
    }
}

// Initialize the password generator when the page loads
let passwordGenerator;
document.addEventListener('DOMContentLoaded', () => {
    passwordGenerator = new PasswordGenerator();
});

// Add some fun Easter eggs
document.addEventListener('keydown', (e) => {
    // Konami code for instant strong password
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // This could be expanded to detect the full Konami code
        console.log('🎮 Easter egg detected!');
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'g':
                e.preventDefault();
                passwordGenerator.generatePassword();
                break;
            case 'c':
                e.preventDefault();
                passwordGenerator.copyToClipboard();
                break;
            case 'd':
                e.preventDefault();
                passwordGenerator.toggleDarkMode();
                break;
        }
    }
}); 