/* =========================================================
   NOSTAL™ — USUÁRIOS
   Lista de usuários da Nostal™
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
   MENSAGEM
   ========================================================= */

const WARN_NOT_LOGGED =
    "Você não está logado. Clique em OK para voltar a página inicial e fazer login ou clique em CANCELAR para continuar offline.";


/* =========================================================
   VARIÁVEIS
   ========================================================= */

let currentUser = null;

let allUsers = [];


/* =========================================================
   ELEMENTOS
   ========================================================= */

const usersList =
    document.getElementById(
        "usersList"
    );


const searchForm =
    document.getElementById(
        "userSearchForm"
    );


const searchInput =
    document.getElementById(
        "userSearch"
    );


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
   USUÁRIO ATUAL
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


/* =========================================================
   VERIFICAR LOGIN
   ========================================================= */

async function checkLogin() {

    currentUser =
        await getCurrentUser();


    if (!currentUser) {

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
   CARREGAR USUÁRIOS
   ========================================================= */

async function loadUsers() {

    if (!usersList) {
        return;
    }


    usersList.innerHTML = `

        <div class="posts-loading">
            👥 Carregando usuários...
        </div>

    `;


    const {
        data,
        error
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
            .order(
                "display_name",
                {
                    ascending: true,
                    nullsFirst: false
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar usuários:",
            error
        );


        usersList.innerHTML = `

            <p>
                ❌ Não foi possível carregar os usuários.
            </p>

        `;


        return;

    }


    allUsers =
        data || [];


    renderUsers(
        allUsers
    );

}


/* =========================================================
   MOSTRAR USUÁRIOS
   ========================================================= */

function renderUsers(
    users
) {

    if (!usersList) {
        return;
    }


    usersList.className =
        "users-list users-directory-list";


    usersList.innerHTML =
        "";


    if (!users.length) {

        usersList.innerHTML = `

            <div class="user-empty">

                👥 Nenhum usuário encontrado.

            </div>

        `;


        return;

    }


    users.forEach(
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


                    ${
                        profile.status
                            ? `
                                <p>
                                    ${escapeHTML(
                                        profile.status
                                    )}
                                </p>
                              `
                            : ""
                    }

                </div>

            `;


            usersList.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   PESQUISA
   ========================================================= */

function searchUsers(
    searchTerm
) {

    const term =
        searchTerm
            .trim()
            .toLowerCase();


    if (!term) {

        renderUsers(
            allUsers
        );


        return;

    }


    const results =
        allUsers.filter(
            function(profile) {

                const name =
                    (
                        profile.display_name ||
                        ""
                    ).toLowerCase();


                const username =
                    (
                        profile.username ||
                        ""
                    ).toLowerCase();


                const status =
                    (
                        profile.status ||
                        ""
                    ).toLowerCase();


                return (
                    name.includes(term) ||
                    username.includes(term) ||
                    status.includes(term)
                );

            }
        );


    renderUsers(
        results
    );

}


/* =========================================================
   FORMULÁRIO DE PESQUISA
   ========================================================= */

if (searchForm) {

    searchForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            searchUsers(
                searchInput.value
            );

        }
    );

}


/* =========================================================
   CARREGAR AMIGOS
   ========================================================= */

async function loadFriends() {

    const container =
        document.getElementById(
            "friendsList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="online-loading">
            👥 Carregando amigos...
        </div>

    `;


    if (!currentUser) {

        container.innerHTML = `
            <p>
                👥 Faça login para ver seus amigos.
            </p>
        `;


        return;

    }


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
                `requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
            );


    if (friendsError) {

        console.error(
            "Erro ao carregar amizades:",
            friendsError
        );


        container.innerHTML = `
            <p>
                ❌ Não foi possível carregar seus amigos.
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
                👥 Você ainda não possui amigos.
            </p>
        `;


        return;

    }


    const friendIds =
        friendships
            .map(
                function(friendship) {

                    if (
                        friendship.requester_id ===
                        currentUser.id
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
                👥 Você ainda não possui amigos.
            </p>
        `;


        return;

    }


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
                ❌ Não foi possível carregar seus amigos.
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
                👥 Você ainda não possui amigos.
            </p>
        `;


        return;

    }


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
        `<div class="users-list friends-sidebar-list"></div>`;


    const list =
        container.querySelector(
            ".friends-sidebar-list"
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

                    ${
                        profile.status
                            ? `
                                <p class="user-status">
                                    ${escapeHTML(
                                        profile.status
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


        await loadUsers();

        await loadFriends();

    }
);
