import { Injectable } from "@nestjs/common";
// import { Cron, CronExpression } from "@nestjs/schedule"; // Unused - all cron jobs commented out
// import fs from "fs"; // Unused
// import color from "../../shared/libs/log.color"; // Unused

@Injectable()
export class ScheduleService {
    // private readonly logger = new Logger(ScheduleService.name); // Unused
    // private loggerDir: string; // Unused

    constructor() {
        // Empty constructor - all schedule functionality removed
    }

    /**
     * 每分钟的第45秒，开始做眼保健操
     */
    // @Cron("45 * * * * *")
    // protectYourEyes() {
    //     console.log(color.greenBG, "");
    //     console.log(color.greenBG, "");
    //     console.log(color.greenBG, "");
    //     console.log(color.greenBG, "");
    //     console.log(color.greenBG, "****** 抬头眺望远处，保护好眼睛呦 ******");
    //     console.log(color.greenBG, "");
    //     console.log(color.greenBG, "");
    //     console.log(color.greenBG, "");
    //     console.log(color.greenBG, "");
    // }

    /**
     * 每月第一天晚上清理一次，理论上 log 应该是转存，而不是清楚
     */
    // @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    // clearLogs() {
    //     this.emptyDir(this.loggerDir);
    // }

    /**
     * 每5分钟清理一次超时的预占用角色和公会
     * 预占用角色和公会超过30分钟未支付将被自动清理
     * 注：游戏特定功能已移除
     */
    // @Cron(CronExpression.EVERY_5_MINUTES)
    // async cleanExpiredReservedCharacters() {
    //     try {
    //         this.logger.log("开始清理超时预占用角色和公会...");
    //         await this.characterService.cleanExpiredReservedCharacters();
    //         await this.guildService.cleanExpiredReservedGuilds();
    //         this.logger.log("清理超时预占用角色和公会完成");
    //     } catch (error) {
    //         this.logger.error(`清理超时预占用角色和公会失败: ${error.message}`, error.stack);
    //     }
    // }

    // emptyDir method removed - no longer needed without cron jobs
}
