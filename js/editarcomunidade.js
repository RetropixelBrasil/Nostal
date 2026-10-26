
/* =========================================================
   NOSTAL™ — EDITAR COMUNIDADE
   ========================================================= */

const SUPABASE_URL = "https://ckevzcryjtivbrbsnhyq.supabase.co";
const SUPABASE_KEY = "sb_publishable_seTOWKCN-oD-aMw4FkNuuQ_6k5JVsnT";
const STORAGE_BUCKET = "nostal-media";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let currentUser = null;
let currentCommunity = null;
let currentRole = null;

const editLoading = document.getElementById("editLoading");
const editError = document.getElementById("editError");
const communityEditor = document.getElementById("communityEditor");
const editorRole = document.getElementById("editorRole");
const settingsForm = document.getElementById("communitySettingsForm");
const adminManagementBox = document.getElementById("adminManagementBox");
const communityAdmins = document.getElementById("communityAdmins");
const adminMessage = document.getElementById("adminMessage");

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getCommunityId() {
    return new URLSearchParams(window.location.search).get("id");
}

function showError(message) {
    editLoading.hidden = true;
    communityEditor.hidden = true;
    adminManagementBox.hidden = true;
    editError.hidden = false;
    editError.textContent = message;
}

function setAdminMessage(message, isError = false) {
    adminMessage.textContent = message;
    adminMessage.style.color = isError ? "#b00020" : "#167a25";
}

async function checkLogin() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
        showError("Entre na sua conta para editar uma comunidade.");
        return false;
    }

    currentUser = data.user;
    return true;
}

/* =========================================================
   CARREGAR COMUNIDADE E VERIFICAR PERMISSÕES
   ========================================================= */

async function loadEditor() {
    const communityId = getCommunityId();

    if (!communityId) {
        showError("Comunidade não especificada. Abra a página com ?id=ID.");
        return;
    }

    const { data: community, error } = await supabaseClient
        .from("communities")
        .select("id, name, description, creator_id, avatar_url")
        .eq("id", communityId)
        .maybeSingle();

    if (error || !community) {
        console.error("Erro ao carregar comunidade:", error);
        showError("Não foi possível encontrar esta comunidade.");
        return;
    }

    currentCommunity = community;

    const isCreator = community.creator_id === currentUser.id;
    let isAdmin = false;

    if (!isCreator) {
        const { data: membership, error: membershipError } =
            await supabaseClient
                .from("community_members")
                .select("role")
                .eq("community_id", community.id)
                .eq("user_id", currentUser.id)
                .maybeSingle();

        if (membershipError) {
            console.error("Erro ao verificar cargo:", membershipError);
            showError("Não foi possível verificar suas permissões.");
            return;
        }

        isAdmin = membership?.role === "admin";
    }

    if (!isCreator && !isAdmin) {
        showError("Acesso negado. Somente o criador e os administradores podem editar esta comunidade.");
        return;
    }

    currentRole = isCreator ? "creator" : "admin";

    editLoading.hidden = true;
    editError.hidden = true;
    communityEditor.hidden = false;
    adminManagementBox.hidden = !isCreator;

    editorRole.textContent = isCreator
        ? "👑 Você é o criador desta comunidade."
        : "🛡️ Você é administrador desta comunidade.";

    document.title = "Nostal™ — Editar " + community.name;

    document.getElementById("communityName").value = community.name || "";
    document.getElementById("communityDescriptionInput").value =
        community.description || "";
    document.getElementById("communityAvatarUrl").value =
        community.avatar_url || "";

    document.getElementById("backToCommunity").href =
        "comunidade.html?id=" + encodeURIComponent(community.id);

    if (isCreator) {
        await loadAdmins();
    }
}

/* =========================================================
   ENVIAR IMAGEM DA COMUNIDADE
   ========================================================= */

async function uploadCommunityAvatar(file) {
    if (!file) return null;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (!allowedTypes.includes(file.type)) {
        throw new Error("Formato de imagem não permitido.");
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error("A imagem não pode ter mais de 10 MB.");
    }

    const extension = file.name.split(".").pop().toLowerCase();
    const path =
        `${currentUser.id}/community-${currentCommunity.id}-${crypto.randomUUID()}.${extension}`;

    const { error } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
        });

    if (error) throw error;

    const { data } = supabaseClient.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path);

    return data.publicUrl;
}

/* =========================================================
   SALVAR INFORMAÇÕES
   ========================================================= */

settingsForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!currentCommunity || !currentUser) return;

    const name = document.getElementById("communityName").value.trim();
    const description =
        document.getElementById("communityDescriptionInput").value.trim();
    const avatarInput =
        document.getElementById("communityAvatarUrl").value.trim();
    const avatarFile =
        document.getElementById("communityAvatarFile").files[0];

    if (name.length < 2 || name.length > 80) {
        alert("O nome deve ter entre 2 e 80 caracteres.");
        return;
    }

    if (description.length > 2000) {
        alert("A descrição pode ter no máximo 2000 caracteres.");
        return;
    }

    const button = document.getElementById("saveCommunityButton");
    button.disabled = true;
    button.textContent = "SALVANDO...";

    try {
        let avatarUrl = avatarInput || null;

        if (avatarFile) {
            avatarUrl = await uploadCommunityAvatar(avatarFile);
        }

        const { error } = await supabaseClient.rpc(
            "update_community_settings",
            {
                p_community_id: currentCommunity.id,
                p_name: name,
                p_description: description,
                p_avatar_url: avatarUrl
            }
        );

        if (error) throw error;

        currentCommunity.name = name;
        currentCommunity.description = description;
        currentCommunity.avatar_url = avatarUrl;

        alert("Comunidade atualizada com sucesso!");
        window.location.href =
            "comunidade.html?id=" + encodeURIComponent(currentCommunity.id);

    } catch (error) {
        console.error("Erro ao salvar comunidade:", error);
        alert("Não foi possível salvar as alterações: " + error.message);
    } finally {
        button.disabled = false;
        button.textContent = "SALVAR ALTERAÇÕES";
    }
});

/* =========================================================
   CARREGAR ADMINISTRADORES
   ========================================================= */

async function loadAdmins() {
    if (!currentCommunity || currentRole !== "creator") return;

    communityAdmins.innerHTML =
        '<div class="posts-loading">Carregando administradores...</div>';

    const { data: memberships, error } = await supabaseClient
        .from("community_members")
        .select("user_id")
        .eq("community_id", currentCommunity.id)
        .eq("role", "admin");

    if (error) {
        console.error("Erro ao carregar administradores:", error);
        communityAdmins.textContent = "Não foi possível carregar os administradores.";
        return;
    }

    if (!memberships?.length) {
        communityAdmins.textContent = "Ainda não há administradores.";
        return;
    }

    const userIds = memberships.map(item => item.user_id);

    const { data: profiles, error: profilesError } = await supabaseClient
        .from("profiles")
        .select("id, username, display_name")
        .in("id", userIds);

    if (profilesError) {
        console.error("Erro ao carregar perfis:", profilesError);
        communityAdmins.textContent = "Não foi possível carregar os perfis.";
        return;
    }

    const profileMap = new Map(
        (profiles || []).map(profile => [profile.id, profile])
    );

    communityAdmins.replaceChildren();

    memberships.forEach(membership => {
        const profile = profileMap.get(membership.user_id);
        if (!profile) return;

        const item = document.createElement("div");
        item.className = "user-item";

        const info = document.createElement("div");
        info.className = "user-item-info";

        const name = document.createElement("strong");
        name.textContent = profile.display_name || profile.username || "Usuário";

        const username = document.createElement("p");
        username.textContent = "@" + profile.username;

        const demoteButton = document.createElement("button");
        demoteButton.type = "button";
        demoteButton.className = "community-cancel-button";
        demoteButton.textContent = "REMOVER ADMIN";
        demoteButton.addEventListener("click", () => {
            changeAdminRole(profile.username, "demote", demoteButton);
        });

        info.append(name, username, demoteButton);
        item.appendChild(info);
        communityAdmins.appendChild(item);
    });
}

/* =========================================================
   PROMOVER OU REBAIXAR — SOMENTE CRIADOR
   ========================================================= */

document.getElementById("promoteAdminForm").addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();

        if (currentRole !== "creator" || !currentCommunity) {
            setAdminMessage("Somente o criador pode promover membros.", true);
            return;
        }

        const input = document.getElementById("memberUsername");
        const username = input.value.trim();

        if (!username) {
            setAdminMessage("Digite o @username do membro.", true);
            return;
        }

        const button = document.getElementById("promoteAdminButton");
        button.disabled = true;
        button.textContent = "PROCESSANDO...";

        try {
            await changeAdminRole(username, "promote");
            input.value = "";
        } finally {
            button.disabled = false;
            button.textContent = "TORNAR ADMINISTRADOR(A)";
        }
    }
);

async function changeAdminRole(username, action, button = null) {
    if (currentRole !== "creator" || !currentCommunity) {
        setAdminMessage("Somente o criador pode alterar cargos.", true);
        return;
    }

    if (action === "demote" &&
        !confirm(`Deseja remover @${username} do cargo de administrador?`)) {
        return;
    }

    if (button) {
        button.disabled = true;
    }

    try {
        const { error } = await supabaseClient.rpc(
            "manage_community_admin",
            {
                p_community_id: currentCommunity.id,
                p_username: username,
                p_action: action
            }
        );

        if (error) throw error;

        setAdminMessage(
            action === "promote"
                ? `@${username.replace(/^@/, "")} agora é administrador(a)!`
                : `O cargo de @${username.replace(/^@/, "")} foi removido.`
        );

        await loadAdmins();

    } catch (error) {
        console.error("Erro ao alterar cargo:", error);
        setAdminMessage(error.message || "Não foi possível alterar o cargo.", true);
    } finally {
        if (button) button.disabled = false;
    }
}



async function renderCommunityActions() {
    if (!communityActions || !currentCommunity) return;

    const isCreator =
        currentUser &&
        currentCommunity.creator_id === currentUser.id;

    let membership = null;

    if (currentUser && !isCreator) {
        const { data, error } = await supabaseClient
            .from("community_members")
            .select("role")
            .eq("community_id", currentCommunity.id)
            .eq("user_id", currentUser.id)
            .maybeSingle();

        if (error) {
            console.error("Erro ao verificar participação:", error);
        } else {
            membership = data;
        }
    }

    const isMember = !!membership;
    const isAdmin = membership?.role === "admin";
    const editLink = `
        <p>
            <a class="login-button"
               href="editarcomunidade.html?id=${encodeURIComponent(currentCommunity.id)}">
                ⚙️ EDITAR COMUNIDADE
            </a>
        </p>
    `;

    if (isCreator) {
        communityActions.innerHTML = `
            <p>👑 Você criou esta comunidade.</p>
            ${editLink}
        `;
        return;
    }

    if (isAdmin) {
        communityActions.innerHTML = `
            <p>🛡️ Você é administrador desta comunidade.</p>
            ${editLink}
            <button type="button"
                    id="leaveCommunityButton"
                    class="community-leave-button">
                ❌ Sair da comunidade
            </button>
        `;

        document.getElementById("leaveCommunityButton")
            ?.addEventListener("click", leaveCommunity);
        return;
    }

    if (isMember) {
        communityActions.innerHTML = `
            <p>✅ Você faz parte desta comunidade.</p>
            <button type="button"
                    id="leaveCommunityButton"
                    class="community-leave-button">
                ❌ Sair da comunidade
            </button>
        `;

        document.getElementById("leaveCommunityButton")
            ?.addEventListener("click", leaveCommunity);
        return;
    }

    communityActions.innerHTML = `
        <p>Você ainda não faz parte desta comunidade.</p>
        <button type="button"
                id="joinCommunityButton"
                class="community-join-button">
            ➕ Entrar na comunidade
        </button>
    `;

    document.getElementById("joinCommunityButton")
        ?.addEventListener("click", joinCommunity);
}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener("DOMContentLoaded", async function () {
    const logged = await checkLogin();
    if (!logged) return;

    await loadEditor();
});
