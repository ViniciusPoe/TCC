document.addEventListener('DOMContentLoaded', function() {
    // Elementos comuns
    const loginForm = document.getElementById('loginForm');
    const institutionForm = document.getElementById('institutionForm');
    
    // Lógica para Doador
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (username === 'user1' && password === '1234') {
                window.location.href = window.doadorPainelUrl || "/doador/";
            } else {
                showErrorMessage(loginForm, 'errorMessage');
            }
            
            this.classList.add('was-validated');
        });
    }

    // Lógica para Instituição
    if (institutionForm) {
        institutionForm.addEventListener('submit', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const institutionId = document.getElementById('institution_id').value;
            const password = document.getElementById('inst_password').value;
            
            if (institutionId === '12345678910' && password === '1234') {
                window.location.href = window.instituicaoPainelUrl || "/instituicao/";
            } else {
                showErrorMessage(institutionForm, 'instErrorMessage');
            }
            
            this.classList.add('was-validated');
        });
    }

    // Função compartilhada para mostrar erros
    function showErrorMessage(formElement, messageId) {
        let errorElement = document.getElementById(messageId);
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = messageId;
            errorElement.className = 'alert alert-danger mt-3';
            errorElement.textContent = 'Credenciais incorretas. Tente novamente.';
            formElement.appendChild(errorElement);
        } else {
            errorElement.classList.remove('d-none');
        }
    }
});