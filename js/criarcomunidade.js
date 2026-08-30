/* =========================================================
   NOSTAL™ — CRIAR COMUNIDADE
   ========================================================= */


/* =========================================================
   CONFIGURAÇÃO DO SUPABASE
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

const createCommunityForm =
    document.getElementById(
        "createCommunityForm"
    );

const communityName =
    document.getElementById(
        "communityName"
    );

const communityDescription =
    document.getElementById(
        "communityDescription"
    );

const communityAvatar =
    document.getElementById(
        "communityAvatar"
    );

const communityMessage =
    document.getElementById(
        "communityMessage"
    );


/* =========================================================
   MENSAGENS
   ========================================================= */

const WARN_NOT_LOGGED =
    "Você não está logado. Clique em OK para voltar a página inicial e fazer login ou clique em CANCELAR para continuar offline.";


/* =========================================================
   MOSTRAR MENSAGEM
   ========================================================= */

function showMessage(
    message,
    type = "error"
) {

    if (!communityMessage) {
        alert(message);
        return;
    }


    communityMessage.hidden = false;

    communityMessage.textContent =
        message;


    communityMessage.className =
        "form-message " + type;

}


/* =========================================================
   VERIFICAR LOGIN
   ========================================================= */

async function getCurrentUser() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (error) {

        console.error(
            "Erro ao verificar usuário:",
            error
        );

        return null;

    }


    return data.user || null;

}


async function checkLogin() {

    const user =
        await getCurrentUser();


    if (!user) {

        const goLogin =
            confirm(
                WARN_NOT_LOGGED
            );


        if (goLogin) {

            window.location.href =
                "index.html";

        }


        return false;

    }


    return true;

}


/* =========================================================
   LIMPAR NOME DE ARQUIVO
   ========================================================= */

function createSafeFileName(
    file
) {

    const extension =
        file.name.includes(".")
            ? file.name
                .split(".")
                .pop()
                .toLowerCase()
            : "";


    const randomName =
        crypto.randomUUID();


    return (
        randomName +
        (extension
            ? "." + extension
            : "")
    );

}


/* =========================================================
   UPLOAD DA IMAGEM
   ========================================================= */

async function uploadCommunityAvatar(
    file,
    userId
) {

    if (!file) {
        return null;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    ];


    if (!allowedTypes.includes(
        file.type
    )) {

        throw new Error(
            "A imagem precisa estar no formato JPG, PNG, GIF ou WebP."
        );

    }


    const maxSize =
        10 * 1024 * 1024;


    if (file.size > maxSize) {

        throw new Error(
            "A imagem não pode ter mais de 10 MB."
        );

    }


    const fileName =
        createSafeFileName(file);


    const filePath =
        userId +
        "/communities/" +
        fileName;


    const {
        error
    } =
        await supabaseClient
            .storage
            .from("nostal-media")
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );


    if (error) {

        console.error(
            "Erro no upload:",
            error
        );

        throw new Error(
            "Não foi possível enviar a imagem da comunidade."
        );

    }


    const {
        data
    } =
        supabaseClient
            .storage
            .from("nostal-media")
            .getPublicUrl(
                filePath
            );


    return data.publicUrl;

}


/* =========================================================
   CRIAR COMUNIDADE
   ========================================================= */

if (createCommunityForm) {

    createCommunityForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const logged =
                await checkLogin();


            if (!logged) {
                return;
            }


            const user =
                await getCurrentUser();


            if (!user) {
                return;
            }


            const name =
                communityName.value.trim();


            const description =
                communityDescription.value.trim();


            const avatarFile =
                communityAvatar.files[0];


            /* -----------------------------
               VALIDAÇÕES
               ----------------------------- */

            if (!name) {

                showMessage(
                    "Digite o nome da comunidade."
                );

                communityName.focus();

                return;

            }


            if (name.length < 3) {

                showMessage(
                    "O nome da comunidade precisa ter pelo menos 3 caracteres."
                );

                communityName.focus();

                return;

            }


            if (!description) {

                showMessage(
                    "Digite uma descrição para a comunidade."
                );

                communityDescription.focus();

                return;

            }


            if (description.length < 10) {

                showMessage(
                    "A descrição precisa ter pelo menos 10 caracteres."
                );

                communityDescription.focus();

                return;

            }


            /* -----------------------------
               BOTÃO
               ----------------------------- */

            const button =
                createCommunityForm.querySelector(
                    'button[type="submit"]'
                );


            if (button) {

                button.disabled = true;

                button.textContent =
                    "CRIANDO...";

            }


            try {

                let avatarUrl = null;


                /* -------------------------
                   UPLOAD
                   ------------------------- */

                if (avatarFile) {

                    showMessage(
                        "Enviando imagem da comunidade...",
                        "info"
                    );


                    avatarUrl =
                        await uploadCommunityAvatar(
                            avatarFile,
                            user.id
                        );

                }


                /* -------------------------
                   CRIAR REGISTRO
                   ------------------------- */

                showMessage(
                    "Criando comunidade...",
                    "info"
                );


                const {
                    data: community,
                    error
                } =
                    await supabaseClient
                        .from("communities")
                        .insert({

                            name: name,

                            description:
                                description,

                            creator_id:
                                user.id,

                            avatar_url:
                                avatarUrl

                        })
                        .select()
                        .single();


                if (error) {

                    console.error(
                        "Erro ao criar comunidade:",
                        error
                    );

                    throw new Error(
                        "Não foi possível criar a comunidade."
                    );

                }


                /* -------------------------
                   ADICIONAR CRIADOR
                   ------------------------- */

                const {
                    error:
                    memberError
                } =
                    await supabaseClient
                        .from(
                            "community_members"
                        )
                        .insert({

                            community_id:
                                community.id,

                            user_id:
                                user.id

                        });


                if (memberError) {

                    console.error(
                        "Erro ao adicionar criador:",
                        memberError
                    );

                    /*
                     * A comunidade já foi criada.
                     * Informamos isso ao usuário.
                     */

                    showMessage(
                        "A comunidade foi criada, mas não foi possível adicionar você como membro.",
                        "error"
                    );

                    return;

                }


                /* -------------------------
                   SUCESSO
                   ------------------------- */

                showMessage(
                    "🎉 Comunidade criada com sucesso!",
                    "success"
                );


                setTimeout(
                    function() {

                        window.location.href =
                            "comunidades.html";

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "Erro ao criar comunidade:",
                    error
                );


                showMessage(
                    error.message ||
                    "Ocorreu um erro ao criar a comunidade."
                );


            } finally {

                if (button) {

                    button.disabled = false;

                    button.textContent =
                        "🌎 CRIAR COMUNIDADE";

                }

            }

        }
    );

}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        await checkLogin();

    }
);