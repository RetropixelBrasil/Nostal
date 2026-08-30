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
        data
    } =
        await supabaseClient.auth.getUser();


    if (!data.user) {

        window.location.href =
            "index.html";

        return;
    }


    currentUser =
        data.user;


    /*
     * Se houver ?user=UUID,
     * carregamos aquele usuário.
     *
     * Caso contrário,
     * carregamos o próprio usuário.
     */

    const params =
        new URLSearchParams(
            window.location.search
        );


    profileUserId =
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

        console.error(error);

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


    if (name) {

        name.textContent =
            profile.display_name;

    }


    if (username) {

        username.textContent =
            "@" + profile.username;

    }


    if (bio) {

        bio.textContent =
            profile.bio ||
            "Este usuário ainda não escreveu uma biografia.";

    }


    if (status) {

    status.textContent =
        profile.status ||
        "Nenhum status definido.";

    status.classList.remove(
        "loading"
    );

}


    if (avatar) {

        avatar.innerHTML =
            profile.avatar_url
                ? `
                    <img
                        src="${escapeHTML(profile.avatar_url)}"
                        alt="Foto de perfil">
                  `
                : "👤";

    }


    if (cover) {

    const placeholder =
        document.getElementById(
            "profileCoverPlaceholder"
        );


    if (profile.cover_url) {

        cover.style.backgroundImage =
            `url("${escapeHTML(profile.cover_url)}")`;

    }


    /*
     * A capa terminou de carregar.
     * O placeholder deve desaparecer
     * independentemente de existir uma capa.
     */

    if (placeholder) {

        placeholder.remove();

    }

}


    /*
     * Só mostramos configurações
     * no próprio perfil.
     */

    const settings =
        document.getElementById(
            "profileSettings"
        );


    if (settings) {

        settings.hidden =
            profileUserId !== currentUser.id;

    }


    await loadProfilePosts(
        userId
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

        console.error(error);

        container.innerHTML =
            "<p>Não foi possível carregar as publicações.</p>";

        return;
    }


    if (!posts.length) {

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
                                        src="${escapeHTML(post.image_url)}"
                                        alt="">
                                  `
                                : ""
                        }


                        ${
                            post.gif_url
                                ? `
                                    <img
                                        class="post-image"
                                        src="${escapeHTML(post.gif_url)}"
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


document.addEventListener(
    "DOMContentLoaded",
    initProfile
);