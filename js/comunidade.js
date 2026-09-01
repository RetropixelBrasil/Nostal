/* =========================================================
   NOSTAL™ — COMUNIDADE
   ========================================================= */


/* =========================================================
   SUPABASE
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


let currentUser = null;
let currentCommunity = null;


/* =========================================================
   ELEMENTOS
   ========================================================= */

const communityHeader =
    document.getElementById("communityHeader");

const communityDescription =
    document.getElementById("communityDescription");

const communityMembers =
    document.getElementById("communityMembers");

const communityPosts =
    document.getElementById("communityPosts");

const communityActions =
    document.getElementById("communityActions");

const communityPostForm =
    document.getElementById("communityPostForm");

const communityPostContent =
    document.getElementById("communityPostContent");

const communityImageMenu =
    document.getElementById("communityImageMenu");

const communityGifMenu =
    document.getElementById("communityGifMenu");

const communityEmojiMenu =
    document.getElementById("communityEmojiMenu");


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatDate(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }


    return date.toLocaleString(
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}


function getCommunityId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get("id");

}


/* =========================================================
   LOGIN
   ========================================================= */

async function checkLogin() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (
        error ||
        !data.user
    ) {

        const goLogin =
            confirm(
                "Você não está logado. Clique em OK para voltar a página inicial e fazer login ou clique em CANCELAR para continuar offline."
            );


        if (goLogin) {

            window.location.href =
                "index.html";

        }


        return false;

    }


    currentUser =
        data.user;


    return true;

}


/* =========================================================
   CARREGAR COMUNIDADE
   ========================================================= */

async function loadCommunity() {

    const communityId =
        getCommunityId();


    if (!communityId) {

        showCommunityError(
            "Nenhuma comunidade foi especificada."
        );

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("communities")
            .select(`
                id,
                name,
                description,
                creator_id,
                avatar_url,
                created_at
            `)
            .eq(
                "id",
                communityId
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Erro ao carregar comunidade:",
            error
        );


        showCommunityError(
            "Não foi possível carregar esta comunidade."
        );


        return;

    }


    if (!data) {

        showCommunityError(
            "Esta comunidade não existe ou foi removida."
        );


        return;

    }


    currentCommunity =
        data;


    document.title =
        "Nostal™ — " +
        data.name;


    renderCommunityHeader();

    renderCommunityDescription();

    await renderCommunityMembers();

    await renderCommunityActions();

    setupReportButton();

    setupCommunityPostComposer();

    await loadCommunityPosts();

}


/* =========================================================
   CABEÇALHO
   ========================================================= */

function renderCommunityHeader() {

    if (
        !communityHeader ||
        !currentCommunity
    ) {
        return;
    }


    const avatar =
        currentCommunity.avatar_url
            ? `
                <img
                    src="${escapeHTML(
                        currentCommunity.avatar_url
                    )}"
                    alt="${escapeHTML(
                        currentCommunity.name
                    )}"
                    class="community-avatar">
              `
            : `
                <div class="community-avatar-placeholder">
                    🌎
                </div>
              `;


    communityHeader.innerHTML = `

        <div class="community-profile-header">

            ${avatar}

            <div class="community-profile-info">

                <h1>
                    ${escapeHTML(
                        currentCommunity.name
                    )}
                </h1>

                <div class="community-meta">

                    🌎 Comunidade da Nostal™

                    &nbsp;•&nbsp;

                    Criada em
                    ${formatDate(
                        currentCommunity.created_at
                    )}

                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   DESCRIÇÃO
   ========================================================= */

function renderCommunityDescription() {

    if (
        !communityDescription ||
        !currentCommunity
    ) {
        return;
    }


    communityDescription.innerHTML = `

        <p>
            ${escapeHTML(
                currentCommunity.description ||
                "Esta comunidade ainda não possui uma descrição."
            )}
        </p>

    `;

}


/* =========================================================
   VERIFICAR MEMBRO
   ========================================================= */

async function isCurrentUserMember() {

    if (
        !currentUser ||
        !currentCommunity
    ) {
        return false;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("community_members")
            .select("id")
            .eq(
                "community_id",
                currentCommunity.id
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Erro ao verificar participação:",
            error
        );


        return false;

    }


    return !!data;

}


/* =========================================================
   AÇÕES DA COMUNIDADE
   ========================================================= */

async function renderCommunityActions() {

    if (
        !communityActions ||
        !currentCommunity
    ) {
        return;
    }


    const isMember =
        await isCurrentUserMember();


    const isCreator =
        currentUser &&
        currentCommunity.creator_id ===
            currentUser.id;


    if (isCreator) {

        communityActions.innerHTML = `

            <p>
                👑 Você criou esta comunidade.
            </p>

            <button
                type="button"
                class="community-leave-button"
                disabled>

                👑 Criador

            </button>

        `;


        return;

    }


    if (isMember) {

        communityActions.innerHTML = `

            <p>
                ✅ Você faz parte desta comunidade.
            </p>

            <button
                type="button"
                id="leaveCommunityButton"
                class="community-leave-button">

                ❌ Sair da comunidade

            </button>

        `;


        document
            .getElementById(
                "leaveCommunityButton"
            )
            ?.addEventListener(
                "click",
                leaveCommunity
            );


        return;

    }


    communityActions.innerHTML = `

        <p>
            Você ainda não faz parte desta comunidade.
        </p>

        <button
            type="button"
            id="joinCommunityButton"
            class="community-join-button">

            ➕ Entrar na comunidade

        </button>

    `;


    document
        .getElementById(
            "joinCommunityButton"
        )
        ?.addEventListener(
            "click",
            joinCommunity
        );

}


/* =========================================================
   ENTRAR
   ========================================================= */

async function joinCommunity() {

    if (
        !currentUser ||
        !currentCommunity
    ) {
        return;
    }


    const button =
        document.getElementById(
            "joinCommunityButton"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "ENTRANDO...";

    }


    const {
        error
    } =
        await supabaseClient
            .from("community_members")
            .insert({

                community_id:
                    currentCommunity.id,

                user_id:
                    currentUser.id

            });


    if (error) {

        console.error(
            error
        );


        alert(
            error.code === "23505"
                ? "Você já faz parte desta comunidade."
                : "Não foi possível entrar na comunidade."
        );


        await renderCommunityActions();

        return;

    }


    alert(
        "🎉 Você entrou na comunidade!"
    );


    await renderCommunityActions();

    await renderCommunityMembers();

}


/* =========================================================
   SAIR
   ========================================================= */

async function leaveCommunity() {

    if (
        !currentUser ||
        !currentCommunity
    ) {
        return;
    }


    const confirmed =
        confirm(
            "Tem certeza de que deseja sair desta comunidade?"
        );


    if (!confirmed) {
        return;
    }


    const button =
        document.getElementById(
            "leaveCommunityButton"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "SAINDO...";

    }


    const {
        error
    } =
        await supabaseClient
            .from("community_members")
            .delete()
            .eq(
                "community_id",
                currentCommunity.id
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (error) {

        console.error(
            error
        );


        alert(
            "Não foi possível sair da comunidade."
        );


        await renderCommunityActions();

        return;

    }


    alert(
        "Você saiu da comunidade."
    );


    await renderCommunityActions();

    await renderCommunityMembers();

}


/* =========================================================
   MEMBROS
   ========================================================= */

async function renderCommunityMembers() {

    if (
        !communityMembers ||
        !currentCommunity
    ) {
        return;
    }


    communityMembers.innerHTML = `

        <div class="posts-loading">
            👥 Carregando membros...
        </div>

    `;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("community_members")
            .select(`
                id,
                user_id,
                joined_at
            `)
            .eq(
                "community_id",
                currentCommunity.id
            )
            .order(
                "joined_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);


        communityMembers.innerHTML =
            "<p>❌ Não foi possível carregar os membros.</p>";


        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        communityMembers.innerHTML =
            "<div class='user-empty'>👥 Esta comunidade ainda não possui membros.</div>";


        return;

    }


    const userIds =
        data.map(
            member =>
                member.user_id
        );


    const {
        data: profiles,
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .select(`
                id,
                username,
                display_name,
                avatar_url,
                status
            `)
            .in(
                "id",
                userIds
            );


    if (profileError) {

        console.error(
            profileError
        );


        communityMembers.innerHTML =
            "<p>❌ Não foi possível carregar os perfis.</p>";


        return;

    }


    const profileMap = {};


    (profiles || []).forEach(
        profile => {

            profileMap[
                profile.id
            ] = profile;

        }
    );


    communityMembers.innerHTML =
        "";

    communityMembers.classList.add(
        "users-list",
        "community-members-list"
    );


    data.forEach(
        member => {

            const profile =
                profileMap[
                    member.user_id
                ];


            const displayName =
                profile?.display_name ||
                profile?.username ||
                "Usuário";


            const username =
                profile?.username
                    ? "@" +
                      profile.username
                    : "";


            const avatar =
                profile?.avatar_url
                    ? `
                        <img
                            src="${escapeHTML(
                                profile.avatar_url
                            )}"
                            alt="${escapeHTML(
                                displayName
                            )}"
                            class="user-avatar">
                      `
                    : `
                        <div class="user-avatar-placeholder">
                            👤
                        </div>
                      `;


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "user-item";


            item.innerHTML = `

                ${avatar}

                <div class="user-item-info">

                    <a
                        href="perfil.html?id=${encodeURIComponent(
                            member.user_id
                        )}">

                        ${escapeHTML(
                            displayName
                        )}

                    </a>


                    ${
                        username
                            ? `
                                <p>
                                    ${escapeHTML(
                                        username
                                    )}
                                </p>
                              `
                            : ""
                    }


                    ${
                        profile?.status
                            ? `
                                <p>
                                    ${escapeHTML(
                                        profile.status
                                    )}
                                </p>
                              `
                            : ""
                    }


                    ${
                        member.user_id ===
                        currentCommunity.creator_id
                            ? `
                                <p class="community-owner">
                                    👑 Criador
                                </p>
                              `
                            : ""
                    }

                </div>

            `;


            communityMembers.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   DENÚNCIA
   ========================================================= */

function setupReportButton() {

    const button =
        document.getElementById(
            "reportCommunityButton"
        );


    if (
        !button ||
        !currentCommunity
    ) {
        return;
    }


    const subject =
        "Denúncia de comunidade — Nostal™";


    const body =
        "Olá, Retropixel.%0D%0A%0D%0A" +
        "Gostaria de denunciar a seguinte comunidade da Nostal™:%0D%0A%0D%0A" +
        "Nome: " +
        encodeURIComponent(
            currentCommunity.name
        ) +
        "%0D%0A" +
        "ID: " +
        encodeURIComponent(
            currentCommunity.id
        ) +
        "%0D%0A%0D%0A" +
        "Motivo da denúncia:%0D%0A%0D%0A";


    button.href =
        "mailto:Retropixel.10@hotmail.com" +
        "?subject=" +
        encodeURIComponent(
            subject
        ) +
        "&body=" +
        body;

}


/* =========================================================
   PODE PUBLICAR?
   ========================================================= */

async function canPostInCommunity() {

    if (
        !currentUser ||
        !currentCommunity
    ) {
        return false;
    }


    if (
        currentCommunity.creator_id ===
        currentUser.id
    ) {
        return true;
    }


    return await isCurrentUserMember();

}


/* =========================================================
   LISTA DE EMOJIS
   ========================================================= */

const communityEmojiList = [

    "😀","😃","😄","😁","😆","😅",
    "😂","🤣","😊","😇","🙂","🙃",
    "😉","😌","😍","🥰","😘","😗",
    "😎","🤓","🧐","🤩","🥳","😏",
    "😢","😭","😡","🤬","😱","😴",
    "🤔","🤨","😐","😑","🙄","😮",
    "😋","😛","😜","🤪","🤗","🤭",
    "👍","👎","👏","🙌","🙏","💪",
    "❤️","💚","💙","💛","🧡","💜",
    "🖤","🤍","🤎","💖","💯","🔥",
    "⭐","✨","🎉","🎊","💻","📸",
    "🎮","🎵","🎬","🌐","🌎","👥",
    "💬","📱","🖥️","⌨️","🖱️","🚀"

];


/* =========================================================
   MENU DE EMOJIS — COMUNIDADE
   ========================================================= */

function setupCommunityEmojiMenu() {

    const button =
        document.getElementById(
            "communityAddEmojiButton"
        );

    const menu =
        document.getElementById(
            "communityEmojiMenu"
        );

    const textarea =
        document.getElementById(
            "communityPostContent"
        );


    if (
        !button ||
        !menu ||
        !textarea
    ) {

        console.warn(
            "Elementos do menu de emojis da comunidade não encontrados."
        );

        return;

    }


    /* ==========================================
       CRIAR EMOJIS
       ========================================== */

    menu.innerHTML =
        communityEmojiList
            .map(
                emoji => `

                    <button
                        type="button"
                        class="emoji-option"
                        data-emoji="${emoji}">

                        ${emoji}

                    </button>

                `
            )
            .join("");


    /* ==========================================
       GARANTIR QUE COMEÇA FECHADO
       ========================================== */

    menu.hidden = true;

    menu.style.removeProperty("display");


    /* ==========================================
       ABRIR / FECHAR
       ========================================== */

    button.addEventListener(
        "click",
        function(event) {

            event.preventDefault();
            event.stopPropagation();


            const isOpen =
                !menu.hidden;


            /* Fechar */

            if (isOpen) {

                menu.hidden = true;

                menu.style.removeProperty(
                    "display"
                );

                return;

            }


            /* Abrir */

            menu.hidden = false;

            /*
             * Força a exibição mesmo que alguma
             * regra do CSS esteja escondendo o menu.
             */

            menu.style.setProperty(
                "display",
                "grid",
                "important"
            );

        }
    );


    /* ==========================================
       CLICAR EM EMOJI
       ========================================== */

    menu.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();


            const emojiButton =
                event.target.closest(
                    ".emoji-option"
                );


            if (!emojiButton) {
                return;
            }


            const emoji =
                emojiButton.dataset.emoji;


            const start =
                textarea.selectionStart;


            const end =
                textarea.selectionEnd;


            textarea.value =
                textarea.value.slice(
                    0,
                    start
                ) +
                emoji +
                textarea.value.slice(
                    end
                );


            textarea.focus();


            const newPosition =
                start +
                emoji.length;


            textarea.selectionStart =
                newPosition;

            textarea.selectionEnd =
                newPosition;


            /* Fechar menu */

            menu.hidden = true;

            menu.style.removeProperty(
                "display"
            );

        }
    );


    /* ==========================================
       CLICAR FORA
       ========================================== */

    document.addEventListener(
        "click",
        function(event) {

            if (
                event.target === button ||
                menu.contains(event.target)
            ) {

                return;

            }


            menu.hidden = true;

            menu.style.removeProperty(
                "display"
            );

        }
    );

}


/* =========================================================
   COMPOSITOR
   ========================================================= */

function setupCommunityPostComposer() {

    if (!communityPostForm) {
        return;
    }


    if (communityImageMenu) {

        communityImageMenu.hidden =
            true;

    }


    if (communityGifMenu) {

        communityGifMenu.hidden =
            true;

    }


    if (communityEmojiMenu) {

        communityEmojiMenu.hidden =
            true;

    }


    communityPostForm.addEventListener(
        "submit",
        handleCommunityPostSubmit
    );


    document
        .getElementById(
            "communityAddImageButton"
        )
        ?.addEventListener(
            "click",
            function(event) {

                event.preventDefault();


                const willOpen =
                    communityImageMenu?.hidden;


                if (communityGifMenu) {

                    communityGifMenu.hidden =
                        true;

                }


                if (communityEmojiMenu) {

                    communityEmojiMenu.hidden =
                        true;

                }


                if (communityImageMenu) {

                    communityImageMenu.hidden =
                        !willOpen;

                }

            }
        );


    document
        .getElementById(
            "communityAddGifButton"
        )
        ?.addEventListener(
            "click",
            function(event) {

                event.preventDefault();


                const willOpen =
                    communityGifMenu?.hidden;


                if (communityImageMenu) {

                    communityImageMenu.hidden =
                        true;

                }


                if (communityEmojiMenu) {

                    communityEmojiMenu.hidden =
                        true;

                }


                if (communityGifMenu) {

                    communityGifMenu.hidden =
                        !willOpen;

                }

            }
        );


    document
        .getElementById(
            "communityImageCancelButton"
        )
        ?.addEventListener(
            "click",
            function() {

                if (communityImageMenu) {

                    communityImageMenu.hidden =
                        true;

                }

            }
        );


    document
        .getElementById(
            "communityGifCancelButton"
        )
        ?.addEventListener(
            "click",
            function() {

                if (communityGifMenu) {

                    communityGifMenu.hidden =
                        true;

                }

            }
        );


    setupCommunityEmojiMenu();

}


/* =========================================================
   UPLOAD DE MÍDIA
   ========================================================= */

async function uploadCommunityMedia(file) {

    if (!file) {
        return null;
    }


    const allowedTypes = [

        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            "Formato de imagem não permitido."
        );

    }


    if (
        file.size >
        10 * 1024 * 1024
    ) {

        throw new Error(
            "A imagem não pode ter mais de 10 MB."
        );

    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const path =
        `${currentUser.id}/community-${currentCommunity.id}-${crypto.randomUUID()}.${extension}`;


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
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type
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
   PUBLICAR
   ========================================================= */

async function handleCommunityPostSubmit(event) {

    event.preventDefault();


    if (
        !currentUser ||
        !currentCommunity
    ) {

        alert(
            "Você precisa estar logado para publicar."
        );


        return;

    }


    const allowed =
        await canPostInCommunity();


    if (!allowed) {

        alert(
            "Você precisa fazer parte desta comunidade para publicar."
        );


        return;

    }


    const button =
        document.getElementById(
            "communityPublishButton"
        );


    const content =
        document
            .getElementById(
                "communityPostContent"
            )
            ?.value
            .trim() ||
        "";


    const imageUrl =
        document
            .getElementById(
                "communityImageUrl"
            )
            ?.value
            .trim() ||
        "";


    const gifUrl =
        document
            .getElementById(
                "communityGifUrl"
            )
            ?.value
            .trim() ||
        "";


    const imageFile =
        document
            .getElementById(
                "communityImageFile"
            )
            ?.files?.[0] ||
        null;


    const gifFile =
        document
            .getElementById(
                "communityGifFile"
            )
            ?.files?.[0] ||
        null;


    if (
        !content &&
        !imageUrl &&
        !gifUrl &&
        !imageFile &&
        !gifFile
    ) {

        alert(
            "Escreva algo ou adicione uma imagem/GIF."
        );


        return;

    }


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "PUBLICANDO...";

    }


    try {

        let finalImageUrl =
            imageUrl ||
            null;


        let finalGifUrl =
            gifUrl ||
            null;


        if (imageFile) {

            finalImageUrl =
                await uploadCommunityMedia(
                    imageFile
                );

        }


        if (gifFile) {

            finalGifUrl =
                await uploadCommunityMedia(
                    gifFile
                );

        }


        if (finalGifUrl) {

            finalImageUrl =
                null;

        }


        const {
            error
        } =
        await supabaseClient
            .from("posts")
            .insert({

                user_id:
                    currentUser.id,

                content:
                    content ||
                    null,

                image_url:
                    finalImageUrl,

                gif_url:
                    finalGifUrl,

                community_id:
                    currentCommunity.id,

                hidden:
                    false

            });


        if (error) {
            throw error;
        }


        communityPostForm.reset();


        if (communityImageMenu) {

            communityImageMenu.hidden =
                true;

        }


        if (communityGifMenu) {

            communityGifMenu.hidden =
                true;

        }


        if (communityEmojiMenu) {

            communityEmojiMenu.hidden =
                true;

        }


        alert(
            "🎉 Publicação criada com sucesso!"
        );


        await loadCommunityPosts();


    } catch (error) {

        console.error(
            "Erro ao publicar na comunidade:",
            error
        );


        alert(
            "Não foi possível publicar: " +
            error.message
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "PUBLICAR!";

        }

    }

}


/* =========================================================
   CARREGAR POSTS
   ========================================================= */

async function loadCommunityPosts() {

    if (
        !communityPosts ||
        !currentCommunity
    ) {
        return;
    }


    communityPosts.innerHTML = `

        <div class="posts-loading">
            📰 Carregando publicações...
        </div>

    `;


    const {
        data: posts,
        error
    } =
        await supabaseClient
            .from("posts")
            .select(`
                id,
                user_id,
                content,
                image_url,
                gif_url,
                created_at,
                hidden
            `)
            .eq(
                "community_id",
                currentCommunity.id
            )
            .eq(
                "hidden",
                false
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar publicações:",
            error
        );


        communityPosts.innerHTML =
            "<p>❌ Não foi possível carregar as publicações.</p>";


        return;

    }


    if (
        !posts ||
        !posts.length
    ) {

        communityPosts.innerHTML = `

            <div class="posts-loading">
                📰 Esta comunidade ainda não possui publicações.
            </div>

        `;


        return;

    }


    /* =====================================================
       OCULTAÇÕES INDIVIDUAIS
       ===================================================== */

    const {
        data: hiddenPosts,
        error: hiddenError
    } =
        await supabaseClient
            .from("post_hidden")
            .select("post_id")
            .eq("user_id", currentUser.id);


    if (hiddenError) {

        console.error(
            "Erro ao carregar posts ocultados:",
            hiddenError
        );

        communityPosts.innerHTML =
            "<p>❌ Não foi possível carregar suas preferências de publicações.</p>";

        return;

    }


    const hiddenPostIds =
        new Set(
            (hiddenPosts || []).map(
                item => item.post_id
            )
        );


    const visiblePosts =
        posts.filter(
            post => !hiddenPostIds.has(post.id)
        );


    if (!visiblePosts.length) {

        communityPosts.innerHTML = `
            <div class="posts-loading">
                📰 Não há publicações para mostrar.
            </div>
        `;

        return;

    }


    const userIds =
        [
            ...new Set(
                posts.map(
                    post =>
                        post.user_id
                )
            )
        ];


    const {
        data: profiles
    } =
        await supabaseClient
            .from("profiles")
            .select(`
                id,
                username,
                display_name,
                avatar_url
            `)
            .in(
                "id",
                userIds
            );


    const profileMap =
        new Map(
            (profiles || [])
                .map(
                    profile => [
                        profile.id,
                        profile
                    ]
                )
        );


    const postIds =
        visiblePosts.map(
            post =>
                post.id
        );


    const {
        data: likes,
        error: likesError
    } =
        await supabaseClient
            .from("likes")
            .select(
                "post_id,user_id"
            )
            .in(
                "post_id",
                postIds
            );


    if (likesError) {

        console.error(
            "Erro ao carregar likes:",
            likesError
        );

    }


    const {
        data: dislikes,
        error: dislikesError
    } =
        await supabaseClient
            .from("dislikes")
            .select(
                "post_id,user_id"
            )
            .in(
                "post_id",
                postIds
            );


    if (dislikesError) {

        console.error(
            "Erro ao carregar dislikes:",
            dislikesError
        );

    }


    const likesMap = {};
    const dislikesMap = {};


    (likes || []).forEach(
        like => {

            if (
                !likesMap[
                    like.post_id
                ]
            ) {

                likesMap[
                    like.post_id
                ] = [];

            }


            likesMap[
                like.post_id
            ].push(
                like.user_id
            );

        }
    );


    (dislikes || []).forEach(
        dislike => {

            if (
                !dislikesMap[
                    dislike.post_id
                ]
            ) {

                dislikesMap[
                    dislike.post_id
                ] = [];

            }


            dislikesMap[
                dislike.post_id
            ].push(
                dislike.user_id
            );

        }
    );


    communityPosts.innerHTML =
        "";


    visiblePosts.forEach(
        post => {

            const profile =
                profileMap.get(
                    post.user_id
                );


            const displayName =
                profile?.display_name ||
                profile?.username ||
                "Usuário";


            const username =
                profile?.username
                    ? "@" +
                      profile.username
                    : "";


            const avatar =
                profile?.avatar_url
                    ? `
                        <img
                            src="${escapeHTML(
                                profile.avatar_url
                            )}"
                            alt=""
                            class="post-avatar-image">
                      `
                    : "👤";


            const postLikes =
                likesMap[
                    post.id
                ] ||
                [];


            const postDislikes =
                dislikesMap[
                    post.id
                ] ||
                [];


            const userLiked =
                postLikes.includes(
                    currentUser.id
                );


            const userDisliked =
                postDislikes.includes(
                    currentUser.id
                );


            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "post";


            article.dataset.postId =
                post.id;


            article.innerHTML = `

                <div class="post-header">

                    <a
                        href="perfil.html?id=${encodeURIComponent(
                            post.user_id
                        )}"
                        class="post-avatar">

                        ${avatar}

                    </a>


                    <div>

                        <a
                            href="perfil.html?id=${encodeURIComponent(
                                post.user_id
                            )}">

                            <strong>
                                ${escapeHTML(
                                    displayName
                                )}
                            </strong>

                        </a>


                        ${
                            username
                                ? `
                                    <span class="post-username">
                                        ${escapeHTML(
                                            username
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                </div>


                <div class="post-content">

                    ${
                        post.content
                            ? `
                                <p>
                                    ${escapeHTML(
                                        post.content
                                    ).replaceAll(
                                        "\n",
                                        "<br>"
                                    )}
                                </p>
                              `
                            : ""
                    }


                    ${
                        post.image_url
                            ? `
                                <img
                                    class="post-image"
                                    src="${escapeHTML(
                                        post.image_url
                                    )}"
                                    alt="Imagem publicada">
                              `
                            : ""
                    }


                    ${
                        post.gif_url
                            ? `
                                <img
                                    class="post-image"
                                    src="${escapeHTML(
                                        post.gif_url
                                    )}"
                                    alt="GIF publicado">
                              `
                            : ""
                    }

                </div>


                <div class="post-date">

                    ${formatDate(
                        post.created_at
                    )}

                </div>


                <div class="post-actions">

                    <button
                        type="button"
                        data-action="like">

                        👍 ${postLikes.length}

                    </button>


                    <button
                        type="button"
                        data-action="dislike">

                        👎 ${postDislikes.length}

                    </button>


                    <button
                        type="button"
                        data-action="comments">

                        💬 Comentar

                    </button>


                    <button
                        type="button"
                        data-action="hide">

                        👁️ Ocultar

                    </button>


                    ${
                        post.user_id ===
                        currentUser.id
                            ? `
                                <button
                                    type="button"
                                    data-action="delete">

                                    🗑️ Excluir

                                </button>
                              `
                            : ""
                    }

                </div>


                <div
                    class="comments"
                    hidden>

                    <div>
                        Carregando comentários...
                    </div>

                </div>

            `;


            communityPosts.appendChild(
                article
            );


            setupCommunityPostActions(
                article,
                post,
                userLiked,
                userDisliked
            );

        }
    );

}


/* =========================================================
   AÇÕES DOS POSTS
   ========================================================= */

function setupCommunityPostActions(
    article,
    post
) {

    article
        .querySelector(
            '[data-action="like"]'
        )
        ?.addEventListener(
            "click",
            function() {

                toggleLike(
                    post.id
                );

            }
        );


    article
        .querySelector(
            '[data-action="dislike"]'
        )
        ?.addEventListener(
            "click",
            function() {

                toggleDislike(
                    post.id
                );

            }
        );


    article
        .querySelector(
            '[data-action="comments"]'
        )
        ?.addEventListener(
            "click",
            async function() {

                const comments =
                    article.querySelector(
                        ".comments"
                    );


                if (!comments) {
                    return;
                }


                comments.hidden =
                    !comments.hidden;


                if (!comments.hidden) {

                    await loadCommunityPostComments(
                        post.id,
                        comments
                    );

                }

            }
        );


    article
        .querySelector(
            '[data-action="hide"]'
        )
        ?.addEventListener(
            "click",
            function() {

                hideCommunityPost(
                    post.id
                );

            }
        );


    article
        .querySelector(
            '[data-action="delete"]'
        )
        ?.addEventListener(
            "click",
            function() {

                deleteCommunityPost(
                    post.id
                );

            }
        );

}


/* =========================================================
   LIKE
   ========================================================= */

async function toggleLike(postId) {

    if (!currentUser) {
        return;
    }


    const {
        data: existing,
        error: findError
    } =
        await supabaseClient
            .from("likes")
            .select("*")
            .eq(
                "post_id",
                postId
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


    if (findError) {

        console.error(
            findError
        );

        return;

    }


    if (existing) {

        await supabaseClient
            .from("likes")
            .delete()
            .eq(
                "post_id",
                postId
            )
            .eq(
                "user_id",
                currentUser.id
            );

    } else {

        await supabaseClient
            .from("dislikes")
            .delete()
            .eq(
                "post_id",
                postId
            )
            .eq(
                "user_id",
                currentUser.id
            );


        const {
            error
        } =
            await supabaseClient
                .from("likes")
                .insert({

                    post_id:
                        postId,

                    user_id:
                        currentUser.id

                });


        if (error) {

            console.error(
                error
            );

            alert(
                "Não foi possível adicionar o like."
            );

            return;

        }

    }


    await loadCommunityPosts();

}


/* =========================================================
   DISLIKE
   ========================================================= */

async function toggleDislike(postId) {

    if (!currentUser) {
        return;
    }


    const {
        data: existing,
        error: findError
    } =
        await supabaseClient
            .from("dislikes")
            .select("*")
            .eq(
                "post_id",
                postId
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


    if (findError) {

        console.error(
            findError
        );

        return;

    }


    if (existing) {

        await supabaseClient
            .from("dislikes")
            .delete()
            .eq(
                "post_id",
                postId
            )
            .eq(
                "user_id",
                currentUser.id
            );

    } else {

        await supabaseClient
            .from("likes")
            .delete()
            .eq(
                "post_id",
                postId
            )
            .eq(
                "user_id",
                currentUser.id
            );


        const {
            error
        } =
            await supabaseClient
                .from("dislikes")
                .insert({

                    post_id:
                        postId,

                    user_id:
                        currentUser.id

                });


        if (error) {

            console.error(
                error
            );

            alert(
                "Não foi possível adicionar o dislike."
            );

            return;

        }

    }


    await loadCommunityPosts();

}


/* =========================================================
   COMENTÁRIOS
   ========================================================= */

async function loadCommunityPostComments(
    postId,
    container
) {

    container.innerHTML =
        "<div>Carregando comentários...</div>";


    const {
        data: comments,
        error
    } =
        await supabaseClient
            .from("comments")
            .select("*")
            .eq(
                "post_id",
                postId
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            error
        );


        container.innerHTML =
            "<p>Não foi possível carregar os comentários.</p>";


        return;

    }


    let html = "";


    if (!comments.length) {

        html =
            "<div>Nenhum comentário ainda.</div>";

    } else {

        const userIds =
            [
                ...new Set(
                    comments.map(
                        comment =>
                            comment.user_id
                    )
                )
            ];


        const {
            data: profiles
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id,username,display_name"
                )
                .in(
                    "id",
                    userIds
                );


        const profileMap =
            new Map(
                (profiles || [])
                    .map(
                        profile => [
                            profile.id,
                            profile
                        ]
                    )
            );


        html =
            comments
                .map(
                    comment => {

                        const profile =
                            profileMap.get(
                                comment.user_id
                            );


                        const name =
                            profile?.display_name ||
                            profile?.username ||
                            "Usuário";


                        const isOwner =
                            currentUser &&
                            currentUser.id ===
                                comment.user_id;


                        return `

                            <div
                                class="comment"
                                data-comment-id="${escapeHTML(
                                    comment.id
                                )}">

                                <a
                                    href="perfil.html?id=${encodeURIComponent(
                                        comment.user_id
                                    )}">

                                    <strong>
                                        ${escapeHTML(
                                            name
                                        )}
                                    </strong>

                                </a>


                                <span>
                                    ${escapeHTML(
                                        comment.content
                                    )}
                                </span>


                                <small>
                                    ${formatDate(
                                        comment.created_at
                                    )}
                                </small>


                                ${
                                    isOwner
                                        ? `
                                            <button
                                                type="button"
                                                class="comment-delete-button"
                                                data-comment-id="${escapeHTML(
                                                    comment.id
                                                )}">

                                                🗑️ Excluir

                                            </button>
                                          `
                                        : ""
                                }

                            </div>

                        `;

                    }
                )
                .join("");

    }


    html += `

        <form
            class="comment-form"
            data-post-id="${escapeHTML(
                postId
            )}">

            <input
                type="text"
                maxlength="1000"
                placeholder="Escreva um comentário..."
                required>

            <button type="submit">
                COMENTAR
            </button>

        </form>

    `;


    container.innerHTML =
        html;


    setupCommunityCommentForms();

    setupCommunityCommentDeleteButtons();

}


/* =========================================================
   FORMULÁRIOS DE COMENTÁRIO
   ========================================================= */

function setupCommunityCommentForms() {

    document
        .querySelectorAll(
            ".comment-form"
        )
        .forEach(
            form => {

                form.addEventListener(
                    "submit",
                    async function(event) {

                        event.preventDefault();


                        const input =
                            form.querySelector(
                                "input"
                            );


                        const content =
                            input.value.trim();


                        if (!content) {
                            return;
                        }


                        const button =
                            form.querySelector(
                                "button"
                            );


                        if (button) {

                            button.disabled =
                                true;

                            button.textContent =
                                "ENVIANDO...";

                        }


                        const {
                            error
                        } =
                            await supabaseClient
                                .from("comments")
                                .insert({

                                    post_id:
                                        form.dataset.postId,

                                    user_id:
                                        currentUser.id,

                                    content:
                                        content

                                });


                        if (error) {

                            console.error(
                                error
                            );


                            alert(
                                "Não foi possível publicar o comentário."
                            );


                            if (button) {

                                button.disabled =
                                    false;

                                button.textContent =
                                    "COMENTAR";

                            }


                            return;

                        }


                        const container =
                            form.closest(
                                ".comments"
                            );


                        await loadCommunityPostComments(
                            form.dataset.postId,
                            container
                        );

                    }
                );

            }
        );

}


/* =========================================================
   EXCLUIR COMENTÁRIO
   ========================================================= */

function setupCommunityCommentDeleteButtons() {

    document
        .querySelectorAll(
            ".comment-delete-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async function() {

                        const confirmed =
                            confirm(
                                "Tem certeza de que deseja excluir este comentário?"
                            );


                        if (!confirmed) {
                            return;
                        }


                        const commentId =
                            button.dataset.commentId;


                        const {
                            error
                        } =
                            await supabaseClient
                                .from("comments")
                                .delete()
                                .eq(
                                    "id",
                                    commentId
                                )
                                .eq(
                                    "user_id",
                                    currentUser.id
                                );


                        if (error) {

                            console.error(
                                error
                            );


                            alert(
                                "Não foi possível excluir o comentário."
                            );


                            return;

                        }


                        const container =
                            button.closest(
                                ".comments"
                            );


                        const post =
                            container?.closest(
                                ".post"
                            );


                        const postId =
                            post?.dataset.postId;


                        if (
                            container &&
                            postId
                        ) {

                            await loadCommunityPostComments(
                                postId,
                                container
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   OCULTAR POST — INDIVIDUAL
   ========================================================= */

async function hideCommunityPost(postId) {

    if (!currentUser) {
        return;
    }


    if (!confirm("Ocultar esta publicação?")) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("post_hidden")
            .insert({
                post_id: postId,
                user_id: currentUser.id
            });


    if (error && error.code !== "23505") {

        console.error(
            "Erro ao ocultar publicação:",
            error
        );

        alert(
            "Não foi possível ocultar a publicação."
        );

        return;

    }


    await loadCommunityPosts();

}


/* =========================================================
   EXCLUIR POST
   ========================================================= */

async function deleteCommunityPost(postId) {

    const confirmed =
        confirm(
            "Tem certeza de que deseja excluir esta publicação?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("posts")
            .delete()
            .eq(
                "id",
                postId
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (error) {

        console.error(
            error
        );


        alert(
            "Não foi possível excluir a publicação."
        );


        return;

    }


    await loadCommunityPosts();

}


/* =========================================================
   ERRO
   ========================================================= */

function showCommunityError(message) {

    if (communityHeader) {

        communityHeader.innerHTML = `

            <p>
                ❌ ${escapeHTML(message)}
            </p>

        `;

    }


    if (communityDescription) {

        communityDescription.innerHTML =
            "";

    }


    if (communityMembers) {

        communityMembers.innerHTML =
            "";

    }


    if (communityActions) {

        communityActions.innerHTML =
            "";

    }


    if (communityPosts) {

        communityPosts.innerHTML =
            "";

    }

}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        const logged =
            await checkLogin();


        if (!logged) {
            return;
        }


        await loadCommunity();

    }
);
