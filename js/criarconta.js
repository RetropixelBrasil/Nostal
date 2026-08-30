/* =========================================================
   NOSTAL™ — CRIARCONTA.JS
   ========================================================= */


/* =========================================================
   SUPABASE
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


/* =========================================================
   ELEMENTOS
   ========================================================= */

const form =
    document.getElementById("createAccountForm");

const displayNameInput =
    document.getElementById("displayName");

const usernameInput =
    document.getElementById("username");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const acceptTermsInput =
    document.getElementById("acceptTerms");

const messageBox =
    document.getElementById("signupMessage");

const button =
    document.getElementById("createAccountButton");


/* =========================================================
   MENSAGENS
   ========================================================= */

function showMessage(message, type) {

    messageBox.textContent = message;

    messageBox.className =
        "form-message " + type;

    messageBox.hidden = false;

}


function hideMessage() {

    messageBox.hidden = true;

}


/* =========================================================
   TRADUÇÃO DE ERROS
   ========================================================= */

function translateSignupError(error) {

    const message =
        (error.message || "").toLowerCase();


    if (
        message.includes("already registered") ||
        message.includes("already been registered") ||
        message.includes("user already registered")
    ) {

        return "Este e-mail já está cadastrado na Nostal™.";

    }


    if (
        message.includes("invalid email")
    ) {

        return "Digite um endereço de e-mail válido.";

    }


    if (
        message.includes("password") &&
        (
            message.includes("weak") ||
            message.includes("short") ||
            message.includes("characters")
        )
    ) {

        return "A senha escolhida é muito fraca. Use pelo menos 8 caracteres.";

    }


    if (
        message.includes("rate limit") ||
        message.includes("too many requests")
    ) {

        return "Muitas tentativas foram feitas. Aguarde alguns minutos e tente novamente.";

    }


    if (
        message.includes("network") ||
        message.includes("fetch")
    ) {

        return "Não foi possível conectar à Nostal™. Verifique sua conexão com a internet.";

    }


    return "Não foi possível criar sua conta. Verifique os dados e tente novamente.";

}


/* =========================================================
   VALIDAR USERNAME
   ========================================================= */

function validUsername(username) {

    return /^[A-Za-z0-9_]{3,24}$/.test(
        username
    );

}


/* =========================================================
   VERIFICAR USERNAME EXISTENTE
   ========================================================= */

async function usernameExists(username) {

    const { data, error } =
        await supabaseClient
            .from("profiles")
            .select("id")
            .eq("username", username)
            .maybeSingle();


    if (error) {

        console.error(
            "Erro ao verificar nome de usuário:",
            error
        );

        throw error;

    }


    return data !== null;

}


/* =========================================================
   CADASTRO
   ========================================================= */

form.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        hideMessage();


        const displayName =
            displayNameInput.value.trim();

        const username =
            usernameInput.value
                .trim()
                .toLowerCase();

        const email =
            emailInput.value
                .trim()
                .toLowerCase();

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        /* ===== VALIDAÇÕES ===== */

        if (!displayName) {

            showMessage(
                "Digite seu nome.",
                "error"
            );

            return;

        }


        if (!validUsername(username)) {

            showMessage(
                "O nome de usuário deve possuir de 3 a 24 caracteres e usar apenas letras, números ou _.",
                "error"
            );

            return;

        }


        if (password.length < 8) {

            showMessage(
                "Sua senha deve possuir pelo menos 8 caracteres.",
                "error"
            );

            return;

        }


        if (password !== confirmPassword) {

            showMessage(
                "As duas senhas digitadas não são iguais.",
                "error"
            );

            return;

        }


        if (!acceptTermsInput.checked) {

            showMessage(
                "Você precisa aceitar os Termos de Uso e a Política de Privacidade.",
                "error"
            );

            return;

        }


        button.disabled = true;

        button.textContent =
            "CRIANDO CONTA...";


        try {

            /* =============================================
               VERIFICAR USERNAME
               ============================================= */

            const exists =
                await usernameExists(username);


            if (exists) {

                showMessage(
                    "Este nome de usuário já está sendo usado. Escolha outro.",
                    "error"
                );

                return;

            }


            /* =============================================
               CRIAR USUÁRIO NO AUTH
               ============================================= */

            const {
                data,
                error
            } =
                await supabaseClient.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        data: {
                            username: username,
                            display_name: displayName
                        }

                    }

                });


            if (error) {

                showMessage(
                    translateSignupError(error),
                    "error"
                );

                return;

            }


            if (!data.user) {

                showMessage(
                    "Não foi possível concluir o cadastro.",
                    "error"
                );

                return;

            }


            /* =============================================
               CRIAR PERFIL
               ============================================= */

            /*
             * Se o Supabase estiver configurado para exigir
             * confirmação de e-mail, pode não existir sessão
             * neste momento.
             *
             * Nesse caso, o perfil será criado após o primeiro
             * login em uma etapa posterior.
             */

            if (data.session) {

                const {
                    error: profileError
                } =
                    await supabaseClient
                        .from("profiles")
                        .insert({

                            id: data.user.id,

                            username: username,

                            display_name:
                                displayName

                        });


                if (profileError) {

                    console.error(
                        "Erro ao criar perfil:",
                        profileError
                    );


                    showMessage(
                        "Sua conta foi criada, mas ocorreu um erro ao preparar o perfil.",
                        "error"
                    );

                    return;

                }

            }


            /* =============================================
               SUCESSO
               ============================================= */

            if (data.session) {

                showMessage(
                    "Conta criada com sucesso! Entrando na Nostal™...",
                    "success"
                );


                setTimeout(
                    function() {

                        window.location.href =
                            "perfil.html";

                    },
                    1200
                );

            } else {

                showMessage(
                    "Conta criada! Verifique seu e-mail para confirmar o cadastro e depois faça login.",
                    "success"
                );


                setTimeout(
                    function() {

                        window.location.href =
                            "index.html";

                    },
                    3000
                );

            }


        } catch (error) {

            console.error(
                "Erro inesperado:",
                error
            );


            showMessage(
                "Não foi possível concluir o cadastro. Tente novamente.",
                "error"
            );


        } finally {

            button.disabled = false;

            button.textContent =
                "CRIAR MINHA CONTA!";

        }

    }
);


/* =========================================================
   CONTADOR DE USUÁRIOS
   ========================================================= */

async function loadRegisteredUsers() {

    const element =
        document.getElementById(
            "registeredUsers"
        );


    if (!element) {
        return;
    }


    const {
        count,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            );


    if (error) {

        console.error(
            "Erro ao contar usuários:",
            error
        );

        element.textContent = "----";

        return;

    }


    element.textContent =
        Number(count || 0)
            .toLocaleString("pt-BR");

}


/* =========================================================
   INICIAR
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadRegisteredUsers();

    }
);