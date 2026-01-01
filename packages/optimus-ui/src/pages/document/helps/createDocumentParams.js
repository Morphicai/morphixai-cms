export default function createDocumentParams({
    source,
    id,
    docKey,
    description,
    content,
    type,
    showOnMenu,
}) {
    return {
        source,
        id,
        docKey,
        description,
        content,
        type: typeof type === "string" ? type : type?.value,
        showOnMenu: Boolean(showOnMenu),
    };
}
