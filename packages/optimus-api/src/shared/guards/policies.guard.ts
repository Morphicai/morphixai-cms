import { Injectable, CanActivate, ForbiddenException, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ForbiddenError, subject } from "@casl/ability";

import { PolicyHandler } from "../types/casl.ability";
import { CaslAbilityFactory } from "../casl/casl-ability.factory";
import { CHECK_POLICIES_KEY } from "../decorators/use-ability.decorator";

@Injectable()
export class PoliciesGuard implements CanActivate {
    constructor(private reflector: Reflector, private caslAbilityFactory: CaslAbilityFactory) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const policyHandlers = this.reflector.get<PolicyHandler[]>(CHECK_POLICIES_KEY, context.getHandler()) || [];
        const { user } = context.switchToHttp().getRequest();
        const userAbility = this.caslAbilityFactory.createDynamicRule(user) as any;
        const canActivate: boolean = policyHandlers.every((handler) => {
            return this.execPolicyHandler(handler, userAbility);
        });

        if (!canActivate) {
            throw new ForbiddenException("请勿越权操作");
        }
        return canActivate;
    }

    private execPolicyHandler(handler: PolicyHandler, ability) {
        try {
            const forbiddenErrorIns = ForbiddenError.from(ability);
            const _handler = typeof handler === "function" ? handler : handler.handle;
            _handler(forbiddenErrorIns, ability);
            return true;
        } catch (error) {
            return false;
        }
    }
}
