/* =========================================================
   NOSTAL™ — PERFIL
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


let currentUser = null;
let profileUserId = null;


/* =========================================================
   UTILITÁRIO
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

async function initProfile() {

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


        return;

    }


    currentUser =
        data.user;


    /*
     * O padrão oficial do Nostal™ é:
     *
     * perfil.html?id=UUID
     *
     * ?user=UUID continua funcionando
     * para compatibilidade com links antigos.
     */

    const params =
        new URLSearchParams(
            window.location.search
        );


    profileUserId =
        params.get("id") ||
        params.get("user") ||
        currentUser.id;


    await loadProfile(
        profileUserId
    );

}


/* =========================================================
   PERFIL
   ========================================================= */

async function loadProfile(
    userId
) {

    const {
        data: profile,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq(
                "id",
                userId
            )
            .single();


    if (error) {

        console.error(
            "Erro ao carregar perfil:",
            error
        );


        alert(
            "Perfil não encontrado."
        );


        return;

    }


    const name =
        document.getElementById(
            "profileName"
        );


    const username =
        document.getElementById(
            "profileUsername"
        );


    const bio =
        document.getElementById(
            "profileBio"
        );


    const status =
        document.getElementById(
            "profileStatus"
        );


    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    const cover =
        document.getElementById(
            "profileCover"
        );


    /* =====================================================
       NOME
       ===================================================== */

    if (name) {

        name.textContent =
            profile.display_name ||
            profile.username ||
            "Usuário";

    }


    /* =====================================================
       USUÁRIO
       ===================================================== */

    if (username) {

        username.textContent =
            profile.username
                ? "@" + profile.username
                : "";

    }


    /* =====================================================
       BIO
       ===================================================== */

    if (bio) {

        bio.textContent =
            profile.bio ||
            "Este usuário ainda não escreveu uma biografia.";

    }


    /* =====================================================
       STATUS
       ===================================================== */

    if (status) {

        status.textContent =
            profile.status ||
            "Nenhum status definido.";

        status.classList.remove(
            "loading"
        );

    }


    /* =====================================================
       AVATAR
       ===================================================== */

    if (avatar) {

        avatar.innerHTML =
            profile.avatar_url
                ? `
                    <img
                        src="${escapeHTML(
                            profile.avatar_url
                        )}"
                        alt="Foto de perfil">
                  `
                : "👤";

    }


    /* =====================================================
       CAPA
       ===================================================== */

    if (cover) {

        const placeholder =
            document.getElementById(
                "profileCoverPlaceholder"
            );


        if (profile.cover_url) {

            cover.style.backgroundImage =
                `url("${escapeHTML(
                    profile.cover_url
                )}")`;

        }


        if (placeholder) {

            placeholder.remove();

        }

    }


    /* =====================================================
       CONFIGURAÇÕES
       ===================================================== */

    const settings =
        document.getElementById(
            "profileSettings"
        );


    if (settings) {

        settings.hidden =
            profileUserId !==
            currentUser.id;

    }


    /* =====================================================
       POSTS
       ===================================================== */

    await loadProfilePosts(
        userId
    );


    /* =====================================================
       AMIGOS
       ===================================================== */

    await loadFriends(
        userId
    );

}


/* =========================================================
   AMIGOS
   ========================================================= */

async function loadFriends(
    userId
) {

    const container =
        document.getElementById(
            "profileFriends"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="online-loading">
            👥 Carregando amigos...
        </div>

    `;


    /*
     * Procuramos amizades aceitas onde o usuário
     * esteja em qualquer um dos dois lados.
     */

    const {
        data: friendships,
        error: friendsError
    } =
        await supabaseClient
            .from("friends")
            .select(`
                id,
                requester_id,
                receiver_id,
                status,
                created_at
            `)
            .eq(
                "status",
                "accepted"
            )
            .or(
                `requester_id.eq.${userId},receiver_id.eq.${userId}`
            );


    if (friendsError) {

        console.error(
            "Erro ao carregar amizades:",
            friendsError
        );


        container.innerHTML = `
            <p>
                ❌ Não foi possível carregar os amigos.
            </p>
        `;


        return;

    }


    if (
        !friendships ||
        !friendships.length
    ) {

        container.innerHTML = `
            <p>
                👥 Este usuário ainda não possui amigos.
            </p>
        `;


        return;

    }


    /*
     * Descobrir quem é o outro usuário em cada amizade.
     */

    const friendIds =
        friendships
            .map(
                friendship => {

                    if (
                        friendship.requester_id ===
                        userId
                    ) {

                        return friendship.receiver_id;

                    }


                    return friendship.requester_id;

                }
            )
            .filter(Boolean);


    const uniqueFriendIds =
        [...new Set(friendIds)];


    if (!uniqueFriendIds.length) {

        container.innerHTML = `
            <p>
                👥 Este usuário ainda não possui amigos.
            </p>
        `;


        return;

    }


    /* =====================================================
       CARREGAR PERFIS DOS AMIGOS
       ===================================================== */

    const {
        data: profiles,
        error: profilesError
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
                uniqueFriendIds
            );


    if (profilesError) {

        console.error(
            "Erro ao carregar perfis dos amigos:",
            profilesError
        );


        container.innerHTML = `
            <p>
                ❌ Não foi possível carregar os amigos.
            </p>
        `;


        return;

    }


    if (
        !profiles ||
        !profiles.length
    ) {

        container.innerHTML = `
            <p>
                👥 Este usuário ainda não possui amigos.
            </p>
        `;


        return;

    }


    /*
     * Ordenar alfabeticamente.
     */

    profiles.sort(
        function(a, b) {

            const nameA =
                (
                    a.display_name ||
                    a.username ||
                    ""
                ).toLowerCase();


            const nameB =
                (
                    b.display_name ||
                    b.username ||
                    ""
                ).toLowerCase();


            return nameA.localeCompare(
                nameB
            );

        }
    );


    container.innerHTML =
        `<div class="users-list profile-friends-list"></div>`;


    const list =
        container.querySelector(
            ".profile-friends-list"
        );


    profiles.forEach(
        function(profile) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "user-item";


            const displayName =
                profile.display_name ||
                profile.username ||
                "Usuário";


            const username =
                profile.username
                    ? "@" +
                      profile.username
                    : "";


            const avatar =
                profile.avatar_url
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
                        <div
                            class="user-avatar-placeholder">

                            👤

                        </div>
                      `;


            item.innerHTML = `

                ${avatar}

                <div class="user-item-info">

                    <a
                        href="perfil.html?id=${encodeURIComponent(
                            profile.id
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

                </div>

            `;


            list.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   POSTS DO PERFIL
   ========================================================= */

async function loadProfilePosts(
    userId
) {

    const container =
        document.getElementById(
            "profilePosts"
        );


    if (!container) {
        return;
    }


    const {
        data: posts,
        error
    } =
        await supabaseClient
            .from("posts")
            .select("*")
            .eq(
                "user_id",
                userId
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
            error
        );


        container.innerHTML =
            "<p>Não foi possível carregar as publicações.</p>";


        return;

    }


    if (
        !posts ||
        !posts.length
    ) {

        container.innerHTML =
            "<p>Este usuário ainda não publicou nada.</p>";


        return;

    }


    container.innerHTML =
        posts
            .map(
                post => `

                    <article class="post">

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
                                        alt="">
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
                                        alt="">
                                  `
                                : ""
                        }

                    </article>

                `
            )
            .join("");

}


/* =========================================================
   CONFIGURAÇÕES
   ========================================================= */

document
    .getElementById(
        "profileSettings"
    )
    ?.addEventListener(
        "click",
        function() {

            window.location.href =
                "configuracoes.html";

        }
    );


/* =========================================================
   INICIALIZAÇÃO DO DOCUMENTO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initProfile
);
