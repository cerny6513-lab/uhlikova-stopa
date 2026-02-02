class CarbonFootprintApp {
    constructor() {
        this.carbonData = {
            walk: 0,
            mhd: 0,
            car: 0,
            homeFood: 0,
            storeFood: 0,
            fastfood: 0,
            energy: 0,
            recycling: 0,
            shopping: 0
        };
        
        this.carbonFactors = {
            walk: 0,
            mhd: 0.05,
            car: 0.2,
            homeFood: 0.5,
            storeFood: 1.5,
            fastfood: 3,
            energy: 0.1,
            recycling: -0.3,
            shopping: 2
        };
        
        this.history = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        // Tlačítka pro přidání/odebrání aktivit
        document.querySelectorAll('.btn-add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.getAttribute('data-type');
                this.addActivity(type);
            });
        });
        
        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.getAttribute('data-type');
                this.removeActivity(type);
            });
        });
        
        // Tlačítko pro reset
        document.getElementById('reset-btn').addEventListener('click', () => this.resetWeek());
    }

    loadUserData(carbonData, history) {
        this.carbonData = { ...this.carbonData, ...carbonData };
        this.history = history || [];
        this.updateDisplay();
        this.updateHistory();
    }

    addActivity(type) {
        this.carbonData[type]++;
        
        // Přidat do historie
        const activityNames = {
            walk: 'Chůze',
            mhd: 'MHD',
            car: 'Auto',
            homeFood: 'Domácí jídlo',
            storeFood: 'Kupované jídlo',
            fastfood: 'Fastfood',
            energy: 'Energie',
            recycling: 'Recyklace',
            shopping: 'Nákupy'
        };
        
        const icon = {
            walk: '🚶',
            mhd: '🚌',
            car: '🚗',
            homeFood: '🏠',
            storeFood: '🛍️',
            fastfood: '🍔',
            energy: '⚡',
            recycling: '♻️',
            shopping: '🛒'
        }[type];
        
        const factor = this.carbonFactors[type];
        const impact = factor >= 0 ? `+${factor} kg` : `${factor} kg`;
        const timestamp = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
        
        this.history.unshift({
            type,
            name: activityNames[type],
            icon,
            impact,
            value: this.carbonData[type],
            timestamp,
            factor
        });
        
        // Omezit historii na 10 záznamů
        if (this.history.length > 10) {
            this.history = this.history.slice(0, 10);
        }
        
        this.updateDisplay();
        this.updateHistory();
        this.saveData();
        
        // Zobrazit notifikaci
        this.showNotification(`${icon} Přidáno: ${activityNames[type]}`, 'success');
    }

    removeActivity(type) {
        if (this.carbonData[type] > 0) {
            this.carbonData[type]--;
            
            // Přidat do historie jako odebrání
            const activityNames = {
                walk: 'Chůze',
                mhd: 'MHD',
                car: 'Auto',
                homeFood: 'Domácí jídlo',
                storeFood: 'Kupované jídlo',
                fastfood: 'Fastfood',
                energy: 'Energie',
                recycling: 'Recyklace',
                shopping: 'Nákupy'
            };
            
            const icon = {
                walk: '🚶',
                mhd: '🚌',
                car: '🚗',
                homeFood: '🏠',
                storeFood: '🛍️',
                fastfood: '🍔',
                energy: '⚡',
                recycling: '♻️',
                shopping: '🛒'
            }[type];
            
            const factor = this.carbonFactors[type];
            const impact = factor >= 0 ? `-${factor} kg` : `+${Math.abs(factor)} kg`;
            const timestamp = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
            
            this.history.unshift({
                type,
                name: activityNames[type],
                icon,
                impact,
                value: this.carbonData[type],
                timestamp,
                factor,
                removed: true
            });
            
            // Omezit historii na 10 záznamů
            if (this.history.length > 10) {
                this.history = this.history.slice(0, 10);
            }
            
            this.updateDisplay();
            this.updateHistory();
            this.saveData();
            
            // Zobrazit notifikaci
            this.showNotification(`${icon} Odebráno: ${activityNames[type]}`, 'info');
        }
    }

    calculateTotal() {
        let total = 0;
        
        for (const [type, value] of Object.entries(this.carbonData)) {
            total += value * this.carbonFactors[type];
        }
        
        return Math.max(0, total); // Nikdy záporné
    }

    updateDisplay() {
        // Aktualizovat počty
        for (const [type, value] of Object.entries(this.carbonData)) {
            const countElement = document.getElementById(`${type}-count`);
            if (countElement) {
                countElement.textContent = value;
            }
        }
        
        // Aktualizovat celkovou uhlíkovou stopu
        const total = this.calculateTotal();
        document.getElementById('total-carbon').textContent = total.toFixed(1);
        
        // Aktualizovat progress bar
        const progressElement = document.getElementById('carbon-progress');
        const progressPercentage = Math.min(100, (total / 50) * 100); // 50 kg jako maximum
        progressElement.style.width = `${progressPercentage}%`;
        
        // Barva podle úrovně
        if (total < 15) {
            progressElement.style.backgroundColor = 'rgba(46, 204, 113, 0.7)'; // Zelená
        } else if (total < 30) {
            progressElement.style.backgroundColor = 'rgba(243, 156, 18, 0.7)'; // Žlutá
        } else {
            progressElement.style.backgroundColor = 'rgba(231, 76, 60, 0.7)'; // Červená
        }
    }

    updateHistory() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        
        this.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${item.factor >= 0 ? 'positive' : 'negative'}`;
            
            // Barva podle typu aktivity
            let iconColor = '#2ecc71'; // Zelená - výchozí
            if (['mhd', 'store-food'].includes(item.type)) iconColor = '#f39c12'; // Žlutá
            if (['car', 'fastfood'].includes(item.type)) iconColor = '#e74c3c'; // Červená
            if (['energy', 'shopping'].includes(item.type)) iconColor = '#3498db'; // Modrá
            
            historyItem.innerHTML = `
                <div>
                    <span style="color: ${iconColor}">${item.icon}</span>
                    <strong>${item.name}</strong>
                    <span class="timestamp">${item.timestamp}</span>
                </div>
                <div>
                    <strong>${item.impact} CO₂</strong>
                    <span style="margin-left: 10px; color: #95a5a6;">${item.value}×</span>
                </div>
            `;
            
            historyList.appendChild(historyItem);
        });
        
        // Pokud je historie prázdná
        if (this.history.length === 0) {
            historyList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #95a5a6;">
                    <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Zatím žádná aktivita. Začněte přidávat aktivity!</p>
                </div>
            `;
        }
    }

    resetWeek() {
        if (confirm('Opravdu chcete resetovat data za tento týden? Tato akce nelze vrátit zpět.')) {
            // Přidat reset do historie
            const timestamp = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
            const date = new Date().toLocaleDateString('cs-CZ');
            
            this.history.unshift({
                type: 'reset',
                name: 'Reset týdne',
                icon: '🔄',
                impact: `-${this.calculateTotal().toFixed(1)} kg`,
                timestamp: `${date} ${timestamp}`,
                reset: true
            });
            
            // Resetovat data
            for (const key in this.carbonData) {
                this.carbonData[key] = 0;
            }
            
            this.updateDisplay();
            this.updateHistory();
            this.saveData();
            
            this.showNotification('Data za týden byla resetována', 'info');
        }
    }

    saveData() {
        if (window.auth && window.auth.currentUser) {
            window.auth.saveUserData(this.carbonData, this.history);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
}

// Inicializace aplikace
document.addEventListener('DOMContentLoaded', () => {
    window.carbonApp = new CarbonFootprintApp();
});