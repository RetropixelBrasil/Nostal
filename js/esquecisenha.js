/* =========================================================
   NOSTAL™ — ESQUECI SENHA
   ========================================================= */

const SUPABASE_URL =
    "https://ckevzcryjtivbrbsnhyq.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_seTOWKCN-oD-aMw4FkNuuQ_6k5JVsnT";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


const resetForm =
    document.getElementById("resetPasswordForm");

const resetMessage =
    document.getElementById("resetMessage");


function showMessage(message, success = false) {

    if (!resetMessage) {
        alert(message);
        return;
    }

    resetMessage.hidden = false;
    resetMessage.textContent = message;

    resetMessage.className =
        success
            ? "form-message success"
            : "form-message error";
}


/* =========================================================
   ENVIAR E-MAIL DE RECUPERAÇÃO
   ========================================================= */

if (resetForm) {

    resetForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            if (!email) {

                showMessage(
                    "Digite o e-mail da sua conta."
                );

                return;
            }


            const button =
                resetForm.querySelector(
                    "button[type='submit']"
                );


            if (button) {

                button.disabled = true;
                button.textContent =
                    "ENVIANDO...";

            }


            try {

                const redirectUrl =
                    window.location.origin +
                    window.location.pathname;


                const { error } =
                    await supabaseClient.auth
                        .resetPasswordForEmail(
                            email,
                            {
                                redirectTo:
                                    redirectUrl
                            }
                        );


                if (error) {

                    console.error(
                        "Erro ao enviar recuperação:",
                        error
                    );

                    showMessage(
                        "Não foi possível enviar o e-mail de recuperação. Verifique o endereço e tente novamente."
                    );

                    return;
                }


                showMessage(
                    "E-mail de recuperação enviado! Verifique sua caixa de entrada.",
                    true
                );


            } catch (error) {

                console.error(error);

                showMessage(
                    "Ocorreu um erro ao tentar recuperar sua senha."
                );

            } finally {

                if (button) {

                    button.disabled = false;

                    button.textContent =
                        "ENVIAR LINK DE RECUPERAÇÃO";

                }

            }

        }
    );

}


/* =========================================================
   ALTERAR SENHA APÓS O LINK
   ========================================================= */

async function setupPasswordRecovery() {

    const {
        data
    } =
        await supabaseClient.auth.getSession();


    if (!data.session) {
        return;
    }


    /*
     * Se a página foi aberta pelo link de recuperação,
     * mostramos a interface para definir a nova senha.
     */

    const recoveryTitle =
        document.querySelector(".welcome h1");

    const recoveryDescription =
        document.querySelector(".welcome p");


    if (recoveryTitle) {

        recoveryTitle.textContent =
            "Defina uma nova senha 🔑";

    }


    if (recoveryDescription) {

        recoveryDescription.textContent =
            "Digite uma nova senha para sua conta.";

    }


    if (!resetForm) {
        return;
    }


    resetForm.innerHTML = `

        <label for="newPassword">
            🔑 Nova senha
        </label>

        <input
            type="password"
            id="newPassword"
            minlength="6"
            placeholder="Digite sua nova senha"
            required>

        <label for="confirmPassword">
            🔑 Confirmar nova senha
        </label>

        <input
            type="password"
            id="confirmPassword"
            minlength="6"
            placeholder="Digite a senha novamente"
            required>

        <button
            type="submit"
            class="login-button">

            ALTERAR SENHA

        </button>

    `;


    resetForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const password =
                document
                    .getElementById("newPassword")
                    .value;

            const confirmation =
                document
                    .getElementById("confirmPassword")
                    .value;


            if (password.length < 6) {

                showMessage(
                    "A senha precisa ter pelo menos 6 caracteres."
                );

                return;

            }


            if (password !== confirmation) {

                showMessage(
                    "As senhas não são iguais."
                );

                return;

            }


            const { error } =
                await supabaseClient.auth
                    .updateUser({
                        password: password
                    });


            if (error) {

                console.error(error);

                showMessage(
                    "Não foi possível alterar sua senha."
                );

                return;

            }


            showMessage(
                "Senha alterada com sucesso! Você já pode entrar na Nostal™.",
                true
            );


            setTimeout(
                function() {

                    window.location.href =
                        "index.html";

                },
                2000
            );

        }
    );

}


supabaseClient.auth.onAuthStateChange(
    function(event) {

        if (event === "PASSWORD_RECOVERY") {

            setupPasswordRecovery();

        }

    }
);