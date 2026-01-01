import { Injectable } from "@nestjs/common";
import { ArticleVersionEntity } from "../entities/article-version.entity";

export interface VersionDiff {
    field: string;
    oldValue: any;
    newValue: any;
    hasChanged: boolean;
}

export interface VersionComparison {
    version1: {
        id: number;
        versionNumber: number;
        createDate: Date;
    };
    version2: {
        id: number;
        versionNumber: number;
        createDate: Date;
    };
    differences: VersionDiff[];
    summary: {
        totalChanges: number;
        changedFields: string[];
    };
}

@Injectable()
export class VersionDiffService {
    compareVersions(version1: ArticleVersionEntity, version2: ArticleVersionEntity): VersionComparison {
        const differences: VersionDiff[] = [];

        // Compare all relevant fields
        const fieldsToCompare = [
            "title",
            "summary",
            "content",
            "coverImages",
            "sortWeight",
            "seoTitle",
            "seoDescription",
            "seoKeywords",
            "status",
        ];

        fieldsToCompare.forEach((field) => {
            const oldValue = version1[field];
            const newValue = version2[field];
            const hasChanged = this.hasFieldChanged(oldValue, newValue);

            differences.push({
                field,
                oldValue,
                newValue,
                hasChanged,
            });
        });

        const changedFields = differences.filter((diff) => diff.hasChanged).map((diff) => diff.field);

        return {
            version1: {
                id: version1.id,
                versionNumber: version1.versionNumber,
                createDate: version1.createDate,
            },
            version2: {
                id: version2.id,
                versionNumber: version2.versionNumber,
                createDate: version2.createDate,
            },
            differences,
            summary: {
                totalChanges: changedFields.length,
                changedFields,
            },
        };
    }

    private hasFieldChanged(oldValue: any, newValue: any): boolean {
        // Handle arrays (like coverImages)
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
            return JSON.stringify(oldValue) !== JSON.stringify(newValue);
        }

        // Handle null/undefined values
        if (oldValue === null || oldValue === undefined) {
            return newValue !== null && newValue !== undefined;
        }

        if (newValue === null || newValue === undefined) {
            return oldValue !== null && oldValue !== undefined;
        }

        // Handle regular values
        return oldValue !== newValue;
    }

    generateContentDiff(oldContent: string, newContent: string): any {
        // This is a simplified diff - in a real implementation, you might want to use
        // a library like 'diff' for more sophisticated text comparison
        return {
            oldContent,
            newContent,
            hasChanged: oldContent !== newContent,
            // You could add more sophisticated diff logic here
            characterChanges: Math.abs(oldContent.length - newContent.length),
        };
    }
}
