document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${btn.dataset.tab}-form`).classList.add('active');
    });
});

let avatarFile = null;

document.getElementById('choose-avatar').addEventListener('click', () => {
    document.getElementById('reg-avatar').click();
});

document.getElementById('reg-avatar').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.match('image.*')) {
            alert('Por favor, selecione uma imagem válida');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter menos de 2MB');
            return;
        }
        avatarFile = file;
        const reader = new FileReader();
        reader.onload = function(event) {
            const avatarPreview = document.getElementById('avatar-preview');
            avatarPreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = event.target.result;
            avatarPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');
    errorElement.textContent = '';
    
    if (!username || !password) {
        errorElement.textContent = 'Por favor, preencha todos os campos';
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('chatUsers') || '{}');
    
    if (!users[username] || users[username].password !== password) {
        errorElement.textContent = 'Usuário ou senha incorretos';
        return;
    }
    
    sessionStorage.setItem('currentUser', username);
    sessionStorage.setItem('userName', users[username].name);
    sessionStorage.setItem('userAvatar', users[username].avatar || '');
    window.location.href = 'chat.html';
});

document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const errorElement = document.getElementById('register-error');
    errorElement.textContent = '';
    
    if (!name || !username || !password || !confirmPassword) {
        errorElement.textContent = 'Por favor, preencha todos os campos';
        return;
    }
    
    if (password !== confirmPassword) {
        errorElement.textContent = 'As senhas não coincidem';
        return;
    }
    
    if (password.length < 6) {
        errorElement.textContent = 'A senha deve ter pelo menos 6 caracteres';
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('chatUsers') || '{}');
    
    if (users[username]) {
        errorElement.textContent = 'Nome de usuário já em uso';
        return;
    }
    
    let avatarBase64 = '';
    if (avatarFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            avatarBase64 = event.target.result.split(',')[1];
            completeRegistration();
        };
        reader.readAsDataURL(avatarFile);
    } else {
        completeRegistration();
    }
    
    function completeRegistration() {
        users[username] = {
            name: name,
            password: password,
            avatar: avatarBase64
        };
        localStorage.setItem('chatUsers', JSON.stringify(users));
        sessionStorage.setItem('currentUser', username);
        sessionStorage.setItem('userName', name);
        sessionStorage.setItem('userAvatar', avatarBase64 || '');
        window.location.href = 'chat.html';
    }
});