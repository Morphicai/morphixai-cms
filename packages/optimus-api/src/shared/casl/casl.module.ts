import { DynamicModule, Module } from "@nestjs/common";
import { CaslAbilityFactory } from "./casl-ability.factory";
import { CASL_OPTIONS } from "./casl.constants";
import { AuthModule } from "../../system/auth/auth.module";

@Module({})
export class CaslModule {
    static register(options: any): DynamicModule {
        return {
            module: CaslModule,
            imports: [AuthModule],
            providers: [
                {
                    provide: CASL_OPTIONS,
                    useValue: options,
                },
                CaslAbilityFactory,
            ],
            exports: [CaslAbilityFactory],
        };
    }
}
