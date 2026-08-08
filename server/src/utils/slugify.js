export const slugify = (text) => {
    return String(text || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

export const generateUniqueSlug = async (Model, baseText, excludeId = null) => {
    const baseSlug = slugify(baseText) || "item";
    let slug = baseSlug;
    let counter = 2;

    const filter = { slug };
    if (excludeId) filter._id = { $ne: excludeId };

    while (await Model.exists(filter)) {
        slug = `${baseSlug}-${counter++}`;
        filter.slug = slug;
    }

    return slug;
};
