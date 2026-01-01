export class Article {
    constructor(attrs) {
        Object.assign(this, attrs);
    }
}
export const insArticle = new Article({
    id: 1,
    title: "11010101",
    description: "u no u",
    isPublished: false,
    authorId: 1,
});
