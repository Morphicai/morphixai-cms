import { Ability, RawRuleOf, ForcedSubject } from "@casl/ability";
import { get } from "lodash";
import { Actions, Subjects } from "./casl.constants";

export type AppAbilities = [
    (typeof Actions)[number],
    (typeof Subjects)[number] | ForcedSubject<Exclude<(typeof Subjects)[number], "all">>,
];
export type AppAbility = Ability<AppAbilities>;
export const createAbility = (rules: RawRuleOf<AppAbility>[]) => new Ability<AppAbilities>(rules);

export const interpolate = (perms: any[], user): any[] => {
    return perms
        .map(({ code }) => {
            try {
                return template2Json(code, user);
            } catch (error) {}
        })
        .filter(Boolean);
};

function template2Json(template: string, vars: object) {
    return JSON.parse(template, (_, rawValue) => {
        if (rawValue[0] !== "$") {
            return rawValue;
        }

        const name = rawValue.slice(2, -1);
        const value = get(vars, name);

        if (typeof value === "undefined") {
            throw new ReferenceError(`Variable ${name} is not defined`);
        }

        return value;
    });
}
