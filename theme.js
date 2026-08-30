/* =========================================================
   NOSTAL™ — TEMA GLOBAL
   Carrega o tema salvo pelo usuário
   ========================================================= */

const THEME_DEFAULT = "classic";

const VALID_THEMES = [
    "classic",
    "frutiger-aero",
    "dark",
    "rainbow"
];


/* =========================================================
   APLICAR TEMA
   ========================================================= */

function applyGlobalTheme(theme) {

    if (!VALID_THEMES.includes(theme)) {
        theme = THEME_DEFAULT;
    }

    document.body.dataset.theme = theme;

    try {

        localStorage.setItem(
            "nostal-theme",
            theme
        );

    } catch (error) {

        console.warn(
            "Não foi possível salvar o tema localmente:",
            error
        );

    }

}


/* =========================================================
   CARREGAR TEMA
   ========================================================= */

async function loadGlobalTheme() {

    /*
     * Primeiro usamos o tema local.
     * Isso faz a página aparecer rapidamente
     * com o último tema conhecido.
     */

    let theme = THEME_DEFAULT;

    try {

        const localTheme =
            localStorage.getItem(
                "nostal-theme"
            );

        if (
            VALID_THEMES.includes(
                localTheme
            )
        ) {

            theme = localTheme;

        }

    } catch (error) {

        console.warn(
            "Não foi possível ler o tema local:",
            error
        );

    }


    applyGlobalTheme(theme);


    /*
     * Depois consultamos o Supabase
     * para confirmar o tema da conta.
     */

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();


        if (
            error ||
            !data ||
            !data.user
        ) {

            return;

        }


        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .select("theme")
                .eq(
                    "id",
                    data.user.id
                )
                .single();


        if (
            profileError
        ) {

            console.warn(
                "Não foi possível carregar o tema do perfil:",
                profileError
            );

            return;

        }


        if (
            profile &&
            VALID_THEMES.includes(
                profile.theme
            )
        ) {

            applyGlobalTheme(
                profile.theme
            );

        }

    } catch (error) {

        console.warn(
            "Erro ao carregar o tema global:",
            error
        );

    }

}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadGlobalTheme();

    }
);