/* =========================================================
   NOSTAL™ — INDEX.JS
   Login, sessão, contadores e presença
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
   MENSAGENS
   ========================================================= */

const WARN_NOT_LOGGED =
    "Você não está logado. Clique em OK para voltar a página inicial e fazer login ou clique em CANCELAR para continuar offline.";

const WARN_NO_ACCOUNT =
    "Esta conta não está cadastrada. Clique em OK para ir para a página de criação de conta ou clique em CANCELAR para não criar.";


/* =========================================================
   ELEMENTOS
   ========================================================= */

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const rememberInput =
    document.getElementById("remember");


/* =========================================================
   ID DA SESSÃO DO VISITANTE
   ========================================================= */

function getVisitorSessionId() {

    let sessionId =
        sessionStorage.getItem(
            "nostal_session_id"
        );


    if (!sessionId) {

        sessionId =
            crypto.randomUUID();

        sessionStorage.setItem(
            "nostal_session_id",
            sessionId
        );

    }


    return sessionId;

}


/* =========================================================
   REGISTRAR VISITA
   ========================================================= */

async function registerVisit() {

    const sessionId =
        getVisitorSessionId();


    try {

        const { error } =
            await supabaseClient.rpc(
                "register_site_visit",
                {
                    p_session_id: sessionId
                }
            );


        if (error) {

            console.error(
                "Erro ao registrar visita:",
                error
            );

            return;

        }


        console.log(
            "Sessão de visitante registrada."
        );


    } catch (error) {

        console.error(
            "Erro inesperado ao registrar visita:",
            error
        );

    }

}


/* =========================================================
   CONTADOR DE VISITAS
   ========================================================= */

async function loadVisitorCounter() {

    const counter =
        document.getElementById(
            "visitorCounter"
        );


    if (!counter) {
        return;
    }


    try {

        const { data, error } =
            await supabaseClient.rpc(
                "get_site_visit_count"
            );


        if (error) {

            console.error(
                "Erro ao carregar contador:",
                error
            );

            counter.textContent =
                "------";

            return;

        }


        counter.textContent =
            Number(data || 0)
                .toLocaleString("pt-BR");


    } catch (error) {

        console.error(
            "Erro inesperado no contador:",
            error
        );

        counter.textContent =
            "------";

    }

}


/* =========================================================
   USUÁRIOS CADASTRADOS
   ========================================================= */

async function loadRegisteredUsers() {

    /*
     * O index.html atual ainda não possui um elemento
     * específico para este contador.
     *
     * A função já fica preparada para quando adicionarmos
     * o elemento.
     */

    const counter =
        document.getElementById(
            "registeredUsers"
        );


    if (!counter) {
        return;
    }


    try {

        const { data, error } =
            await supabaseClient.rpc(
                "get_registered_user_count"
            );


        if (error) {

            console.error(
                "Erro ao carregar usuários cadastrados:",
                error
            );

            counter.textContent =
                "----";

            return;

        }


        counter.textContent =
            Number(data || 0)
                .toLocaleString("pt-BR");


    } catch (error) {

        console.error(
            "Erro inesperado ao carregar usuários:",
            error
        );

    }

}


/* =========================================================
   USUÁRIOS ATIVOS
   ========================================================= */

async function loadActiveUsers() {

    /*
     * O index.html atual ainda não possui um elemento
     * específico para este contador.
     *
     * A função ficará pronta para a futura caixa
     * de usuários ativos.
     */

    const counter =
        document.getElementById(
            "activeUsers"
        );


    if (!counter) {
        return;
    }


    try {

        const { data, error } =
            await supabaseClient.rpc(
                "get_active_user_count"
            );


        if (error) {

            console.error(
                "Erro ao carregar usuários ativos:",
                error
            );

            counter.textContent =
                "----";

            return;

        }


        counter.textContent =
            Number(data || 0)
                .toLocaleString("pt-BR");


    } catch (error) {

        console.error(
            "Erro inesperado ao carregar usuários ativos:",
            error
        );

    }

}


/* =========================================================
   ATUALIZAR ATIVIDADE DO USUÁRIO
   ========================================================= */

async function updateUserActivity() {

    const user =
        await getCurrentUser();


    if (!user) {
        return;
    }


    try {

        const { error } =
            await supabaseClient.rpc(
                "update_user_activity"
            );


        if (error) {

            console.error(
                "Erro ao atualizar atividade:",
                error
            );

            return;

        }


        console.log(
            "Atividade do usuário atualizada."
        );


    } catch (error) {

        console.error(
            "Erro inesperado ao atualizar atividade:",
            error
        );

    }

}


/* =========================================================
   LOGIN
   ========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            if (!email || !password) {

                alert(
                    "Digite seu e-mail e sua senha."
                );

                return;

            }


            const button =
                loginForm.querySelector(
                    ".login-button"
                );


            if (button) {

                button.disabled = true;

                button.textContent =
                    "ENTRANDO...";

            }


            try {

                const { data, error } =
                    await supabaseClient.auth
                        .signInWithPassword({

                            email: email,

                            password: password

                        });


                if (error) {

                    console.error(
                        "Erro de login:",
                        error
                    );


                    /*
                     * O Supabase não informa ao navegador
                     * se o e-mail não existe ou se a senha
                     * está incorreta.
                     */

                    const createAccount =
                        confirm(
                            WARN_NO_ACCOUNT
                        );


                    if (createAccount) {

                        window.location.href =
                            "criarconta.html";

                    }

                    return;

                }


                if (data && data.session) {

                    console.log(
                        "Login realizado com sucesso."
                    );


                    await updateUserActivity();


                    window.location.href =
                        "perfil.html";

                }


            } catch (error) {

                console.error(
                    "Erro inesperado:",
                    error
                );


                alert(
                    "Não foi possível conectar à Nostal™. Verifique sua conexão com a internet e tente novamente."
                );


            } finally {

                if (button) {

                    button.disabled = false;

                    button.textContent =
                        "ENTRAR NA NOSTAL!";

                }

            }

        }
    );

}


/* =========================================================
   USUÁRIO ATUAL
   ========================================================= */

async function getCurrentUser() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();


        if (error) {

            return null;

        }


        return data.user || null;


    } catch (error) {

        console.error(
            "Erro ao verificar usuário:",
            error
        );

        return null;

    }

}


/* =========================================================
   VERIFICAR LOGIN
   ========================================================= */

async function requireLogin() {

    const user =
        await getCurrentUser();


    if (!user) {

        const goToLogin =
            confirm(
                WARN_NOT_LOGGED
            );


        if (goToLogin) {

            window.location.href =
                "index.html";

        }


        return false;

    }


    return true;

}


/* =========================================================
   LINKS PROTEGIDOS
   ========================================================= */

function setupProtectedLinks() {

    const protectedLinks = [

        "usuarios.html",

        "comunidades.html",

        "amigos.html",

        "mensagens.html",

        "perfil.html",

        "posts.html"

    ];


    document
        .querySelectorAll("a[href]")
        .forEach(function(link) {

            const href =
                link.getAttribute("href");


            if (!protectedLinks.includes(href)) {
                return;
            }


            link.addEventListener(
                "click",
                async function(event) {

                    const logged =
                        await requireLogin();


                    if (!logged) {

                        event.preventDefault();

                    }

                }
            );

        });

}


/* =========================================================
   ESTADO DA PÁGINA
   ========================================================= */

async function loadPageState() {

    const user =
        await getCurrentUser();


    if (user) {

        console.log(
            "Usuário conectado:",
            user.email
        );


        await updateUserActivity();


    } else {

        console.log(
            "Visitante não autenticado."
        );

    }

}


/* =========================================================
   POSTS RECENTES
   ========================================================= */

async function loadRecentPosts() {

    const container =
        document.getElementById(
            "recentPosts"
        );


    if (!container) {
        return;
    }


    /*
     * O sistema de posts será implementado
     * posteriormente em posts.js.
     */

    console.log(
        "Área de posts pronta para integração."
    );

}


/* =========================================================
   PESSOAS ONLINE
   ========================================================= */

async function loadOnlineUsers() {

    const container =
        document.getElementById(
            "onlineFriends"
        );


    if (!container) {
        return;
    }


    /*
     * Por enquanto mostramos o contador real
     * de usuários ativos.
     *
     * A lista individual de usuários online
     * será implementada posteriormente.
     */

    const { data, error } =
        await supabaseClient.rpc(
            "get_active_user_count"
        );


    if (error) {

        console.error(
            "Erro ao carregar usuários ativos:",
            error
        );

        container.innerHTML =
            '<div class="online-loading">Não foi possível carregar.</div>';

        return;

    }


    const count =
        Number(data || 0);


    container.innerHTML = `
        <div class="online-loading">
            🟢 ${count.toLocaleString("pt-BR")}
            ${count === 1 ? "usuário ativo" : "usuários ativos"}
        </div>
    `;

}


/* =========================================================
   OBSERVAR MUDANÇAS DE LOGIN
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
    async function(event, session) {

        console.log(
            "Estado de autenticação:",
            event
        );


        if (session) {

            console.log(
                "Usuário autenticado."
            );


            /*
             * Atualiza a atividade após login.
             */

            setTimeout(
                updateUserActivity,
                0
            );


        } else {

            console.log(
                "Usuário desconectado."
            );

        }

    }
);


/* =========================================================
   ATUALIZAÇÃO PERIÓDICA DE ATIVIDADE
   ========================================================= */

setInterval(
    async function() {

        const user =
            await getCurrentUser();


        if (user) {

            await updateUserActivity();

        }

    },
    60 * 1000
);


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        /*
         * Registra a sessão do visitante.
         * sessionStorage impede que F5 gere
         * uma nova visita.
         */

        await registerVisit();


        /*
         * Carrega os dados da página.
         */

        await loadPageState();


        /*
         * Contadores.
         */

        await loadVisitorCounter();

        await loadRegisteredUsers();

        await loadActiveUsers();


        /*
         * Área de posts.
         */

        await loadRecentPosts();


        /*
         * Usuários ativos.
         */

        await loadOnlineUsers();


        /*
         * Links que exigem autenticação.
         */

        setupProtectedLinks();

    }
);