import { CustomDecorator, SetMetadata } from "@nestjs/common";
import { PolicyHandler } from "../types/casl.ability";

export const CHECK_POLICIES_KEY = "check_policy";

export function UseAbility(...handlers: PolicyHandler[]): CustomDecorator {
    return SetMetadata(CHECK_POLICIES_KEY, handlers);
}
