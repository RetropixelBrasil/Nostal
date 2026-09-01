/* =========================================================
   NOSTAL™ — COMUNIDADES
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
let allCommunities = [];


/* =========================================================
   ELEMENTOS
   ========================================================= */

const communitiesList =
    document.getElementById(
        "communitiesList"
    );


const searchForm =
    document.getElementById(
        "communitySearchForm"
    );


const searchInput =
    document.getElementById(
        "communitySearch"
    );


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
   CARREGAR COMUNIDADES
   ========================================================= */

async function loadCommunities() {

    if (!communitiesList) {
        return;
    }


    communitiesList.innerHTML = `

        <div class="posts-loading">
            🌎 Carregando comunidades...
        </div>

    `;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("communities")
            .select("*")
            .order(
                "name",
                {
                    ascending: true
                }
            );


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


    allCommunities =
        data || [];


    await renderCommunities(
        allCommunities
    );

}


/* =========================================================
   MOSTRAR COMUNIDADES
   ========================================================= */

async function renderCommunities(
    communities
) {

    if (!communitiesList) {
        return;
    }


    communitiesList.className =
        "users-list communities-list";


    communitiesList.innerHTML =
        "";


    if (!communities.length) {

        communitiesList.innerHTML = `

            <div class="user-empty">

                🌎 Nenhuma comunidade encontrada.

            </div>

        `;


        return;
    }


    /*
     * Criamos os itens usando a mesma estrutura
     * visual dos usuários.
     */

    for (
        const community of communities
    ) {

        const item =
            document.createElement(
                "div"
            );


        item.className =
            "user-item community-item";


        const communityName =
            community.name ||
            "Comunidade";


        const description =
            community.description ||
            "";


        const image =
            community.image_url ||
            community.avatar_url ||
            "";


        const imageHTML =
            image
                ? `
                    <img
                        src="${escapeHTML(
                            image
                        )}"
                        alt="${escapeHTML(
                            communityName
                        )}"
                        class="user-avatar community-avatar">
                  `
                : `
                    <div
                        class="user-avatar-placeholder community-avatar-placeholder">

                        🌎

                    </div>
                  `;


        /*
         * Link para a comunidade.
         */

        item.innerHTML = `

            ${imageHTML}

            <div class="user-item-info">

                <a
                    href="comunidade.html?id=${encodeURIComponent(
                        community.id
                    )}">

                    ${escapeHTML(
                        communityName
                    )}

                </a>


                ${
                    description
                        ? `
                            <p>
                                ${escapeHTML(
                                    description
                                )}
                            </p>
                          `
                        : ""
                }

            </div>

        `;


        communitiesList.appendChild(
            item
        );

    }

}


/* =========================================================
   PESQUISA
   ========================================================= */

function searchCommunities(
    searchTerm
) {

    const term =
        searchTerm
            .trim()
            .toLowerCase();


    if (!term) {

        renderCommunities(
            allCommunities
        );


        return;

    }


    const results =
        allCommunities.filter(
            function(community) {

                const name =
                    (
                        community.name ||
                        ""
                    ).toLowerCase();


                const description =
                    (
                        community.description ||
                        ""
                    ).toLowerCase();


                return (
                    name.includes(term) ||
                    description.includes(term)
                );

            }
        );


    renderCommunities(
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


            searchCommunities(
                searchInput.value
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

        currentUser =
            await getCurrentUser();


        await loadCommunities();

    }
);
