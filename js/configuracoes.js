/* =========================================================
   NOSTAL™ — CONFIGURAÇÕES
   Perfil, foto e temas
   ========================================================= */


/* =========================================================
   CONFIGURAÇÃO DO SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://ckevzcryjtivbrbsnhyq.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_seTOWKCN-oD-aMw4FkNuuQ_6k5JVsnT";

const STORAGE_BUCKET =
    "nostal-media";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   VARIÁVEIS
   ========================================================= */

let currentUser = null;
let currentProfile = null;


/* =========================================================
   TEMAS DISPONÍVEIS
   ========================================================= */

const AVAILABLE_THEMES = [
    "classic",
    "frutiger-aero",
    "dark",
    "rainbow"
];


const DEFAULT_THEME =
    "classic";


/* =========================================================
   ELEMENTOS
   ========================================================= */

const form =
    document.getElementById(
        "settingsForm"
    );


const message =
    document.getElementById(
        "settingsMessage"
    );


const avatarPreview =
    document.getElementById(
        "avatarPreview"
    );


const avatarFile =
    document.getElementById(
        "avatarFile"
    );


const themeSelect =
    document.getElementById(
        "profileTheme"
    );


const accountEmail =
    document.getElementById(
        "accountEmail"
    );


/* =========================================================
   MENSAGEM
   ========================================================= */

function showMessage(
    text,
    success = false
) {

    if (!message) {
        return;
    }


    message.hidden =
        false;


    message.textContent =
        text;


    message.className =
        success
            ? "form-message success"
            : "form-message error";

}


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   VALIDAR TEMA
   ========================================================= */

function isValidTheme(
    theme
) {

    return AVAILABLE_THEMES.includes(
        theme
    );

}


/* =========================================================
   APLICAR TEMA
   ========================================================= */

function applyTheme(
    theme
) {

    if (
        !isValidTheme(theme)
    ) {

        theme =
            DEFAULT_THEME;

    }


    document.body.dataset.theme =
        theme;


    /*
     * Também salvamos localmente.
     *
     * Isso permite que o tema apareça
     * imediatamente enquanto o perfil
     * é carregado do Supabase.
     */

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
   CARREGAR TEMA LOCAL
   ========================================================= */

function loadLocalTheme() {

    let theme =
        DEFAULT_THEME;


    try {

        const savedTheme =
            localStorage.getItem(
                "nostal-theme"
            );


        if (
            isValidTheme(
                savedTheme
            )
        ) {

            theme =
                savedTheme;

        }

    } catch (error) {

        console.warn(
            "Não foi possível carregar o tema local:",
            error
        );

    }


    applyTheme(
        theme
    );


    if (themeSelect) {

        themeSelect.value =
            theme;

    }


    return theme;

}


/* =========================================================
   ATUALIZAR PREVIEW DOS TEMAS
   ========================================================= */

function updateThemePreview(
    selectedTheme
) {

    document
        .querySelectorAll(
            ".theme-preview-card"
        )
        .forEach(
            function(card) {

                const cardTheme =
                    card.dataset.previewTheme;


                card.classList.toggle(
                    "selected",
                    cardTheme ===
                        selectedTheme
                );

            }
        );

}


/* =========================================================
   SELEÇÃO DE TEMA
   ========================================================= */

if (themeSelect) {

    themeSelect.addEventListener(
        "change",
        function() {

            const theme =
                this.value;


            if (
                !isValidTheme(theme)
            ) {

                return;

            }


            /*
             * Aplica imediatamente,
             * sem precisar salvar.
             */

            applyTheme(
                theme
            );


            updateThemePreview(
                theme
            );

        }
    );

}


/* =========================================================
   CLIQUE NOS CARTÕES DE PREVIEW
   ========================================================= */

document
    .querySelectorAll(
        ".theme-preview-card"
    )
    .forEach(
        function(card) {

            card.addEventListener(
                "click",
                function() {

                    const theme =
                        card.dataset.previewTheme;


                    if (
                        !isValidTheme(theme)
                    ) {

                        return;

                    }


                    if (themeSelect) {

                        themeSelect.value =
                            theme;

                    }


                    applyTheme(
                        theme
                    );


                    updateThemePreview(
                        theme
                    );

                }
            );

        }
    );


/* =========================================================
   CARREGAR PERFIL
   ========================================================= */

async function loadProfile() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (
        error ||
        !data.user
    ) {

        window.location.href =
            "index.html";

        return;

    }


    currentUser =
        data.user;


    if (accountEmail) {

        accountEmail.value =
            currentUser.email || "";

    }


    const {
        data: profile,
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .single();


    if (profileError) {

        console.error(
            profileError
        );


        showMessage(
            "Não foi possível carregar seu perfil."
        );

        return;

    }


    currentProfile =
        profile;


    /* =====================================================
       DADOS DO PERFIL
       ===================================================== */

    const displayName =
        document.getElementById(
            "displayName"
        );


    const username =
        document.getElementById(
            "username"
        );


    const bio =
        document.getElementById(
            "bio"
        );


    const status =
        document.getElementById(
            "status"
        );


    if (displayName) {

        displayName.value =
            profile.display_name || "";

    }


    if (username) {

        username.value =
            profile.username || "";

    }


    if (bio) {

        bio.value =
            profile.bio || "";

    }


    if (status) {

        status.value =
            profile.status || "";

    }


    /* =====================================================
       FOTO DE PERFIL
       ===================================================== */

    if (
        profile.avatar_url &&
        avatarPreview
    ) {

        avatarPreview.innerHTML = `

            <img
                src="${escapeHTML(
                    profile.avatar_url
                )}"
                alt="Foto de perfil">

        `;

    }


    /* =====================================================
       TEMA
       ===================================================== */

    const profileTheme =
        isValidTheme(
            profile.theme
        )
            ? profile.theme
            : DEFAULT_THEME;


    if (themeSelect) {

        themeSelect.value =
            profileTheme;

    }


    applyTheme(
        profileTheme
    );


    updateThemePreview(
        profileTheme
    );

}


/* =========================================================
   UPLOAD DA FOTO
   ========================================================= */

async function uploadAvatar(
    file
) {

    if (!file) {

        return currentProfile?.avatar_url ||
            null;

    }


    const allowedTypes = [

        "image/jpeg",
        "image/png",
        "image/webp"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            "A foto precisa ser JPG, PNG ou WebP."
        );

    }


    if (
        file.size >
        10 * 1024 * 1024
    ) {

        throw new Error(
            "A foto não pode ter mais de 10 MB."
        );

    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const path =
        `${currentUser.id}/avatar-${crypto.randomUUID()}.${extension}`;


    const {
        error
    } =
        await supabaseClient
            .storage
            .from(
                STORAGE_BUCKET
            )
            .upload(
                path,
                file,
                {
                    upsert: false,
                    contentType:
                        file.type
                }
            );


    if (error) {

        throw error;

    }


    const {
        data
    } =
        supabaseClient
            .storage
            .from(
                STORAGE_BUCKET
            )
            .getPublicUrl(
                path
            );


    return data.publicUrl;

}


/* =========================================================
   SALVAR ALTERAÇÕES
   ========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            if (!currentUser) {

                showMessage(
                    "Você não está logado."
                );

                return;

            }


            const button =
                form.querySelector(
                    "button[type='submit']"
                );


            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "SALVANDO...";

            }


            try {

                const selectedTheme =
                    themeSelect
                        ? themeSelect.value
                        : DEFAULT_THEME;


                if (
                    !isValidTheme(
                        selectedTheme
                    )
                ) {

                    throw new Error(
                        "Tema selecionado inválido."
                    );

                }


                const selectedAvatar =
                    avatarFile
                        ? avatarFile.files[0]
                        : null;


                const avatarUrl =
                    await uploadAvatar(
                        selectedAvatar
                    );


                const updates = {

                    display_name:
                        document
                            .getElementById(
                                "displayName"
                            )
                            .value
                            .trim(),

                    username:
                        document
                            .getElementById(
                                "username"
                            )
                            .value
                            .trim(),

                    bio:
                        document
                            .getElementById(
                                "bio"
                            )
                            .value
                            .trim() ||
                        null,

                    status:
                        document
                            .getElementById(
                                "status"
                            )
                            .value
                            .trim() ||
                        null,

                    avatar_url:
                        avatarUrl,

                    theme:
                        selectedTheme

                };


                const {
                    error
                } =
                    await supabaseClient
                        .from("profiles")
                        .update(
                            updates
                        )
                        .eq(
                            "id",
                            currentUser.id
                        );


                if (error) {

                    throw error;

                }


                currentProfile = {

                    ...currentProfile,
                    ...updates

                };


                /*
                 * Atualiza o tema imediatamente
                 * e também mantém uma cópia local.
                 */

                applyTheme(
                    selectedTheme
                );


                updateThemePreview(
                    selectedTheme
                );


                showMessage(
                    "Perfil atualizado com sucesso! 🎉",
                    true
                );


                /*
                 * Limpa o input de arquivo depois
                 * de um upload bem-sucedido.
                 */

                if (avatarFile) {

                    avatarFile.value =
                        "";

                }


            } catch (error) {

                console.error(
                    "Erro ao salvar configurações:",
                    error
                );


                let errorMessage =
                    error?.message ||
                    "Erro desconhecido.";


                /*
                 * Mensagens mais amigáveis
                 * para erros comuns.
                 */

                if (
                    errorMessage
                        .toLowerCase()
                        .includes(
                            "row-level security"
                        )
                ) {

                    errorMessage =
                        "Você não tem permissão para atualizar este perfil.";

                }


                if (
                    errorMessage
                        .toLowerCase()
                        .includes(
                            "duplicate"
                        )
                ) {

                    errorMessage =
                        "Este nome de usuário já está sendo usado.";

                }


                showMessage(
                    "Não foi possível salvar: " +
                    errorMessage
                );


            } finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "💾 SALVAR ALTERAÇÕES";

                }

            }

        }
    );

}


/* =========================================================
   PREVIEW DA FOTO
   ========================================================= */

if (avatarFile) {

    avatarFile.addEventListener(
        "change",
        function() {

            const file =
                this.files[0];


            if (!file) {
                return;
            }


            const allowedTypes = [

                "image/jpeg",
                "image/png",
                "image/webp"

            ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                showMessage(
                    "A foto precisa ser JPG, PNG ou WebP."
                );


                this.value =
                    "";


                return;

            }


            if (
                file.size >
                10 * 1024 * 1024
            ) {

                showMessage(
                    "A foto não pode ter mais de 10 MB."
                );


                this.value =
                    "";


                return;

            }


            const url =
                URL.createObjectURL(
                    file
                );


            if (avatarPreview) {

                avatarPreview.innerHTML = `

                    <img
                        src="${url}"
                        alt="Prévia da foto">

                `;

            }

        }
    );

}


/* =========================================================
   EXCLUSÃO DA CONTA
   ========================================================= */

const deleteAccountButton =
    document.getElementById(
        "deleteAccountButton"
    );


if (deleteAccountButton) {

    deleteAccountButton.addEventListener(
        "click",
        async function() {

            /*
             * A exclusão completa de uma conta
             * requer uma operação administrativa
             * do Supabase e não deve ser feita
             * diretamente com a chave pública.
             */

            alert(
                "A exclusão de contas ainda não está disponível nesta versão da Nostal™."
            );

        }
    );

}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        /*
         * Aplica rapidamente o último tema
         * conhecido enquanto o Supabase carrega.
         */

        loadLocalTheme();


        /*
         * Depois carrega o perfil e substitui
         * pelo tema salvo na conta.
         */

        loadProfile();

    }
);