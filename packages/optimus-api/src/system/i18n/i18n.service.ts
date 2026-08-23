import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { I18nEntryEntity } from "./entities/i18n-entry.entity";

/** 回退源语言:键在目标 locale 缺失时用它顶,它也缺就跳过该键 */
export const DEFAULT_LOCALE = "zh-CN";
const NS_RE = /^[a-z][a-z0-9-]{0,63}$/;
const KEY_RE = /^[a-zA-Z][a-zA-Z0-9._-]{0,127}$/;

@Injectable()
export class I18nService {
    constructor(
        @InjectRepository(I18nEntryEntity)
        private readonly repo: Repository<I18nEntryEntity>,
    ) {}

    async listNamespaces(): Promise<{ namespace: string; count: number }[]> {
        const rows = await this.repo
            .createQueryBuilder("e")
            .select("e.namespace", "namespace")
            .addSelect("COUNT(*)", "count")
            .groupBy("e.namespace")
            .orderBy("e.namespace", "ASC")
            .getRawMany();
        return rows.map((r) => ({ namespace: r.namespace, count: Number(r.count) }));
    }

    async listEntries(namespace: string, page = 1, pageSize = 50, keyword?: string) {
        const qb = this.repo.createQueryBuilder("e").where("e.namespace = :namespace", { namespace });
        if (keyword?.trim()) {
            // key 和译文都搜——找一条文案时通常只记得中文原文
            qb.andWhere("(e.key LIKE :kw OR JSON_SEARCH(e.translations, 'one', :kwRaw) IS NOT NULL)", {
                kw: `%${keyword.trim()}%`,
                kwRaw: `%${keyword.trim()}%`,
            });
        }
        const [list, total] = await qb
            .orderBy("e.key", "ASC")
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return { list, total, page, pageSize };
    }

    private validate(namespace: string, key: string, translations: unknown) {
        if (!NS_RE.test(namespace)) throw new BadRequestException("namespace 需为小写字母开头的 slug");
        if (!KEY_RE.test(key)) throw new BadRequestException("key 需为字母开头的标识符(可含 . _ -)");
        if (!translations || typeof translations !== "object" || Array.isArray(translations)) {
            throw new BadRequestException("translations 需为 { locale: 文本 } 对象");
        }
        for (const [locale, text] of Object.entries(translations as Record<string, unknown>)) {
            if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) throw new BadRequestException(`locale 不合法: ${locale}`);
            if (typeof text !== "string") throw new BadRequestException(`${locale} 的文案必须是字符串`);
        }
    }

    async create(dto: { namespace: string; key: string; translations: Record<string, string>; remark?: string }) {
        this.validate(dto.namespace, dto.key, dto.translations);
        const existing = await this.repo.findOne({ where: { namespace: dto.namespace, key: dto.key } });
        if (existing) throw new BadRequestException(`键已存在: ${dto.namespace}.${dto.key}`);
        return this.repo.save(this.repo.create({ ...dto, remark: dto.remark ?? null }));
    }

    async update(id: string, dto: { translations?: Record<string, string>; remark?: string }) {
        const row = await this.repo.findOne({ where: { id } });
        if (!row) throw new NotFoundException("键不存在");
        if (dto.translations !== undefined) {
            this.validate(row.namespace, row.key, dto.translations);
            row.translations = dto.translations;
        }
        if (dto.remark !== undefined) row.remark = dto.remark || null;
        return this.repo.save(row);
    }

    async remove(id: string) {
        const row = await this.repo.findOne({ where: { id } });
        if (!row) throw new NotFoundException("键不存在");
        await this.repo.remove(row);
    }

    /**
     * 列出某 locale 缺译文的键(带 zh-CN 源文与备注)。
     * 这是给 agent-service 的工具端点之一——Agent 基座不写业务逻辑,
     * "什么算缺失"这种业务判断住在这里
     */
    async listMissing(namespace: string, locale: string) {
        if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) throw new BadRequestException(`locale 不合法: ${locale}`);
        const rows = await this.repo.find({ where: { namespace } });
        if (rows.length === 0) throw new NotFoundException("namespace 不存在");
        return rows
            .filter((r) => r.translations?.[DEFAULT_LOCALE] && !r.translations?.[locale])
            .map((r) => ({ key: r.key, source: r.translations[DEFAULT_LOCALE], remark: r.remark }));
    }

    /** 按 namespace+key 写单条译文。只补缺失——已有译文(人工或先前写入)一律拒绝覆盖 */
    async writeTranslation(namespace: string, key: string, locale: string, text: string) {
        if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) throw new BadRequestException(`locale 不合法: ${locale}`);
        if (!text?.trim()) throw new BadRequestException("text 不能为空");
        const row = await this.repo.findOne({ where: { namespace, key } });
        if (!row) throw new NotFoundException(`键不存在: ${namespace}.${key}`);
        if (row.translations?.[locale]) {
            throw new BadRequestException(`${key} 的 ${locale} 已有译文,不允许覆盖(改译文走管理页编辑)`);
        }
        row.translations = { ...row.translations, [locale]: text.trim() };
        return this.repo.save(row);
    }

    /** 公开读:目标 locale 的扁平键值 map,缺失回退 DEFAULT_LOCALE,再缺跳过 */
    async publicRead(namespace: string, locale: string): Promise<Record<string, string>> {
        const rows = await this.repo.find({ where: { namespace } });
        if (rows.length === 0) throw new NotFoundException("namespace 不存在");
        const out: Record<string, string> = {};
        for (const row of rows) {
            const text = row.translations?.[locale] ?? row.translations?.[DEFAULT_LOCALE];
            if (typeof text === "string" && text !== "") out[row.key] = text;
        }
        return out;
    }

}
