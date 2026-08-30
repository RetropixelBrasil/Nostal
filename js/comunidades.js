/* =========================================================
   NOSTAL™ — COMUNIDADES
   Sistema de comunidades conectado ao Supabase
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
   MENSAGENS
   ========================================================= */

const WARN_NOT_LOGGED =
    "Você não está logado. Clique em OK para voltar a página inicial e fazer login ou clique em CANCELAR para continuar offline.";


/* =========================================================
   VARIÁVEIS
   ========================================================= */

let currentUser = null;


/* =========================================================
   ELEMENTOS
   ========================================================= */

const communitiesList =
    document.getElementById("communitiesList");

const searchForm =
    document.getElementById("communitySearchForm");

const searchInput =
    document.getElementById("communitySearch");


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
   VERIFICAR USUÁRIO
   ========================================================= */

async function getCurrentUser() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (error) {

        console.error(
            "Erro ao verificar login:",
            error
        );

        return null;
    }


    return data.user || null;
}


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
   CARREGAR COMUNIDADES
   ========================================================= */

async function loadCommunities(
    searchTerm = ""
) {

    if (!communitiesList) {
        return;
    }


    communitiesList.className =
        "communities-list";


    communitiesList.innerHTML = `

        <div class="posts-loading">
            🌎 Carregando comunidades...
        </div>

    `;


    const term =
        searchTerm
            .trim();


    let query =
        supabaseClient
            .from("communities")
            .select(`
                id,
                name,
                description,
                creator_id,
                avatar_url,
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    /*
     * Se houver uma pesquisa, procuramos
     * tanto no nome quanto na descrição.
     */

    if (term) {

        const safeTerm =
            term.replace(
                /[,%()]/g,
                ""
            );


        if (safeTerm) {

            query =
                query.or(
                    `name.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%`
                );

        }

    }


    const {
        data,
        error
    } =
        await query;


    if (error) {

        console.error(
            "Erro ao carregar comunidades:",
            error
        );


        communitiesList.innerHTML = `

            <p>
                ❌ Não foi possível carregar as comunidades.
            </p>

        `;

        return;
    }


    await renderCommunities(
        data || [],
        term
    );

}


/* =========================================================
   CONTAR MEMBROS
   ========================================================= */

async function getMemberCounts(
    communities
) {

    const counts = {};


    if (!communities.length) {
        return counts;
    }


    const ids =
        communities.map(
            community =>
                community.id
        );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("community_members")
            .select("community_id")
            .in(
                "community_id",
                ids
            );


    if (error) {

        console.error(
            "Erro ao contar membros:",
            error
        );

        return counts;
    }


    for (
        const member of data || []
    ) {

        if (
            !counts[
                member.community_id
            ]
        ) {

            counts[
                member.community_id
            ] = 0;

        }


        counts[
            member.community_id
        ]++;

    }


    return counts;

}


/* =========================================================
   VERIFICAR PARTICIPAÇÃO
   ========================================================= */

async function getUserMemberships(
    communities
) {

    const memberships = {};


    if (
        !currentUser ||
        !communities.length
    ) {

        return memberships;

    }


    const ids =
        communities.map(
            community =>
                community.id
        );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("community_members")
            .select("community_id")
            .eq(
                "user_id",
                currentUser.id
            )
            .in(
                "community_id",
                ids
            );


    if (error) {

        console.error(
            "Erro ao verificar participação:",
            error
        );

        return memberships;
    }


    for (
        const member of data || []
    ) {

        memberships[
            member.community_id
        ] = true;

    }


    return memberships;

}


/* =========================================================
   MOSTRAR COMUNIDADES
   ========================================================= */

async function renderCommunities(
    communities,
    searchTerm = ""
) {

    if (!communitiesList) {
        return;
    }


    communitiesList.className =
        "communities-list";


    if (!communities.length) {

        communitiesList.innerHTML = `

            <div class="community-empty">

                🌎 Nenhuma comunidade encontrada.

                ${
                    searchTerm
                        ? `
                            <br><br>
                            Tente procurar por outro nome ou assunto.
                          `
                        : `
                            <br><br>
                            Seja o primeiro a criar uma!
                          `
                }

            </div>

        `;

        return;
    }


    const memberCounts =
        await getMemberCounts(
            communities
        );


    const memberships =
        await getUserMemberships(
            communities
        );


    communitiesList.innerHTML = "";


    communities.forEach(
        function(community) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "community-item";


            const memberCount =
                memberCounts[
                    community.id
                ] || 0;


            const isMember =
                memberships[
                    community.id
                ] === true;


            const isCreator =
                currentUser &&
                community.creator_id ===
                    currentUser.id;


            const avatar =
                community.avatar_url
                    ? `
                        <img
                            src="${escapeHTML(
                                community.avatar_url
                            )}"
                            alt="${escapeHTML(
                                community.name
                            )}"
                            class="community-avatar">
                      `
                    : `
                        <div class="community-avatar-placeholder">
                            🌎
                        </div>
                      `;


            item.innerHTML = `

                ${avatar}

                <div class="community-item-info">

                    <a
                        href="comunidade.html?id=${encodeURIComponent(
                            community.id
                        )}">

                        ${escapeHTML(
                            community.name
                        )}

                    </a>


                    <p>

                        👥 ${memberCount}

                        ${
                            memberCount === 1
                                ? "membro"
                                : "membros"
                        }

                    </p>


                    ${
                        community.description
                            ? `
                                <p>
                                    ${escapeHTML(
                                        community.description
                                    )}
                                </p>
                              `
                            : ""
                    }


                    ${
                        isCreator
                            ? `
                                <p class="community-owner">
                                    👑 Criada por você
                                </p>
                              `
                            : isMember
                                ? `
                                    <button
                                        type="button"
                                        class="community-leave-button"
                                        data-community-id="${community.id}">

                                        🚪 Sair

                                    </button>
                                  `
                                : `
                                    <button
                                        type="button"
                                        class="community-join-button"
                                        data-community-id="${community.id}">

                                        ➕ Entrar

                                    </button>
                                  `
                    }

                </div>

            `;


            communitiesList.appendChild(
                item
            );

        }
    );


    setupCommunityButtons();

}


/* =========================================================
   BOTÕES
   ========================================================= */

function setupCommunityButtons() {

    document
        .querySelectorAll(
            ".community-join-button"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    async function() {

                        await joinCommunity(
                            button.dataset.communityId,
                            button
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".community-leave-button"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    async function() {

                        await leaveCommunity(
                            button.dataset.communityId,
                            button
                        );

                    }
                );

            }
        );

}


/* =========================================================
   ENTRAR NA COMUNIDADE
   ========================================================= */

async function joinCommunity(
    communityId,
    button
) {

    if (!currentUser) {

        const goLogin =
            confirm(
                WARN_NOT_LOGGED
            );


        if (goLogin) {

            window.location.href =
                "index.html";

        }

        return;
    }


    if (button) {

        button.disabled = true;

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
                    communityId,

                user_id:
                    currentUser.id

            });


    if (error) {

        console.error(
            "Erro ao entrar:",
            error
        );


        if (
            error.code === "23505"
        ) {

            alert(
                "Você já faz parte desta comunidade."
            );

        } else {

            alert(
                "Não foi possível entrar nesta comunidade."
            );

        }


        await loadCommunities(
            searchInput
                ? searchInput.value
                : ""
        );

        return;

    }


    await loadCommunities(
        searchInput
            ? searchInput.value
            : ""
    );

}


/* =========================================================
   SAIR DA COMUNIDADE
   ========================================================= */

async function leaveCommunity(
    communityId,
    button
) {

    if (!currentUser) {
        return;
    }


    const confirmed =
        confirm(
            "Tem certeza de que deseja sair desta comunidade?"
        );


    if (!confirmed) {
        return;
    }


    if (button) {

        button.disabled = true;

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
                communityId
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (error) {

        console.error(
            "Erro ao sair:",
            error
        );


        alert(
            "Não foi possível sair desta comunidade."
        );


        await loadCommunities(
            searchInput
                ? searchInput.value
                : ""
        );

        return;

    }


    await loadCommunities(
        searchInput
            ? searchInput.value
            : ""
    );

}


/* =========================================================
   PESQUISA
   ========================================================= */

if (searchForm) {

    searchForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const term =
                searchInput
                    ? searchInput.value.trim()
                    : "";


            await loadCommunities(
                term
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


        await loadCommunities();

    }
);