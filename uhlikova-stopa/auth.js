// Simulace databáze uživatelů (v reálné aplikaci by bylo na serveru)
const users = JSON.parse(localStorage.getItem('carbonFootprintUsers')) || [];

class Auth {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkLoginStatus();
    }

    setupEventListeners() {
        // Přihlašovací tlačítko
        document.getElementById('login-btn')?.addEventListener('click', () => this.login());
        
        // Registrační tlačítko
        document.getElementById('register-btn')?.addEventListener('click', () => this.register());
        
        // Přepínání mezi přihlášením a registrací
        document.getElementById('register-toggle')?.addEventListener('click', () => this.toggleForms());
        document.getElementById('login-toggle')?.addEventListener('click', () => this.toggleForms());
        
        // Odhlašovací tlačítko
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
        
        // Enter klávesa v přihlašovacích polích
        document.getElementById('login-password')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        
        document.getElementById('register-confirm')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.register();
        });
    }

    checkLoginStatus() {
        if (this.currentUser) {
            this.showApp();
        } else {
            this.showLogin();
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

    toggleForms() {
        const loginForm = document.querySelector('.login-form');
        const registerForm = document.querySelector('.register-form');
        
        loginForm.classList.toggle('hidden');
        registerForm.classList.toggle('hidden');
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    login() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            this.showNotification('Vyplňte všechny pole', 'error');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showNotification('Zadejte platný e-mail', 'error');
            return;
        }
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = {
                id: user.id,
                name: user.name,
                email: user.email
            };
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.showApp();
            this.showNotification('Úspěšně přihlášen', 'success');
        } else {
            this.showNotification('Neplatné přihlašovací údaje', 'error');
        }
    }

    register() {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        
        if (!name || !email || !password || !confirmPassword) {
            this.showNotification('Vyplňte všechny pole', 'error');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showNotification('Zadejte platný e-mail', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Heslo musí mít alespoň 6 znaků', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showNotification('Hesla se neshodují', 'error');
            return;
        }
        
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
            this.showNotification('Uživatel s tímto e-mailem již existuje', 'error');
            return;
        }
        
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            carbonData: {
                walk: 0,
                mhd: 0,
                car: 0,
                homeFood: 0,
                storeFood: 0,
                fastfood: 0,
                energy: 0,
                recycling: 0,
                shopping: 0
            },
            history: []
        };
        
        users.push(newUser);
        localStorage.setItem('carbonFootprintUsers', JSON.stringify(users));
        
        this.currentUser = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        };
        
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        this.showApp();
        this.showNotification('Účet úspěšně vytvořen', 'success');
        
        // Reset formuláře
        document.getElementById('register-name').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-confirm').value = '';
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLogin();
        this.showNotification('Úspěšně odhlášen', 'info');
    }

    showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
        
        // Reset formulářů
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('register-name').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-confirm').value = '';
        
        // Zobrazit přihlašovací formulář
        document.querySelector('.login-form').classList.remove('hidden');
        document.querySelector('.register-form').classList.add('hidden');
    }

    showApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        
        // Zobrazit jméno uživatele
        document.getElementById('user-name').textContent = this.currentUser.name;
        
        // Načíst data uživatele
        this.loadUserData();
    }

    loadUserData() {
        const user = users.find(u => u.id === this.currentUser.id);
        if (user && user.carbonData) {
            // Načíst data do aplikace
            window.carbonApp.loadUserData(user.carbonData, user.history);
        }
    }

    saveUserData(carbonData, history) {
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].carbonData = carbonData;
            users[userIndex].history = history;
            localStorage.setItem('carbonFootprintUsers', JSON.stringify(users));
        }
    }
}

// Inicializace auth systému
const auth = new Auth();