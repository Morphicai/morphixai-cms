import { Action } from "../../shared/enums/casl.enum";

export const permissions = {
    everyone({ can }) {
        can(Action.Read, "Article", ["title", "description"]).because("不要乱搞");
    },
    admin({ can, cannot }) {
        can(Action.Manage, "all");
        // cannot(Action.Delete, "Article", { isPublished: true });
    },
};
