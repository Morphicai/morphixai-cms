import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    registerDecorator,
    ValidationOptions,
} from "class-validator";
import { Injectable } from "@nestjs/common";

@ValidatorConstraint({ name: "coverImagesLimit", async: false })
@Injectable()
export class CoverImagesLimitConstraint implements ValidatorConstraintInterface {
    validate(coverImages: string[], args: ValidationArguments) {
        // This will be enhanced when we have access to category config
        // For now, we'll do basic validation
        if (!coverImages || !Array.isArray(coverImages)) {
            return true; // Let other validators handle this
        }

        // Default limit if no category config is available
        const defaultLimit = 5;
        return coverImages.length <= defaultLimit;
    }

    defaultMessage(args: ValidationArguments) {
        return "Cover images exceed the limit allowed for this category";
    }
}

export function IsCoverImagesValid(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: CoverImagesLimitConstraint,
        });
    };
}
