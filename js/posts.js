/* =========================================================
   NOSTAL™ — POSTS
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


const STORAGE_BUCKET =
    "nostal-media";


let currentUser = null;


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


function formatDate(date) {

    return new Date(date).toLocaleString(
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}


/* =========================================================
   USUÁRIO
   ========================================================= */

async function loadCurrentUser() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (
        error ||
        !data.user
    ) {

        alert(
            "Você precisa estar conectado para usar a Nostal™."
        );


        window.location.href =
            "index.html";


        return false;

    }


    currentUser =
        data.user;


    return true;

}


/* =========================================================
   UPLOAD DE ARQUIVO
   ========================================================= */

async function uploadFile(file) {

    if (!file) {

        return null;

    }


    const allowedTypes = [

        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"

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
            "O arquivo não pode ter mais de 10 MB."
        );

    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const fileName =
        `${crypto.randomUUID()}.${extension}`;


    const filePath =
        `${currentUser.id}/${fileName}`;


    const {
        error
    } =
        await supabaseClient
            .storage
            .from(
                STORAGE_BUCKET
            )
            .upload(
                filePath,
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
                filePath
            );


    return data.publicUrl;

}


/* =========================================================
   PUBLICAR
   ========================================================= */

document
    .getElementById("createPostForm")
    ?.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const content =
                document
                    .getElementById(
                        "postContent"
                    )
                    ?.value
                    .trim() ||
                "";


            const imageInput =
                document.getElementById(
                    "postImage"
                );


            const gifInput =
                document.getElementById(
                    "postGif"
                );


            const imageUrl =
                document
                    .getElementById(
                        "postImageUrl"
                    )
                    ?.value
                    .trim() ||
                "";


            const gifUrl =
                document
                    .getElementById(
                        "postGifUrl"
                    )
                    ?.value
                    .trim() ||
                "";


            const imageFile =
                imageInput?.files?.[0];


            const gifFile =
                gifInput?.files?.[0];


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


            const button =
                this.querySelector(
                    "button[type='submit']"
                );


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
                        await uploadFile(
                            imageFile
                        );

                }


                if (gifFile) {

                    finalGifUrl =
                        await uploadFile(
                            gifFile
                        );

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
                                finalGifUrl

                        });


                if (error) {

                    throw error;

                }


                this.reset();


                await loadPosts();


            } catch (error) {

                console.error(
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
    );


/* =========================================================
   MENU DE EMOJIS
   ========================================================= */

const emojiList = [

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


const emojiButton =
    document.getElementById(
        "addEmojiButton"
    );


const emojiMenu =
    document.getElementById(
        "emojiMenu"
    );


if (
    emojiButton &&
    emojiMenu
) {

    emojiMenu.innerHTML =
        emojiList
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


    emojiButton.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();


            emojiMenu.hidden =
                !emojiMenu.hidden;

        }
    );


    emojiMenu.addEventListener(
        "click",
        function(event) {

            const button =
                event.target.closest(
                    ".emoji-option"
                );


            if (!button) {

                return;

            }


            const textarea =
                document.getElementById(
                    "postContent"
                );


            if (textarea) {

                const start =
                    textarea.selectionStart;


                const end =
                    textarea.selectionEnd;


                textarea.value =
                    textarea.value.slice(
                        0,
                        start
                    ) +
                    button.dataset.emoji +
                    textarea.value.slice(
                        end
                    );


                textarea.focus();


                textarea.selectionStart =
                    textarea.selectionEnd =
                        start +
                        button.dataset.emoji.length;

            }


            emojiMenu.hidden =
                true;

        }
    );


    document.addEventListener(
        "click",
        function() {

            emojiMenu.hidden =
                true;

        }
    );

}


/* =========================================================
   CARREGAR POSTS
   ========================================================= */

async function loadPosts() {

    const container =
        document.getElementById(
            "postsFeed"
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
                "hidden",
                false
            )
            .is(
                "community_id",
                null
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(30);


    if (error) {

        console.error(
            error
        );


        container.innerHTML =
            "<p>Não foi possível carregar os posts.</p>";


        return;

    }


    if (!posts.length) {

        container.innerHTML =
            "<p>Ainda não há publicações. Seja o primeiro a postar! 🎉</p>";


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
            .select(
                "id,username,display_name,avatar_url"
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


    container.innerHTML =
        posts
            .map(
                post =>
                    createPostHTML(
                        post,
                        profileMap.get(
                            post.user_id
                        )
                    )
            )
            .join("");


    await loadPostInteractions(
        posts
    );

}


/* =========================================================
   HTML DO POST
   ========================================================= */

function createPostHTML(
    post,
    profile
) {

    const isOwner =
        currentUser &&
        currentUser.id ===
            post.user_id;


    return `

        <article
            class="post"
            data-post-id="${escapeHTML(
                post.id
            )}">

            <div class="post-header">

                <div class="post-avatar">

                    ${
                        profile?.avatar_url
                            ? `
                                <img
                                    src="${escapeHTML(
                                        profile.avatar_url
                                    )}"
                                    alt="">
                              `
                            : "👤"
                    }

                </div>


                <div>

                    <a
                        href="perfil.html?id=${encodeURIComponent(
                            post.user_id
                        )}">

                        <strong>

                            ${escapeHTML(
                                profile?.display_name ||
                                "Usuário"
                            )}

                        </strong>

                    </a>


                    <a
                        href="perfil.html?id=${encodeURIComponent(
                            post.user_id
                        )}"
                        class="post-username">

                        @${escapeHTML(
                            profile?.username ||
                            ""
                        )}

                    </a>

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
                    data-action="like"
                    data-post-id="${escapeHTML(
                        post.id
                    )}">

                    👍

                    <span class="like-count">
                        0
                    </span>

                </button>


                <button
                    data-action="dislike"
                    data-post-id="${escapeHTML(
                        post.id
                    )}">

                    👎

                    <span class="dislike-count">
                        0
                    </span>

                </button>


                <button
                    data-action="comment"
                    data-post-id="${escapeHTML(
                        post.id
                    )}">

                    💬 Comentar

                </button>


                ${
                    isOwner
                        ? `

                            <button
                                data-action="hide"
                                data-post-id="${escapeHTML(
                                    post.id
                                )}">

                                👁️ Ocultar

                            </button>


                            <button
                                data-action="delete"
                                data-post-id="${escapeHTML(
                                    post.id
                                )}">

                                🗑️ Excluir

                            </button>

                          `
                        : ""
                }

            </div>


            <div
                class="comments"
                id="comments-${escapeHTML(
                    post.id
                )}"
                hidden>
            </div>

        </article>

    `;

}


/* =========================================================
   INTERAÇÕES
   ========================================================= */

async function loadPostInteractions(
    posts
) {

    const postIds =
        posts.map(
            post =>
                post.id
        );


    const {
        data: likes
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


    const {
        data: dislikes
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


    posts.forEach(
        function(post) {

            const element =
                document.querySelector(
                    `[data-post-id="${post.id}"]`
                );


            if (!element) {

                return;

            }


            element.querySelector(
                ".like-count"
            ).textContent =
                likes?.filter(
                    like =>
                        like.post_id ===
                        post.id
                ).length ||
                0;


            element.querySelector(
                ".dislike-count"
            ).textContent =
                dislikes?.filter(
                    dislike =>
                        dislike.post_id ===
                        post.id
                ).length ||
                0;

        }
    );


    setupPostButtons();

}


/* =========================================================
   COMENTÁRIOS — ABRIR / FECHAR
   ========================================================= */

async function toggleComments(
    postId
) {

    const container =
        document.getElementById(
            `comments-${postId}`
        );


    if (!container) {

        return;

    }


    if (!container.hidden) {

        container.hidden =
            true;


        return;

    }


    container.hidden =
        false;


    container.innerHTML =
        "<div>Carregando comentários...</div>";


    await loadComments(
        postId
    );

}


/* =========================================================
   CARREGAR COMENTÁRIOS
   ========================================================= */

async function loadComments(
    postId
) {

    const container =
        document.getElementById(
            `comments-${postId}`
        );


    if (!container) {

        return;

    }


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
                                            profile?.display_name ||
                                            "Usuário"
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

            <button
                type="submit">

                COMENTAR

            </button>

        </form>

    `;


    container.innerHTML =
        html;


    setupCommentForms();

    setupCommentDeleteButtons();

}


/* =========================================================
   COMENTAR
   ========================================================= */

function setupCommentForms() {

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


                        await loadComments(
                            form.dataset.postId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   EXCLUIR COMENTÁRIO
   ========================================================= */

function setupCommentDeleteButtons() {

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


                        button.disabled =
                            true;


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


                            button.disabled =
                                false;


                            return;

                        }


                        const container =
                            button.closest(
                                ".comments"
                            );


                        const article =
                            button.closest(
                                ".post"
                            );


                        const postId =
                            article?.dataset.postId;


                        if (
                            container &&
                            postId
                        ) {

                            await loadComments(
                                postId
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   LIKES / DISLIKES
   ========================================================= */

async function toggleLike(
    postId
) {

    const {
        data: existing
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


        await supabaseClient
            .from("likes")
            .insert({

                post_id:
                    postId,

                user_id:
                    currentUser.id

            });

    }


    await loadPosts();

}


async function toggleDislike(
    postId
) {

    const {
        data: existing
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


        await supabaseClient
            .from("dislikes")
            .insert({

                post_id:
                    postId,

                user_id:
                    currentUser.id

            });

    }


    await loadPosts();

}


/* =========================================================
   OCULTAR POST
   ========================================================= */

async function hidePost(
    postId
) {

    if (
        !confirm(
            "Ocultar esta publicação?"
        )
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("posts")
            .update({
                hidden: true
            })
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
            "Não foi possível ocultar a publicação."
        );


        return;

    }


    loadPosts();

}


/* =========================================================
   EXCLUIR POST
   ========================================================= */

async function deletePost(
    postId
) {

    if (
        !confirm(
            "Tem certeza de que deseja excluir esta publicação?"
        )
    ) {

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


    loadPosts();

}


/* =========================================================
   BOTÕES
   ========================================================= */

function setupPostButtons() {

    document
        .querySelectorAll(
            "[data-action='like']"
        )
        .forEach(
            button =>
                button.onclick =
                    () =>
                        toggleLike(
                            button.dataset.postId
                        )
        );


    document
        .querySelectorAll(
            "[data-action='dislike']"
        )
        .forEach(
            button =>
                button.onclick =
                    () =>
                        toggleDislike(
                            button.dataset.postId
                        )
        );


    document
        .querySelectorAll(
            "[data-action='comment']"
        )
        .forEach(
            button =>
                button.onclick =
                    () =>
                        toggleComments(
                            button.dataset.postId
                        )
        );


    document
        .querySelectorAll(
            "[data-action='hide']"
        )
        .forEach(
            button =>
                button.onclick =
                    () =>
                        hidePost(
                            button.dataset.postId
                        )
        );


    document
        .querySelectorAll(
            "[data-action='delete']"
        )
        .forEach(
            button =>
                button.onclick =
                    () =>
                        deletePost(
                            button.dataset.postId
                        )
        );

}


/* =========================================================
   AMIGOS
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


    /*
     * Procuramos todas as amizades aceitas
     * nas quais o usuário atual esteja
     * como solicitante OU destinatário.
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
                `requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
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
                👥 Você ainda não possui amigos.
            </p>

        `;


        return;

    }


    /*
     * Descobrir o ID do outro usuário
     * em cada amizade.
     */

    const friendIds =
        friendships
            .map(
                friendship => {

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
        [
            ...new Set(
                friendIds
            )
        ];


    if (!uniqueFriendIds.length) {

        container.innerHTML = `

            <p>
                👥 Você ainda não possui amigos.
            </p>

        `;


        return;

    }


    /*
     * Carregar os perfis dos amigos.
     */

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
                avatar_url
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
                👥 Não foi possível encontrar os perfis dos seus amigos.
            </p>

        `;


        return;

    }


    /*
     * Organizar alfabeticamente.
     */

    profiles.sort(
        function(a, b) {

            const nameA =
                (
                    a.display_name ||
                    a.username ||
                    "Usuário"
                ).toLowerCase();


            const nameB =
                (
                    b.display_name ||
                    b.username ||
                    "Usuário"
                ).toLowerCase();


            return nameA.localeCompare(
                nameB,
                "pt-BR"
            );

        }
    );


    /*
     * Garantimos uma classe própria
     * para que a lista não seja tratada
     * como a grade de usuários.
     */

    container.className =
        "box-content friends-list";


    container.innerHTML =
        profiles
            .map(
                profile => {

                    const displayName =
                        profile.display_name ||
                        profile.username ||
                        "Usuário";


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


                    return `

                        <div
                            class="user-item">

                            ${avatar}


                            <div
                                class="user-item-info">

                                <a
                                    href="perfil.html?id=${encodeURIComponent(
                                        profile.id
                                    )}">

                                    ${escapeHTML(
                                        displayName
                                    )}

                                </a>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   ABRIR / FECHAR OPÇÕES DE FOTO E GIF
   ========================================================= */

const addImageButton =
    document.getElementById(
        "addImageButton"
    );


const imageOptions =
    document.getElementById(
        "imageOptions"
    );


const addGifButton =
    document.getElementById(
        "addGifButton"
    );


const gifOptions =
    document.getElementById(
        "gifOptions"
    );


if (
    addImageButton &&
    imageOptions
) {

    addImageButton.addEventListener(
        "click",
        function() {

            imageOptions.hidden =
                !imageOptions.hidden;

        }
    );

}


if (
    addGifButton &&
    gifOptions
) {

    addGifButton.addEventListener(
        "click",
        function() {

            gifOptions.hidden =
                !gifOptions.hidden;

        }
    );

}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        if (
            await loadCurrentUser()
        ) {

            await loadPosts();

            await loadFriends();

        }

    }
);
