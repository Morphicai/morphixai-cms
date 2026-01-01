import { PureAbility, AnyAbility, AbilityClass, AbilityBuilder, Ability, FieldMatcher } from "@casl/ability";
import { Subject } from "@casl/ability/dist/types/types";
import { permittedFieldsOf, PermittedFieldsOptions } from "@casl/ability/extra";
import { Injectable, UnauthorizedException, NotFoundException, Inject } from "@nestjs/common";
import { CASL_OPTIONS } from "./casl.constants";
import { createAbility, AppAbility } from "./casl.help";
import { Action } from "../enums/casl.enum";
import { UserType } from "../enums/user.enum";

export { Action };
export const nullConditionsMatcher = () => (): boolean => true;
export const allowedFieldsOptions = {
    fieldsFrom: (rule) => {
        return Array.isArray(rule.fields) ? rule.fields : [];
    },
};

@Injectable()
export class CaslAbilityFactory {
    private readonly permissions: any;
    private abilityBuild: AnyAbility;

    constructor(@Inject(CASL_OPTIONS) permissions: any) {
        this.permissions = permissions;
    }

    getAbility(): AnyAbility {
        return this.abilityBuild;
    }

    allowedFieldsOf(user: object, action: string, subject: Subject, options?: PermittedFieldsOptions<any>): string[] {
        return permittedFieldsOf(this.createForUser(user), action, subject, options || allowedFieldsOptions);
    }

    public hasAbility(user: object, action: string, subject: Subject, field?: string): boolean {
        // No user - no access
        if (!user) {
            return false;
        }
        // User exists but no ability metadata - deny access
        if (!action || !subject) {
            return false;
        }
        const userAbilities = this.createForUser(user);
        return userAbilities.can(action, subject, field);
    }

    public assertAbility(user: object, action: string, subject: Subject): void {
        if (!this.hasAbility(user, action, subject)) {
            const userAbilities = this.createForUser(user, Ability);
            const relatedRules = userAbilities.rulesFor(
                action,
                typeof subject === "object" ? subject.constructor : subject,
            );
            if (relatedRules.some((rule) => rule.conditions)) {
                throw new NotFoundException();
            }
            throw new UnauthorizedException();
        }
    }

    createDynamicRule(user: any): AppAbility {
        return createAbility(user.perms);
    }

    createForUser(user: any, abilityClass = Ability): AnyAbility {
        const ability = new AbilityBuilder<Ability<[Action, Subject]>>(abilityClass as AbilityClass<any>);
        const isAdmin = UserType.SUPER_ADMIN === user.type;
        console.log("CASL ------------------> ", user, this.permissions);
        if (isAdmin) {
            // can(Action.Manage, "all"); // read-write access to everything
            this.permissions.admin(ability, user);
        } else {
            this.permissions.everyone(ability, user);
        }

        // For PureAbility skip conditions check, conditions will be available for filtering through @CaslConditions() param
        if (abilityClass === PureAbility) {
            return ability.build({ conditionsMatcher: nullConditionsMatcher });
        }
        return ability.build({
            // Read https://casl.js.org/v5/en/guide/subject-type-detection#use-classes-as-subject-types for details
            // detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
        });
    }
}
