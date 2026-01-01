/**
 * dayjs 全局配置
 * 配置必要的插件以支持 Ant Design 5 的日期组件
 */
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

// 扩展 dayjs 插件
dayjs.extend(customParseFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
dayjs.extend(advancedFormat);
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

// 设置中文 locale
dayjs.locale('zh-cn');

export default dayjs;
