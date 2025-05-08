document.addEventListener('DOMContentLoaded', function() {
    const LoginForm = document.getElementById('LoginForm');
    
    if (LoginForm) {
        LoginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            // Corrigido: usando institution_id em vez de username
            const institutionId = document.getElementById('institution_id').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            
            // Esconde mensagem de erro se existir
            if (errorMessage) {
                errorMessage.classList.add('d-none');
            }
            
            // Validação básica
            if (institutionId === '12345678910' && password === '1234') {
                // Redireciona para o painel
                window.location.href = window.painelIUrl || "/instituicao/";
            } else {
                // Mostra mensagem de erro
                if (!errorMessage) {
                    createErrorMessage('Credenciais incorretas. Tente novamente.');
                } else {
                    errorMessage.textContent = 'Credenciais incorretas. Tente novamente.';
                    errorMessage.classList.remove('d-none');
                }
            }
            
            // Adiciona validação visual
            this.classList.add('was-validated');
        });
    }

    function createErrorMessage(message) {
        const div = document.createElement('div');
        div.id = 'errorMessage';
        div.className = 'alert alert-danger mt-3';
        div.textContent = message || 'Erro durante o login';
        LoginForm.insertBefore(div, LoginForm.querySelector('.institution-footer'));
        return div;
    }
});