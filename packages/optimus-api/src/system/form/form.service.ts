import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ResultData } from "../../shared/utils/result";
import { FormSchemaEntity } from "./entities/form-schema.entity";
import { FormEntryEntity } from "./entities/form-entry.entity";
import { validateSchema, validateEntry, FormSchema } from "./schema-validator";

@Injectable()
export class FormService {
    constructor(
        @InjectRepository(FormSchemaEntity) private readonly schemaRepo: Repository<FormSchemaEntity>,
        @InjectRepository(FormEntryEntity) private readonly entryRepo: Repository<FormEntryEntity>,
    ) {}

    // ── 管理侧 ──────────────────────────────────────────────

    async list(page = 1, pageSize = 20): Promise<ResultData> {
        const [list, total] = await this.schemaRepo.findAndCount({
            order: { updateDate: "DESC" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return ResultData.ok({ list, total });
    }

    async create(name: string, slug: string, schemaJson: unknown): Promise<ResultData> {
        const errors = validateSchema(schemaJson);
        if (errors.length) return ResultData.fail(400, `schema 不合法: ${errors.join("; ")}`);
        if (!/^[a-z0-9-]{2,64}$/.test(slug)) return ResultData.fail(400, "slug 只能是小写字母/数字/短横线");
        const exists = await this.schemaRepo.findOne({ where: { slug } });
        if (exists) return ResultData.fail(400, `slug "${slug}" 已被占用`);
        const saved = await this.schemaRepo.save(
            this.schemaRepo.create({ name, slug, schemaJson: schemaJson as Record<string, unknown> }),
        );
        return ResultData.ok(saved);
    }

    async update(id: string, patch: { name?: string; schemaJson?: unknown; enabled?: number }): Promise<ResultData> {
        const row = await this.schemaRepo.findOne({ where: { id } });
        if (!row) return ResultData.fail(404, "表单不存在");
        if (patch.schemaJson !== undefined) {
            const errors = validateSchema(patch.schemaJson);
            if (errors.length) return ResultData.fail(400, `schema 不合法: ${errors.join("; ")}`);
            row.schemaJson = patch.schemaJson as Record<string, unknown>;
            // 结构变了就是新版本;老数据行上冻结着各自的版本号,互不打扰
            row.schemaVersion += 1;
        }
        if (patch.name !== undefined) row.name = patch.name;
        if (patch.enabled !== undefined) row.enabled = patch.enabled ? 1 : 0;
        const saved = await this.schemaRepo.save(row);
        return ResultData.ok(saved);
    }

    async remove(id: string): Promise<ResultData> {
        const row = await this.schemaRepo.findOne({ where: { id } });
        if (!row) return ResultData.fail(404, "表单不存在");
        await this.entryRepo.delete({ formId: id });
        await this.schemaRepo.delete({ id });
        return ResultData.ok({ id });
    }

    async listEntries(formId: string, page = 1, pageSize = 20): Promise<ResultData> {
        const [list, total] = await this.entryRepo.findAndCount({
            where: { formId },
            order: { createDate: "DESC" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return ResultData.ok({ list, total });
    }

    // ── 公开侧 ──────────────────────────────────────────────
    // 未启用与不存在同样返回 null:公开接口不区分"没有"和"停用",不暴露存在性

    async findEnabledBySlug(slug: string): Promise<FormSchemaEntity | null> {
        const row = await this.schemaRepo.findOne({ where: { slug, enabled: 1 } });
        return row ?? null;
    }

    async submitEntry(form: FormSchemaEntity, data: unknown, sourceIp: string): Promise<ResultData> {
        const errors = validateEntry(form.schemaJson as unknown as FormSchema, data);
        if (errors.length) return ResultData.fail(400, errors[0]);
        const saved = await this.entryRepo.save(
            this.entryRepo.create({
                formId: form.id,
                schemaVersion: form.schemaVersion,
                dataJson: data as Record<string, unknown>,
                sourceIp,
            }),
        );
        return ResultData.ok({ id: saved.id });
    }
}
